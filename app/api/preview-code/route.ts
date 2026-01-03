import { NextRequest, NextResponse } from 'next/server'

// Calculate code complexity to prevent preview crashes
// Optimized algorithm to better reflect actual complexity
function calculateComplexity(code: string): number {
  let score = 0

  // Length factor (reduced weight)
  score += Math.log10(code.length + 1) * 5

  // Line count factor (reduced weight)
  const lines = code.split('\n').length
  score += Math.log10(lines + 1) * 3

  // Component nesting (reduced weight - braces are common in JSX)
  const openBraces = (code.match(/\{/g) || []).length
  score += openBraces * 0.1

  // JSX complexity (reduced weight - JSX elements are normal in React)
  const jsxElements = (code.match(/<[A-Z][a-zA-Z]*/g) || []).length
  score += jsxElements * 0.5

  // Hooks usage (reduced weight - hooks are essential in React)
  const hooks = (code.match(/use(State|Effect|Callback|Memo|Ref|Context|Reducer)/g) || []).length
  score += hooks * 2

  // Event handlers (reduced weight)
  const handlers = (code.match(/on[A-Z][a-zA-Z]+/g) || []).length
  score += handlers * 1

  // Nested functions (reduced weight)
  const functions = (code.match(/function\s+\w+/g) || []).length
  score += functions * 2

  // Ternary operators (reduced weight)
  const ternaries = (code.match(/\?[^:]+:/g) || []).length
  score += ternaries * 1

  return Math.round(score)
}

export async function POST(request: NextRequest) {
  try {
    const { code, files, device = 'desktop' } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    // Check code complexity to prevent crashes
    const codeLength = code.length
    const lineCount = code.split('\n').length
    const complexityScore = calculateComplexity(code)

    console.log('🔍 Code complexity analysis:', {
      length: codeLength,
      lines: lineCount,
      complexity: complexityScore
    })

    // Reject if code is too complex (limits increased 3x for better support)
    if (codeLength > 300000) { // 300KB limit (increased from 100KB)
      return NextResponse.json(
        {
          error: 'Generated code is too large for preview',
          details: `Code size: ${Math.round(codeLength / 1024)}KB (max: 300KB). Please try generating a simpler component.`
        },
        { status: 400 }
      )
    }

    if (lineCount > 5000) { // 5000 lines limit (increased from 2000)
      return NextResponse.json(
        {
          error: 'Generated code is too long for preview',
          details: `Code lines: ${lineCount} (max: 5000). Please try generating a simpler component.`
        },
        { status: 400 }
      )
    }

    if (complexityScore > 1500) { // High complexity threshold (increased from 500)
      return NextResponse.json(
        {
          error: 'Generated code is too complex for browser preview',
          details: `Complexity score: ${complexityScore}. The preview uses in-browser compilation which has limits. Please try generating a simpler component or use the code directly.`
        },
        { status: 400 }
      )
    }

    // Get all files for multi-file support
    const allFiles = files || {}
    const appCode = code.trim()

    // Clean up the component code before embedding
    let cleanCode = appCode
      // Remove export statements
      .replace(/export\s+default\s+/g, '')
      .replace(/export\s+/g, '')
      // Remove import statements (we provide everything globally)
      // Handle multi-line imports first (like { LineChart, Line, ... } from 'recharts')
      .replace(/import\s*{\s*[\s\S]*?\s*}\s*from\s+['"`][^'"`]*['"`];?/g, '')
      .replace(/import\s+.*?\s+from\s+['"\`]lucide-react['"\`];?\s*\n/g, '')
      .replace(/import\s+.*?\s+from\s+['"\`]react['"\`];?\s*\n/g, '')
      .replace(/import\s+.*?\s+from\s+['"\`]react-dom['"\`];?\s*\n/g, '')
      .replace(/import\s+.*?\s+from\s+['"\`].*?['"\`];?\s*\n/g, '')
      .replace(/import\s*\(\s*['"\`].*?['"\`]\s*\);?\s*\n/g, '')
      .replace(/const\s+\w+\s*=\s*require\s*\(['"\`].*?['"\`]\);?\s*\n/g, '')
      // Replace React hooks with React namespace
      .replace(/\buseState\b/g, 'React.useState')
      .replace(/\buseEffect\b/g, 'React.useEffect')
      .replace(/\buseCallback\b/g, 'React.useCallback')
      .replace(/\buseMemo\b/g, 'React.useMemo')
      .replace(/\buseRef\b/g, 'React.useRef')
      .replace(/\buseContext\b/g, 'React.useContext')
      .replace(/\buseReducer\b/g, 'React.useReducer')
      .replace(/\buseLayoutEffect\b/g, 'React.useLayoutEffect')
      // Handle javascript: protocol in links (ONLY replace javascript: protocol, not the word itself)
      // Only replace javascript: protocol, not standalone javascript word to avoid breaking code
      .replace(/javascript:\s*[^;]*;?/gi, 'void(0);')
      .replace(/javascript:/gi, 'void(0);')
      .trim()
    
    // Remove any standalone "javascript" word that appears at the start of lines or after return statements
    // This can happen if code cleaning left behind invalid tokens
    cleanCode = cleanCode
      .replace(/^\s*javascript\s*$/gm, '')  // Remove standalone "javascript" on its own line
      .replace(/\breturn\s*\(\s*javascript\s*/g, 'return (')  // Remove "javascript" after "return ("
      .replace(/\(\s*javascript\s+/g, '(')  // Remove "javascript" after opening parenthesis
      .replace(/\s+javascript\s*$/gm, '')  // Remove "javascript" at end of lines
      .replace(/\n\s*javascript\s*\n/g, '\n')  // Remove "javascript" on its own line between other lines
      .trim()

    console.log('Original code:', appCode.substring(0, 300) + '...')
    console.log('Clean code:', cleanCode.substring(0, 300) + '...')
    console.log('Contains Recharts import:', cleanCode.includes('recharts') || appCode.includes('recharts'))
    console.log('Contains ResponsiveContainer:', cleanCode.includes('ResponsiveContainer'))
    console.log('Clean code full length:', cleanCode.length)

    // Ensure the code has a proper App component declaration
    // First check if code already has App function (avoid double wrapping)
    if (!cleanCode.includes('function App') && !cleanCode.includes('const App =') && !cleanCode.includes('App = ')) {
      console.log('Code does not have App function, will wrap it')
      
      // Clean up any remaining invalid tokens before processing
      cleanCode = cleanCode
        .replace(/^\s*javascript\s*$/gm, '')
        .replace(/\breturn\s*\(\s*javascript\s*/g, 'return (')
        .replace(/\(\s*javascript\s+/g, '(')
        .replace(/\s+javascript\s*$/gm, '')
        .replace(/\n\s*javascript\s*\n/g, '\n')
        .trim()
      
      const trimmedCode = cleanCode.trim()
      
      // Check if the code is a JSX return statement (most common case)
      // BUT NOT if it starts with 'function' (that's a component function, not a return statement)
      if (trimmedCode.startsWith('return') || (trimmedCode.startsWith('(') && !trimmedCode.startsWith('function') && !trimmedCode.match(/^\(\s*function/))) {
        // It's already a return statement, wrap it in App function
        cleanCode = 'function App() {\n' + cleanCode + '\n}'
        console.log('Wrapped return statement in App function')
      } 
      // Check if it's a component function definition (function ComponentName or const ComponentName =)
      // This MUST come after checking for return statements
      // Also check if code starts with function/const after removing leading invalid tokens
      else if (/^(function\s+\w+|const\s+\w+\s*=\s*(function|\(|=>))/.test(trimmedCode) || 
               /^\s*(javascript\s+)?(function\s+\w+|const\s+\w+\s*=\s*(function|\(|=>))/.test(trimmedCode)) {
        // Remove any leading "javascript" word if present
        cleanCode = cleanCode.replace(/^\s*javascript\s+/m, '').trim()
        const finalTrimmedCode = cleanCode.trim()
        // It's a component function, extract the component name
        const functionMatch = finalTrimmedCode.match(/^function\s+(\w+)/)
        const constMatch = finalTrimmedCode.match(/^const\s+(\w+)\s*=/)
        
        let componentName = null
        if (functionMatch) {
          componentName = functionMatch[1]
          console.log('Found function component:', componentName)
        } else if (constMatch) {
          componentName = constMatch[1]
          console.log('Found const component:', componentName)
        } else {
          // Fallback: try to find any function name in the code
          const anyFunctionMatch = cleanCode.match(/(?:function|const)\s+(\w+)/)
          if (anyFunctionMatch) {
            componentName = anyFunctionMatch[1]
            console.log('Found component via fallback:', componentName)
          }
        }
        
        if (componentName) {
          // CRITICAL: Keep the component function definition OUTSIDE App function
          // Then add App function that returns it
          // The component function should remain at the top level, not inside App
          cleanCode = cleanCode + '\n\nfunction App() {\n  if (typeof ' + componentName + ' === "undefined") {\n    console.error("ERROR: Component ' + componentName + ' is not defined!");\n    return React.createElement("div", null, "Error: Component ' + componentName + ' not found");\n  }\n  return React.createElement(' + componentName + ');\n}'
          console.log('Final code structure: Component function + App function that returns it')
          console.log('Component name:', componentName)
          console.log('Code preview:', cleanCode.substring(0, 400))
        } else {
          // Last resort: wrap and return the code directly
          console.log('No component name found, wrapping code directly')
          // Check if code already has a return statement
          if (cleanCode.includes('return')) {
            cleanCode = 'function App() {\n' + cleanCode + '\n}'
          } else {
            cleanCode = 'function App() {\n  return (\n' + cleanCode + '\n  );\n}'
          }
        }
      }
      // Otherwise, assume it's JSX that needs to be returned
      else {
        cleanCode = 'function App() {\n  return (\n' + cleanCode + '\n  );\n}'
        console.log('Wrapped JSX in App function')
      }
      
      console.log('Wrapped in function App():', cleanCode.substring(0, 400) + '...')
      console.log('Final cleanCode length:', cleanCode.length)
    } else {
      console.log('Code already has App declaration, checking if it returns correctly...')
      // Check if existing App function has a return statement
      if (cleanCode.includes('function App') && !cleanCode.match(/function\s+App\s*\([^)]*\)\s*\{[^}]*return/)) {
        console.warn('WARNING: App function exists but may not have return statement!')
        console.log('App function code:', cleanCode.match(/function\s+App\s*\([^)]*\)\s*\{[^}]*\}/)?.[0] || 'not found')
      }
    }

    // Escape the code for embedding in HTML script tag
    // Need to escape: </script> tags and handle special characters
    const escapedCode = cleanCode
      .replace(/<\/script>/gi, '<\\/script>')  // Escape closing script tags (critical!)
      .replace(/<!--/g, '<\\!--')             // Escape HTML comments start
      .replace(/-->/g, '--\\>')               // Escape HTML comments end
      .replace(/<script/gi, '<\\script')       // Escape opening script tags too

    console.log('Final escaped code:', escapedCode.substring(0, 300) + '...')
    console.log('Code length:', escapedCode.length)

    // Create a complete HTML preview with the actual generated code
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App - Live Preview</title>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lucide-react/0.263.1/umd/lucide-react.js"></script>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        overflow: hidden;
      }

      .preview-container {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        box-sizing: border-box;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: white;
        text-align: center;
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error {
        max-width: 700px;
        margin: 40px auto;
        padding: 32px;
        background: white;
        color: #dc2626;
        border-radius: 16px;
        border: 2px solid #fecaca;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .error h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .error p {
        margin: 12px 0;
        line-height: 1.6;
        color: #7f1d1d;
      }

      .error-details {
        background: #fef2f2;
        padding: 16px;
        border-radius: 8px;
        margin-top: 20px;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        font-size: 13px;
        word-break: break-all;
        border-left: 4px solid #dc2626;
      }
    </style>
  </head>
  <body>
    <div id="loading" class="loading">
      <div class="loading-spinner"></div>
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Loading Preview...</div>
      <div style="font-size: 14px; opacity: 0.8;">Compiling React component</div>
    </div>

    <div id="root" class="preview-container" style="display: none;"></div>
    
    <script type="text/babel">
      // Enhanced icon components using Lucide React
      const IconComponent = ({ name, className = "w-4 h-4", ...props }) => {
        try {
          if (window.lucideReact && window.lucideReact[name]) {
            const IconComp = window.lucideReact[name];
            return React.createElement(IconComp, {
              className: className,
              ...props
            });
          }
        } catch (e) {
          console.log('Lucide icon not available, using fallback');
        }

        // Fallback to Unicode symbols
        const icons = {
          play: "▶", pause: "⏸", rotate: "🔄", trophy: "🏆", target: "🎯",
          zap: "⚡", sparkles: "✨", mail: "✉", lock: "🔒", user: "👤",
          alert: "⚠", check: "✓", calendar: "📅", clock: "🕐", arrow: "→",
          star: "⭐", rocket: "🚀", shield: "🛡", copy: "📋", download: "⬇",
          eye: "👁", search: "🔍", cloud: "☁", sun: "☀", cloudrain: "🌧",
          wind: "💨", thermometer: "🌡", droplets: "💧", mappin: "📍",
          refreshcw: "🔄", heart: "❤", bell: "🔔", settings: "⚙", menu: "☰",
          shoppingcart: "🛒", shoppingbag: "🛍", cart: "🛒", package: "📦",
          box: "📦", truck: "🚚", creditcard: "💳", dollarsign: "💵",
          euro: "💶", poundsterling: "💷", yen: "💴", home: "🏠",
          grid: "▦", list: "☰", layout: "▦", layers: "📚", columns: "▦",
          filter: "🔍", sliders: "☰", chevrondown: "▼", chevronup: "▲",
          chevronleft: "◀", chevronright: "▶", morehorizontal: "⋯", morevertical: "⋮",
          ellipsis: "⋯"
        };

        return React.createElement('span', {
          className: className + " inline-block",
          ...props
        }, icons[name] || "?");
      };

      // Initialize Lucide icons in global scope
      if (window.lucideReact) {
        const iconNames = [
          'Play', 'Pause', 'RotateCcw', 'Trophy', 'Target', 'Zap', 'Sparkles',
          'Mail', 'Lock', 'User', 'AlertCircle', 'Check', 'Calendar', 'Clock',
          'ArrowRight', 'Star', 'Rocket', 'Shield', 'Search', 'Cloud', 'Sun',
          'CloudRain', 'Wind', 'Thermometer', 'Droplets', 'MapPin', 'RefreshCw',
          'Heart', 'Bell', 'Settings', 'Menu', 'X', 'Plus', 'Minus', 'Edit',
          'Trash', 'Save', 'Download', 'Upload', 'Copy', 'Eye', 'EyeOff',
          'ShoppingCart', 'ShoppingBag', 'Cart', 'Package', 'Box', 'Truck',
          'CreditCard', 'DollarSign', 'Euro', 'PoundSterling', 'Yen',
          'Home', 'Grid', 'List', 'Layout', 'Layers', 'Columns',
          'Filter', 'SlidersHorizontal', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
          'MoreHorizontal', 'MoreVertical', 'Ellipsis'
        ];

        iconNames.forEach(name => {
          if (window.lucideReact[name]) {
            window[name] = window.lucideReact[name];
          }
        });
      }

      // Create icon wrapper components
      const createIconWrapper = (name) => (props) => {
        if (window[name]) {
          return React.createElement(window[name], props);
        }
        return React.createElement(IconComponent, { name: name.toLowerCase(), ...props });
      };

      const Play = createIconWrapper('Play');
      const Pause = createIconWrapper('Pause');
      const RotateCcw = createIconWrapper('RotateCcw');
      const Trophy = createIconWrapper('Trophy');
      const Target = createIconWrapper('Target');
      const Zap = createIconWrapper('Zap');
      const Sparkles = createIconWrapper('Sparkles');
      const Mail = createIconWrapper('Mail');
      const Lock = createIconWrapper('Lock');
      const User = createIconWrapper('User');
      const AlertCircle = createIconWrapper('AlertCircle');
      const Check = createIconWrapper('Check');
      const Calendar = createIconWrapper('Calendar');
      const Clock = createIconWrapper('Clock');
      const ArrowRight = createIconWrapper('ArrowRight');
      const Star = createIconWrapper('Star');
      const Rocket = createIconWrapper('Rocket');
      const Shield = createIconWrapper('Shield');
      const Search = createIconWrapper('Search');
      const Cloud = createIconWrapper('Cloud');
      const Sun = createIconWrapper('Sun');
      const CloudRain = createIconWrapper('CloudRain');
      const Wind = createIconWrapper('Wind');
      const Thermometer = createIconWrapper('Thermometer');
      const Droplets = createIconWrapper('Droplets');
      const MapPin = createIconWrapper('MapPin');
      const RefreshCw = createIconWrapper('RefreshCw');
      const Heart = createIconWrapper('Heart');
      const Bell = createIconWrapper('Bell');
      const Settings = createIconWrapper('Settings');
      const Menu = createIconWrapper('Menu');
      const X = createIconWrapper('X');
      const Plus = createIconWrapper('Plus');
      const Minus = createIconWrapper('Minus');
      const Edit = createIconWrapper('Edit');
      const Trash = createIconWrapper('Trash');
      const Save = createIconWrapper('Save');
      const Download = createIconWrapper('Download');
      const Upload = createIconWrapper('Upload');
      const Copy = createIconWrapper('Copy');
      const Eye = createIconWrapper('Eye');
      const EyeOff = createIconWrapper('EyeOff');
      const ShoppingCart = createIconWrapper('ShoppingCart');
      const ShoppingBag = createIconWrapper('ShoppingBag');
      const Cart = createIconWrapper('Cart');
      const Package = createIconWrapper('Package');
      const Box = createIconWrapper('Box');
      const Truck = createIconWrapper('Truck');
      const CreditCard = createIconWrapper('CreditCard');
      const DollarSign = createIconWrapper('DollarSign');
      const Euro = createIconWrapper('Euro');
      const PoundSterling = createIconWrapper('PoundSterling');
      const Yen = createIconWrapper('Yen');
      const Home = createIconWrapper('Home');
      const Grid = createIconWrapper('Grid');
      const List = createIconWrapper('List');
      const Layout = createIconWrapper('Layout');
      const Layers = createIconWrapper('Layers');
      const Columns = createIconWrapper('Columns');
      const Filter = createIconWrapper('Filter');
      const SlidersHorizontal = createIconWrapper('SlidersHorizontal');
      const ChevronDown = createIconWrapper('ChevronDown');
      const ChevronUp = createIconWrapper('ChevronUp');
      const ChevronLeft = createIconWrapper('ChevronLeft');
      const ChevronRight = createIconWrapper('ChevronRight');
      const MoreHorizontal = createIconWrapper('MoreHorizontal');
      const MoreVertical = createIconWrapper('MoreVertical');
      const Ellipsis = createIconWrapper('Ellipsis');

      // Simple chart components that work without external libraries
      (function() {
        // Create simple SVG-based chart components
        window.ResponsiveContainer = function({ children, width = '100%', height = 300 }) {
          return React.createElement('div', {
            style: { width: width, height: height + 'px', position: 'relative' }
          }, children);
        };

        window.LineChart = function({ data, children, width = 400, height = 300 }) {
          // Simple line chart implementation
          if (!data || !Array.isArray(data) || data.length === 0) {
            return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'No data available');
          }

          const values = data.map(d => d.sales || d.value || 0);
          const maxValue = values.length > 0 ? Math.max(...values) : 1;
          const chartWidth = width - 60;
          const chartHeight = height - 60;

          const points = data.map((d, i) => {
            const x = 40 + (i * chartWidth) / Math.max(data.length - 1, 1);
            const y = 40 + chartHeight - ((d.sales || d.value || 0) * chartHeight) / maxValue;
            return x + ',' + y;
          }).join(' ');

          return React.createElement('svg', { width: width, height: height },
            // Grid lines
            React.createElement('line', { x1: 40, y1: 40, x2: 40, y2: height - 20, stroke: '#e5e7eb', strokeWidth: 1 }),
            React.createElement('line', { x1: 40, y1: height - 20, x2: width - 20, y2: height - 20, stroke: '#e5e7eb', strokeWidth: 1 }),

            // Line
            React.createElement('polyline', {
              points: points,
              fill: 'none',
              stroke: '#3b82f6',
              strokeWidth: 2
            }),

            // Data points
            data.map((d, i) => {
              const x = 40 + (i * chartWidth) / Math.max(data.length - 1, 1);
              const y = 40 + chartHeight - ((d.sales || d.value || 0) * chartHeight) / maxValue;
              return React.createElement('circle', {
                key: i,
                cx: x,
                cy: y,
                r: 4,
                fill: '#3b82f6'
              });
            })
          );
        };

        window.BarChart = function({ data, width = 400, height = 300 }) {
          if (!data || !Array.isArray(data) || data.length === 0) {
            return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'No data available');
          }

          const values = data.map(d => d.sales || d.value || 0);
          const maxValue = values.length > 0 ? Math.max(...values) : 1;
          const barWidth = Math.max((width - 80) / data.length, 20);
          const chartHeight = height - 60;

          return React.createElement('svg', { width: width, height: height },
            data.map((d, i) => {
              const barHeight = maxValue > 0 ? ((d.sales || d.value || 0) * chartHeight) / maxValue : 0;
              const x = 40 + i * barWidth;
              const y = height - 20 - barHeight;

              return React.createElement('rect', {
                key: i,
                x: x,
                y: y,
                width: barWidth - 2,
                height: barHeight,
                fill: '#10b981'
              });
            })
          );
        };

        window.PieChart = function({ data, width = 300, height = 300 }) {
          if (!data || !Array.isArray(data) || data.length === 0) {
            return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'No data available');
          }

          const values = data.map(d => d.value || 0);
          const total = values.reduce((sum, val) => sum + val, 0);

          if (total === 0) {
            return React.createElement('div', { style: { padding: '20px', textAlign: 'center' } }, 'No valid data to display');
          }

          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) / 2 - 20;

          let currentAngle = -Math.PI / 2; // Start from top

          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

          return React.createElement('svg', { width: width, height: height },
            data.map((d, i) => {
              const value = d.value || 0;
              if (value === 0) return null;

              const angle = (value / total) * 2 * Math.PI;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;

              const x1 = centerX + radius * Math.cos(startAngle);
              const y1 = centerY + radius * Math.sin(startAngle);
              const x2 = centerX + radius * Math.cos(endAngle);
              const y2 = centerY + radius * Math.sin(endAngle);

              const largeArcFlag = angle > Math.PI ? 1 : 0;

              const pathData = [
                'M ' + centerX + ' ' + centerY,
                'L ' + x1 + ' ' + y1,
                'A ' + radius + ' ' + radius + ' 0 ' + largeArcFlag + ' 1 ' + x2 + ' ' + y2,
                'Z'
              ].join(' ');

              currentAngle = endAngle;

              return React.createElement('path', {
                key: i,
                d: pathData,
                fill: colors[i % colors.length],
                stroke: 'white',
                strokeWidth: 1
              });
            }).filter(Boolean)
          );
        };

        // Simple placeholder components for other chart elements
        window.Line = function() { return null; };
        window.Bar = function() { return null; };
        window.Pie = function() { return null; };
        window.Cell = function() { return null; };
        window.XAxis = function() { return null; };
        window.YAxis = function() { return null; };
        window.CartesianGrid = function() { return null; };
        window.Tooltip = function() { return null; };
        window.Legend = function() { return null; };

        console.log('✅ Simple chart components loaded');
      })();

      // Setup chart components BEFORE Babel compiles the code
      console.log('🔧 Setting up chart components before Babel compilation...');

      // Component code - Babel will compile this automatically
      // Note: Code is embedded directly here, Babel will transform JSX automatically

      ${escapedCode}
      
      // Debug: Check if App is defined after Babel compilation
      console.log('=== After Babel compilation ===');
      console.log('typeof App:', typeof App);
      console.log('Babel version:', window.Babel?.version || 'unknown');
      console.log('React version:', window.React?.version || 'unknown');
      console.log('ReactDOM version:', window.ReactDOM?.version || 'unknown');
      
      if (typeof App !== 'undefined') {
        console.log('✅ App function exists');
        try {
          const testResult = App();
          console.log('App() call result:', testResult);
          if (!testResult) {
            console.error('ERROR: App() returned null/undefined!');
            console.error('App function code:', App.toString());
            // Try to find what components are available
            console.log('Available components:', Object.keys(window).filter(k => typeof window[k] === 'function' && /^[A-Z]/.test(k)));
          } else {
            console.log('✅ App() returns valid React element');
          }
        } catch (e) {
          console.error('ERROR calling App():', e);
          console.error('Error stack:', e.stack);
        }
      } else {
        console.error('❌ ERROR: App is not defined after Babel compilation!');
        // List all functions defined
        const allFunctions = Object.keys(window).filter(k => typeof window[k] === 'function');
        console.log('Available functions:', allFunctions.slice(0, 20)); // Show first 20
        console.log('Total functions:', allFunctions.length);
        
        // Check for Babel compilation errors
        if (window.Babel && window.Babel.transform) {
          try {
            const testTransform = window.Babel.transform('function Test() { return <div>Test</div>; }', { presets: ['react'] });
            console.log('Babel transform test successful');
          } catch (babelErr) {
            console.error('Babel transform test failed:', babelErr);
          }
        }
      }

      // Test chart components availability
      console.log('🧪 Testing chart components availability...');
      console.log('ResponsiveContainer available:', typeof ResponsiveContainer);
      console.log('LineChart available:', typeof LineChart);
      console.log('BarChart available:', typeof BarChart);

      // After Babel compiles, App should be available
      // Optimized rendering with memory management
      (function() {
        let checkCount = 0;
        const maxChecks = 50; // Reduced from 150 to 50 (5 seconds max)
        let babelLoadTimeout = false;
        let reactRoot = null; // Store root reference for cleanup

        const checkAndRender = function() {
          checkCount++;

          console.log('Check attempt', checkCount, 'typeof App:', typeof App, 'Babel loaded:', typeof window.Babel);

          try {
            // Check if Babel is loaded
            if (typeof window.Babel === 'undefined') {
              if (checkCount < 20) { // Reduced from 30
                setTimeout(checkAndRender, 100);
                return;
              } else {
                babelLoadTimeout = true;
                throw new Error('Babel compiler failed to load. Please check your internet connection.');
              }
            }

            // Verify App component exists
            if (typeof App === 'undefined') {
              if (checkCount >= maxChecks) {
                const errorMsg = babelLoadTimeout
                  ? 'Babel compiler failed to load. Please check your internet connection.'
                  : 'App component not found after compilation timeout. The code may have syntax errors.';
                throw new Error(errorMsg);
              }

              setTimeout(checkAndRender, 100);
              return;
            }

            // Hide loading and show content
            const loadingEl = document.getElementById('loading');
            const rootEl = document.getElementById('root');

            if (!rootEl) {
              throw new Error('Root element not found');
            }

            if (loadingEl) loadingEl.style.display = 'none';
            rootEl.style.display = 'block';

            // Ensure root element fills the container
            rootEl.style.width = '100%';
            rootEl.style.height = '100%';
            rootEl.style.minHeight = '100vh';
            rootEl.style.display = 'flex';
            rootEl.style.flexDirection = 'column';

            // Render the component with memory optimization
            try {
              console.log('Rendering App component...');

              // Test if App function returns something
              let appResult;
              try {
                appResult = App();
                if (!appResult) {
                  throw new Error('App function returned null or undefined');
                }
              } catch (testError) {
                console.error('ERROR calling App function:', testError);
                throw testError;
              }

              // Clear any existing content
              rootEl.innerHTML = '';

              // Create React root with cleanup support
              reactRoot = ReactDOM.createRoot(rootEl);
              const appElement = React.createElement(App);

              // Render with error boundary
              reactRoot.render(appElement);

              console.log('Component rendered successfully');

              // Memory cleanup: Clear unnecessary references
              setTimeout(() => {
                if (loadingEl && loadingEl.parentNode) {
                  loadingEl.parentNode.removeChild(loadingEl);
                }
              }, 1000);

            } catch (renderError) {
              throw new Error('Failed to render component: ' + renderError.message);
            }
          } catch (error) {
            console.error('Render error:', error);
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
              loadingEl.innerHTML = \`
                <div class="error">
                  <h3>❌ Render Error</h3>
                  <p><strong>Could not render the component:</strong></p>
                  <p>\${error.message}</p>
                  <div class="error-details">
                    <strong>Error Details:</strong><br>
                    \${error.stack || 'No stack trace available'}
                  </div>
                  <div class="error-details" style="margin-top: 16px;">
                    <strong>Possible causes:</strong><br>
                    • Syntax errors in generated code<br>
                    • Missing React imports<br>
                    • Invalid JSX syntax<br>
                    • Babel compilation failed<br>
                    • Component code is incomplete<br>
                    • Browser memory limit exceeded
                  </div>
                  <p style="margin-top: 16px; font-size: 14px; color: #7f1d1d;">
                    💡 <strong>Tip:</strong> Try refreshing the preview or regenerating simpler code.
                  </p>
                </div>
              \`;
            }

            // Cleanup function
            window.cleanupPreview = function() {
              if (reactRoot) {
                try {
                  reactRoot.unmount();
                  reactRoot = null;
                } catch (e) {
                  console.error('Error unmounting React root:', e);
                }
              }
            };
          }
        };

        // Start checking after a short delay
        setTimeout(checkAndRender, 500);

        // Cleanup on page unload to prevent memory leaks
        window.addEventListener('beforeunload', function() {
          if (window.cleanupPreview) {
            window.cleanupPreview();
          }
        });
      })();

    </script>
  </body>
</html>
`

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview: ' + error.message },
      { status: 500 }
    )
  }
}

