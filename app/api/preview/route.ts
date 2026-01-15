import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// 验证生成的代码是否有明显错误
function validateGeneratedCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查1: return 后面不能直接跟 const/let/var/function
  if (/return\s*\(\s*\n\s*(const|let|var|function)\s+\w+/.test(code)) {
    errors.push('Invalid return statement: return cannot be followed by const/let/var/function')
  }

  // 检查2: 检查未闭合的 JSX 标签
  const openTags = (code.match(/<[A-Z][a-zA-Z]*/g) || []).length
  const closeTags = (code.match(/<\/[A-Z][a-zA-Z]*/g) || []).length
  if (openTags !== closeTags && openTags > 0) {
    errors.push(`Unmatched JSX tags: ${openTags} opening tags vs ${closeTags} closing tags`)
  }

  // 检查3: 检查是否有未闭合的括号（简化检查）
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push(`Unmatched parentheses: ${openParens} opening vs ${closeParens} closing`)
  }

  // 检查4: 检查是否有 javascript: 前缀（常见错误）
  if (/^\s*javascript\s+/m.test(code)) {
    errors.push('Invalid "javascript" prefix detected in code')
  }

  // 检查5: 检查常见的未定义变量（left, right, top, bottom 等）
  const commonUndefinedVars = ['\\bright\\b', '\\bleft\\b', '\\btop\\b', '\\bbottom\\b']
  for (const varPattern of commonUndefinedVars) {
    const regex = new RegExp(varPattern, 'g')
    const matches = code.match(regex)
    if (matches && matches.length > 0) {
      // 检查是否在声明或赋值语句中
      const declarePattern = new RegExp(`(const|let|var)\\s+${varPattern.slice(2, -2)}\\s*=`, 'g')
      const declarations = code.match(declarePattern)
      if (!declarations || declarations.length < matches.length) {
        errors.push(`Potentially undefined variable: ${varPattern.slice(2, -2)}`)
      }
    }
  }

  // 检查6: 检查未定义的组件（大写开头的标签）
  const jsxComponents = code.match(/<([A-Z][a-zA-Z0-9]*)/g) || []
  const componentNames = [...new Set(jsxComponents.map(tag => tag.slice(1)))]
  for (const compName of componentNames) {
    // 检查组件是否被定义（function/const/class 声明）
    const definePattern = new RegExp(`(function\\s+${compName}\\b|const\\s+${compName}\\s*=|class\\s+${compName}\\b)`)
    if (!definePattern.test(code)) {
      errors.push(`Undefined component: ${compName}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

async function callDeepSeekAPI(prompt: string, retryCount = 0): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  const maxRetries = 2

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  // 如果是重试，在提示中添加错误信息
  let enhancedPrompt = prompt.trim()
  if (retryCount > 0) {
    enhancedPrompt += `\n\nIMPORTANT: Your previous response had syntax errors. Please ensure:
1. NEVER write "return (" followed by const/let/var/function declarations
2. Declare all variables BEFORE the return statement
3. Return ONLY valid JSX from the component
4. Use proper matching tags and parentheses`
  }

  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: `You are a professional frontend developer. Generate a complete React component based on user requirements.

CRITICAL RULES:
1. Return ONLY the React component code without any imports or exports
2. Use modern React hooks (useState, useEffect, etc.) and functional components
3. Include inline styles or Tailwind classes for styling
4. Make it visually appealing and responsive
5. ALWAYS declare variables and hooks BEFORE the return statement
6. The return statement must ONLY contain JSX expressions
7. NEVER use "javascript:" prefix or similar invalid tokens
8. NEVER use undefined variables - all variables must be declared with const/let/var before use
9. Pay special attention to variables like 'left', 'right', 'top', 'bottom' - ensure they are properly declared
10. ONLY use standard HTML elements (div, button, input, etc.) or components you define in the same file
11. NEVER reference external components like Editor, Chart, etc. unless you define them first

CORRECT STRUCTURE EXAMPLE:
function App() {
  const [count, setCount] = React.useState(0);
  const handleClick = () => setCount(count + 1);

  return (
    <div className="p-4">
      <h1>Counter: {count}</h1>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}

INCORRECT STRUCTURE (DO NOT DO THIS):
function App() {
  return (
  const [count, setCount] = React.useState(0);  // ❌ WRONG
  // ...
}

Follow the correct structure pattern.`
      },
      {
        role: 'user',
        content: enhancedPrompt
      }
    ],
    max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from DeepSeek API')
  }

  // 验证生成的代码
  const validation = validateGeneratedCode(content)

  if (!validation.valid && retryCount < maxRetries) {
    console.warn(`⚠️ Generated code has errors, retrying (${retryCount + 1}/${maxRetries}):`, validation.errors)
    // 递归重试
    return callDeepSeekAPI(prompt, retryCount + 1)
  }

  if (!validation.valid) {
    console.error('❌ Generated code still has errors after retries:', validation.errors)
    // 即使有错误也返回，让后续的修复逻辑处理
  }

  return content
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const appContent = await callDeepSeekAPI(prompt.trim())

    // Check if we got valid content
    if (!appContent || appContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not generate preview' },
        { status: 500 }
      )
    }

    // Create a complete HTML page with the React component
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .preview-container {
        width: 100%;
        height: 100vh;
        overflow: auto;
      }
      /* Simple icon replacements for Lucide React */
      .icon-play:before { content: "▶"; }
      .icon-pause:before { content: "⏸"; }
      .icon-rotate:before { content: "🔄"; }
      .icon-trophy:before { content: "🏆"; }
      .icon-target:before { content: "🎯"; }
      .icon-zap:before { content: "⚡"; }
      .icon-sparkles:before { content: "✨"; }
      .icon-mail:before { content: "✉"; }
      .icon-lock:before { content: "🔒"; }
      .icon-user:before { content: "👤"; }
      .icon-alert:before { content: "⚠"; }
      .icon-check:before { content: "✓"; }
      .icon-calendar:before { content: "📅"; }
      .icon-clock:before { content: "🕐"; }
      .icon-arrow:before { content: "→"; }
      .icon-star:before { content: "⭐"; }
      .icon-rocket:before { content: "🚀"; }
      .icon-shield:before { content: "🛡"; }
    </style>
  </head>
  <body>
    <div id="root" class="preview-container"></div>
    
    <script type="text/babel">
      // Simple icon component
      const Icon = ({ name, className = "w-4 h-4", ...props }) => {
        return React.createElement('span', {
          className: \`icon-\${name.toLowerCase()} \${className}\`,
          ...props
        });
      };
      
      // Icon components
      const Play = (props) => React.createElement(Icon, { name: 'play', ...props });
      const Pause = (props) => React.createElement(Icon, { name: 'pause', ...props });
      const RotateCcw = (props) => React.createElement(Icon, { name: 'rotate', ...props });
      const Trophy = (props) => React.createElement(Icon, { name: 'trophy', ...props });
      const Target = (props) => React.createElement(Icon, { name: 'target', ...props });
      const Zap = (props) => React.createElement(Icon, { name: 'zap', ...props });
      const Sparkles = (props) => React.createElement(Icon, { name: 'sparkles', ...props });
      const Mail = (props) => React.createElement(Icon, { name: 'mail', ...props });
      const Lock = (props) => React.createElement(Icon, { name: 'lock', ...props });
      const User = (props) => React.createElement(Icon, { name: 'user', ...props });
      const AlertCircle = (props) => React.createElement(Icon, { name: 'alert', ...props });
      const Check = (props) => React.createElement(Icon, { name: 'check', ...props });
      const Calendar = (props) => React.createElement(Icon, { name: 'calendar', ...props });
      const Clock = (props) => React.createElement(Icon, { name: 'clock', ...props });
      const ArrowRight = (props) => React.createElement(Icon, { name: 'arrow', ...props });
      const Star = (props) => React.createElement(Icon, { name: 'star', ...props });
      const Rocket = (props) => React.createElement(Icon, { name: 'rocket', ...props });
      const Shield = (props) => React.createElement(Icon, { name: 'shield', ...props });
      
      // Component code - clean up the generated code
      ${appContent
        .replace('export default function App', 'function App')
        .replace(/import.*from.*lucide-react.*\n/g, '')
        .replace(/import.*from.*react.*\n/g, '')}
      
      // Render the component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    </script>
  </body>
</html>
`

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
