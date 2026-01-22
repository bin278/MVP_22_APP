/**
 * 依赖解析器 - 构建依赖图并检测问题
 */

export interface DependencyNode {
  filePath: string
  imports: string[]
  exports: string[]
}

export interface DependencyIssue {
  type: 'missing' | 'circular' | 'unused'
  message: string
  files: string[]
  severity: 'error' | 'warning'
}

export interface DependencyAnalysis {
  graph: Map<string, DependencyNode>
  issues: DependencyIssue[]
}

/**
 * 提取文件中的导入语句
 */
function extractImports(code: string): string[] {
  const imports: string[] = []

  // 匹配 import ... from '...'
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g
  let match

  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1])
  }

  return imports
}

/**
 * 提取文件中的导出语句
 */
function extractExports(code: string): string[] {
  const exports: string[] = []

  // 匹配 export function/const/class Name
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|let|var|class)\s+(\w+)/g
  let match

  while ((match = exportRegex.exec(code)) !== null) {
    exports.push(match[1])
  }

  // 匹配 export { Name }
  const namedExportRegex = /export\s+\{\s*([^}]+)\s*\}/g
  while ((match = namedExportRegex.exec(code)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0])
    exports.push(...names)
  }

  return exports
}

/**
 * 规范化导入路径
 */
function normalizeImportPath(importPath: string, currentFile: string): string {
  // 处理相对路径
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    // 简化处理：移除 ./ 和 ../
    return importPath.replace(/^\.\.?\//, '')
  }

  // 处理 @ 别名
  if (importPath.startsWith('@/')) {
    return importPath.replace('@/', 'src/')
  }

  return importPath
}

/**
 * 构建依赖图
 */
export function buildDependencyGraph(files: Record<string, string>): Map<string, DependencyNode> {
  const graph = new Map<string, DependencyNode>()

  for (const [filePath, code] of Object.entries(files)) {
    // 只处理 JS/TS 文件
    if (!/\.(jsx?|tsx?)$/.test(filePath)) continue

    const imports = extractImports(code)
    const exports = extractExports(code)

    graph.set(filePath, {
      filePath,
      imports: imports.map(imp => normalizeImportPath(imp, filePath)),
      exports
    })
  }

  return graph
}

/**
 * 检测循环依赖
 */
function detectCircularDependencies(graph: Map<string, DependencyNode>): DependencyIssue[] {
  const issues: DependencyIssue[] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(filePath: string, path: string[]): boolean {
    if (recursionStack.has(filePath)) {
      // 找到循环依赖
      const cycleStart = path.indexOf(filePath)
      const cycle = path.slice(cycleStart).concat(filePath)

      issues.push({
        type: 'circular',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        files: cycle,
        severity: 'warning'
      })
      return true
    }

    if (visited.has(filePath)) return false

    visited.add(filePath)
    recursionStack.add(filePath)

    const node = graph.get(filePath)
    if (node) {
      for (const importPath of node.imports) {
        // 查找匹配的文件
        const matchingFile = Array.from(graph.keys()).find(f =>
          f.includes(importPath) || importPath.includes(f.replace(/\.(jsx?|tsx?)$/, ''))
        )

        if (matchingFile) {
          dfs(matchingFile, [...path, filePath])
        }
      }
    }

    recursionStack.delete(filePath)
    return false
  }

  for (const filePath of graph.keys()) {
    if (!visited.has(filePath)) {
      dfs(filePath, [])
    }
  }

  return issues
}

/**
 * 检测缺失的依赖
 */
function detectMissingDependencies(graph: Map<string, DependencyNode>): DependencyIssue[] {
  const issues: DependencyIssue[] = []
  const allFiles = new Set(graph.keys())

  for (const [filePath, node] of graph.entries()) {
    for (const importPath of node.imports) {
      // 跳过外部依赖（npm 包）
      if (!importPath.startsWith('.') && !importPath.startsWith('@/') && !importPath.startsWith('src/')) {
        continue
      }

      // 查找匹配的文件
      const matchingFile = Array.from(allFiles).find(f =>
        f.includes(importPath) || importPath.includes(f.replace(/\.(jsx?|tsx?)$/, ''))
      )

      if (!matchingFile) {
        issues.push({
          type: 'missing',
          message: `Missing dependency: "${importPath}" imported in ${filePath}`,
          files: [filePath],
          severity: 'error'
        })
      }
    }
  }

  return issues
}

/**
 * 检测未使用的导出
 */
function detectUnusedExports(graph: Map<string, DependencyNode>): DependencyIssue[] {
  const issues: DependencyIssue[] = []
  const usedExports = new Set<string>()

  // 收集所有被导入的内容
  for (const node of graph.values()) {
    for (const importPath of node.imports) {
      usedExports.add(importPath)
    }
  }

  // 检查未被使用的导出
  for (const [filePath, node] of graph.entries()) {
    const unusedExports = node.exports.filter(exp => {
      // 检查是否有文件导入了这个导出
      const isUsed = Array.from(graph.values()).some(otherNode =>
        otherNode.imports.some(imp => imp.includes(filePath.replace(/\.(jsx?|tsx?)$/, '')))
      )
      return !isUsed && exp !== 'default' // default 导出通常是主要导出
    })

    if (unusedExports.length > 0) {
      issues.push({
        type: 'unused',
        message: `Unused exports in ${filePath}: ${unusedExports.join(', ')}`,
        files: [filePath],
        severity: 'warning'
      })
    }
  }

  return issues
}

/**
 * 分析依赖关系
 */
export function analyzeDependencies(files: Record<string, string>): DependencyAnalysis {
  const graph = buildDependencyGraph(files)
  const issues: DependencyIssue[] = []

  // 执行各项检查
  issues.push(...detectCircularDependencies(graph))
  issues.push(...detectMissingDependencies(graph))
  // 未使用导出的检查可能产生误报，暂时注释
  // issues.push(...detectUnusedExports(graph))

  return { graph, issues }
}
