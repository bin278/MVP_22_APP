import { NextRequest, NextResponse } from 'next/server'

/**
 * 静态 HTML 预览 API
 *
 * 当代码太复杂无法实时预览时，提供简化的静态 HTML 展示
 * 这不会执行 React 组件，而是展示代码的结构和布局
 */
export async function POST(request: NextRequest) {
  try {
    const { code, device = 'desktop' } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    // 设置设备尺寸
    const deviceWidths = {
      desktop: '100%',
      tablet: '768px',
      mobile: '375px'
    }

    const deviceWidth = deviceWidths[device as keyof typeof deviceWidths] || deviceWidths.desktop

    // 生成简化的静态 HTML
    // 尝试提取组件的静态结构和样式
    const staticHtml = generateStaticHtml(code, deviceWidth)

    return new NextResponse(staticHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    console.error('Error generating static preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate static preview: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * 生成静态 HTML 预览
 * 从 React 代码中提取结构化信息，生成简化的可视化展示
 */
function generateStaticHtml(code: string, deviceWidth: string): string {
  // 提取组件名称
  const componentNameMatch = code.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/)
  const componentName = componentNameMatch ? componentNameMatch[1] : 'Component'

  // 提取 JSX 结构（简化版）
  const jsxStructure = extractJsxStructure(code)

  // 提取使用的样式类名
  const styleClasses = extractStyleClasses(code)

  // 提取组件 props
  const props = extractComponentProps(code)

  // 提取导入的依赖
  const imports = extractImports(code)

  // 统计代码信息
  const stats = {
    lines: code.split('\n').length,
    size: Math.round(code.length / 1024),
    hasHooks: /use(State|Effect|Callback|Memo|Ref|Context)/.test(code),
    hasEventHandlers: /on[A-Z][a-zA-Z]+/.test(code),
    componentCount: (code.match(/<[A-Z][a-zA-Z]*/g) || []).length
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>静态预览 - ${componentName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      max-width: ${deviceWidth};
      width: 100%;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .header .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      margin-top: 8px;
    }

    .content {
      padding: 24px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title::before {
      content: '';
      width: 4px;
      height: 16px;
      background: #667eea;
      border-radius: 2px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .info-card {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }

    .info-card .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .info-card .value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .code-preview {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      max-height: 400px;
      overflow-y: auto;
    }

    .structure-tree {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
    }

    .structure-item {
      padding: 4px 0;
      color: #333;
    }

    .structure-item.indent-1 { padding-left: 20px; }
    .structure-item.indent-2 { padding-left: 40px; }
    .structure-item.indent-3 { padding-left: 60px; }

    .tag {
      color: #22863a;
      font-weight: 600;
    }

    .component {
      color: #6f42c1;
      font-weight: 600;
    }

    .props {
      color: #005cc5;
    }

    .imports-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .import-tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-family: 'Monaco', monospace;
    }

    .warning-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      align-items: start;
    }

    .warning-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .footer {
      background: #f8f9fa;
      padding: 16px 24px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 ${componentName}</h1>
      <div class="badge">静态预览模式</div>
      <div style="margin-top: 12px; font-size: 14px; opacity: 0.9;">
        此组件代码较复杂，已切换到静态预览模式
      </div>
    </div>

    <div class="content">
      <div class="warning-box">
        <div class="warning-icon">⚠️</div>
        <div>
          <strong>为什么显示静态预览？</strong><br>
          此组件的代码复杂度较高，实时预览可能会占用大量内存或导致浏览器崩溃。<br>
          静态预览展示了组件的结构和信息，建议下载代码后在本地运行查看完整效果。
        </div>
      </div>

      <div class="section">
        <div class="section-title">📊 组件信息</div>
        <div class="info-grid">
          <div class="info-card">
            <div class="label">组件名称</div>
            <div class="value">${componentName}</div>
          </div>
          <div class="info-card">
            <div class="label">代码行数</div>
            <div class="value">${stats.lines} 行</div>
          </div>
          <div class="info-card">
            <div class="label">文件大小</div>
            <div class="value">${stats.size} KB</div>
          </div>
          <div class="info-card">
            <div class="label">组件数量</div>
            <div class="value">${stats.componentCount} 个</div>
          </div>
        </div>
      </div>

      ${imports.length > 0 ? `
      <div class="section">
        <div class="section-title">📦 依赖项</div>
        <div class="imports-list">
          ${imports.map(imp => `<div class="import-tag">${imp}</div>`).join('')}
        </div>
      </div>
      ` : ''}

      ${props.length > 0 ? `
      <div class="section">
        <div class="section-title">⚙️ Props 接口</div>
        <div class="imports-list">
          ${props.map(prop => `<div class="import-tag">${prop}</div>`).join('')}
        </div>
      </div>
      ` : ''}

      ${styleClasses.length > 0 ? `
      <div class="section">
        <div class="section-title">🎨 使用的样式类</div>
        <div class="imports-list">
          ${styleClasses.slice(0, 10).map(cls => `<div class="import-tag">${cls}</div>`).join('')}
          ${styleClasses.length > 10 ? `<div class="import-tag">+${styleClasses.length - 10} 更多</div>` : ''}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">🏗️ 组件结构</div>
        <div class="structure-tree">
          ${jsxStructure}
        </div>
      </div>

      <div class="section">
        <div class="section-title">💻 代码片段</div>
        <div class="code-preview">${escapeHtml(code.substring(0, 2000))}${code.length > 2000 ? '\n\n... (代码已截断)' : ''}</div>
      </div>

      <div class="section">
        <div class="section-title">✨ 特性检测</div>
        <div class="info-grid">
          <div class="info-card">
            <div class="label">React Hooks</div>
            <div class="value">${stats.hasHooks ? '✅ 使用中' : '❌ 未使用'}</div>
          </div>
          <div class="info-card">
            <div class="label">事件处理</div>
            <div class="value">${stats.hasEventHandlers ? '✅ 包含' : '❌ 无'}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      💡 <strong>提示：</strong>建议下载完整代码并在本地环境中运行，以获得完整的交互体验
    </div>
  </div>

  <script>
    // 添加简单的交互效果
    document.querySelectorAll('.info-card').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.transition = 'all 0.2s';
      });
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  </script>
</body>
</html>`
}

/**
 * 提取 JSX 结构（简化版）
 */
function extractJsxStructure(code: string): string {
  // 移除字符串和注释
  const cleanedCode = code
    .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')

  // 提取 JSX 元素
  const jsxElements: Array<{tag: string, indent: number, isComponent: boolean}> = []
  const lines = cleanedCode.split('\n')

  lines.forEach((line, index) => {
    // 匹配 JSX 元素
    const match = line.match(/^(\s*)(<([A-Z][a-zA-Z]*)|([a-z][a-zA-Z]*))/)
    if (match) {
      const indent = match[1].length
      const tag = match[3] || match[4]
      const isComponent = !!match[3]

      jsxElements.push({ tag, indent: Math.floor(indent / 2), isComponent })
    }
  })

  // 生成结构树
  if (jsxElements.length === 0) {
    return '<div class="structure-item">📄 组件结构 (无法解析)</div>'
  }

  return jsxElements.slice(0, 20).map(({ tag, indent, isComponent }) => {
    const className = isComponent ? 'component' : 'tag'
    const indentClass = indent > 0 ? `indent-${Math.min(indent, 3)}` : ''
    return `<div class="structure-item ${indentClass}">&lt;<span class="${className}">${tag}</span>&gt;</div>`
  }).join('') + (jsxElements.length > 20 ? '<div class="structure-item">... (更多元素)</div>' : '')
}

/**
 * 提取样式类名
 */
function extractStyleClasses(code: string): string[] {
  const matches = code.match(/className=["']([^"']+)["']/g) || []
  const classes = matches
    .map(m => m.match(/className=["']([^"']+)["']/)?.[1] || '')
    .join(' ')
    .split(/\s+/)
    .filter(c => c.length > 0)

  return [...new Set(classes)]
}

/**
 * 提取组件 Props
 */
function extractComponentProps(code: string): string[] {
  const interfaceMatch = code.match(/interface\s+(\w+)\s*Props\s*{([^}]+)}/)
  if (!interfaceMatch) return []

  const propsContent = interfaceMatch[2]
  const props = propsContent
    .split('\n')
    .map(line => line.trim().match(/(\w+)\s*:/)?.[1])
    .filter(Boolean)

  return props
}

/**
 * 提取导入的依赖
 */
function extractImports(code: string): string[] {
  const imports: string[] = []

  // 提取命名导入
  const namedImports = code.match(/import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/g) || []
  namedImports.forEach(imp => {
    const match = imp.match(/import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/)
    if (match) {
      const [, names, from] = match
      names.split(',').forEach((name: string) => {
        imports.push(`${name.trim()} (from ${from})`)
      })
    }
  })

  // 提取默认导入
  const defaultImports = code.match(/import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g) || []
  defaultImports.forEach(imp => {
    const match = imp.match(/import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/)
    if (match) {
      imports.push(`${match[1]} (from ${match[2]})`)
    }
  })

  return imports.slice(0, 15)
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}
