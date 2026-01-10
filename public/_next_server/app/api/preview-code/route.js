(()=>{var e={};e.id=6840,e.ids=[6840],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},17546:()=>{},28247:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>h,routeModule:()=>l,serverHooks:()=>u,workAsyncStorage:()=>p,workUnitAsyncStorage:()=>d});var o={};r.r(o),r.d(o,{POST:()=>s});var n=r(45002),a=r(89587),c=r(1202),i=r(24715);async function s(e){try{let t;let{code:r,files:o,device:n="desktop"}=await e.json();if(!r||"string"!=typeof r)return i.NextResponse.json({error:"Code is required"},{status:400});let a=r.length,c=r.split("\n").length,s=(t=0+5*Math.log10(r.length+1)+3*Math.log10(r.split("\n").length+1)+.1*(r.match(/\{/g)||[]).length+.5*(r.match(/<[A-Z][a-zA-Z]*/g)||[]).length+2*(r.match(/use(State|Effect|Callback|Memo|Ref|Context|Reducer)/g)||[]).length+ +(r.match(/on[A-Z][a-zA-Z]+/g)||[]).length+2*(r.match(/function\s+\w+/g)||[]).length,Math.round(t+=+(r.match(/\?[^:]+:/g)||[]).length));if(console.log("\uD83D\uDD0D Code complexity analysis:",{length:a,lines:c,complexity:s}),a>3e5)return i.NextResponse.json({error:"Generated code is too large for preview",details:`Code size: ${Math.round(a/1024)}KB (max: 300KB). Please try generating a simpler component.`},{status:400});if(c>5e3)return i.NextResponse.json({error:"Generated code is too long for preview",details:`Code lines: ${c} (max: 5000). Please try generating a simpler component.`},{status:400});if(s>1500)return i.NextResponse.json({error:"Generated code is too complex for browser preview",details:`Complexity score: ${s}. The preview uses in-browser compilation which has limits. Please try generating a simpler component or use the code directly.`},{status:400});let l=r.trim(),p=l.replace(/export\s+default\s+/g,"").replace(/export\s+/g,"").replace(/import\s*{\s*[\s\S]*?\s*}\s*from\s+['"`][^'"`]*['"`];?/g,"").replace(/import\s+.*?\s+from\s+['"\`]lucide-react['"\`];?\s*\n/g,"").replace(/import\s+.*?\s+from\s+['"\`]react['"\`];?\s*\n/g,"").replace(/import\s+.*?\s+from\s+['"\`]react-dom['"\`];?\s*\n/g,"").replace(/import\s+.*?\s+from\s+['"\`].*?['"\`];?\s*\n/g,"").replace(/import\s*\(\s*['"\`].*?['"\`]\s*\);?\s*\n/g,"").replace(/const\s+\w+\s*=\s*require\s*\(['"\`].*?['"\`]\);?\s*\n/g,"").replace(/\buseState\b/g,"React.useState").replace(/\buseEffect\b/g,"React.useEffect").replace(/\buseCallback\b/g,"React.useCallback").replace(/\buseMemo\b/g,"React.useMemo").replace(/\buseRef\b/g,"React.useRef").replace(/\buseContext\b/g,"React.useContext").replace(/\buseReducer\b/g,"React.useReducer").replace(/\buseLayoutEffect\b/g,"React.useLayoutEffect").replace(/javascript:\s*[^;]*;?/gi,"void(0);").replace(/javascript:/gi,"void(0);").trim();if(p=p.replace(/^\s*javascript\s*$/gm,"").replace(/\breturn\s*\(\s*javascript\s*/g,"return (").replace(/\(\s*javascript\s+/g,"(").replace(/\s+javascript\s*$/gm,"").replace(/\n\s*javascript\s*\n/g,"\n").trim(),console.log("Original code:",l.substring(0,300)+"..."),console.log("Clean code:",p.substring(0,300)+"..."),console.log("Contains Recharts import:",p.includes("recharts")||l.includes("recharts")),console.log("Contains ResponsiveContainer:",p.includes("ResponsiveContainer")),console.log("Clean code full length:",p.length),p.includes("function App")||p.includes("const App =")||p.includes("App = "))console.log("Code already has App declaration, checking if it returns correctly..."),p.includes("function App")&&!p.match(/function\s+App\s*\([^)]*\)\s*\{[^}]*return/)&&(console.warn("WARNING: App function exists but may not have return statement!"),console.log("App function code:",p.match(/function\s+App\s*\([^)]*\)\s*\{[^}]*\}/)?.[0]||"not found"));else{console.log("Code does not have App function, will wrap it");let e=(p=p.replace(/^\s*javascript\s*$/gm,"").replace(/\breturn\s*\(\s*javascript\s*/g,"return (").replace(/\(\s*javascript\s+/g,"(").replace(/\s+javascript\s*$/gm,"").replace(/\n\s*javascript\s*\n/g,"\n").trim()).trim();if(e.startsWith("return")||e.startsWith("(")&&!e.startsWith("function")&&!e.match(/^\(\s*function/))p="function App() {\n"+p+"\n}",console.log("Wrapped return statement in App function");else if(/^(function\s+\w+|const\s+\w+\s*=\s*(function|\(|=>))/.test(e)||/^\s*(javascript\s+)?(function\s+\w+|const\s+\w+\s*=\s*(function|\(|=>))/.test(e)){let e=(p=p.replace(/^\s*javascript\s+/m,"").trim()).trim(),t=e.match(/^function\s+(\w+)/),r=e.match(/^const\s+(\w+)\s*=/),o=null;if(t)o=t[1],console.log("Found function component:",o);else if(r)o=r[1],console.log("Found const component:",o);else{let e=p.match(/(?:function|const)\s+(\w+)/);e&&(o=e[1],console.log("Found component via fallback:",o))}o?(p=p+"\n\nfunction App() {\n  if (typeof "+o+' === "undefined") {\n    console.error("ERROR: Component '+o+' is not defined!");\n    return React.createElement("div", null, "Error: Component '+o+' not found");\n  }\n  return React.createElement('+o+");\n}",console.log("Final code structure: Component function + App function that returns it"),console.log("Component name:",o),console.log("Code preview:",p.substring(0,400))):(console.log("No component name found, wrapping code directly"),p=p.includes("return")?"function App() {\n"+p+"\n}":"function App() {\n  return (\n"+p+"\n  );\n}")}else p="function App() {\n  return (\n"+p+"\n  );\n}",console.log("Wrapped JSX in App function");console.log("Wrapped in function App():",p.substring(0,400)+"..."),console.log("Final cleanCode length:",p.length)}let d=p.replace(/<\/script>/gi,"<\\/script>").replace(/<!--/g,"<\\!--").replace(/-->/g,"--\\>").replace(/<script/gi,"<\\script");console.log("Final escaped code:",d.substring(0,300)+"..."),console.log("Code length:",d.length);let u=`
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

      ${d}
      
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
`;return new i.NextResponse(u,{headers:{"Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff"}})}catch(e){return console.error("Error generating preview:",e),i.NextResponse.json({error:"Failed to generate preview: "+e.message},{status:500})}}let l=new n.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/preview-code/route",pathname:"/api/preview-code",filename:"route",bundlePath:"app/api/preview-code/route"},resolvedPagePath:"F:\\project1\\APP\\11\\app\\api\\preview-code\\route.ts",nextConfigOutput:"",userland:o}),{workAsyncStorage:p,workUnitAsyncStorage:d,serverHooks:u}=l;function h(){return(0,c.patchFetch)({workAsyncStorage:p,workUnitAsyncStorage:d})}},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},80594:()=>{}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[1202,8700],()=>r(28247));module.exports=o})();