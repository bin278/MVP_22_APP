(()=>{var e={};e.id=7746,e.ids=[7746],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},17546:()=>{},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},32329:(e,t,o)=>{"use strict";o.r(t),o.d(t,{patchFetch:()=>h,routeModule:()=>m,serverHooks:()=>E,workAsyncStorage:()=>d,workUnitAsyncStorage:()=>u});var r={};o.r(r),o.d(r,{POST:()=>l});var n=o(45002),c=o(89587),s=o(1202),a=o(24715),p=o(81381);async function i(e){let t=process.env.DEEPSEEK_API_KEY,o=process.env.DEEPSEEK_BASE_URL||"https://api.deepseek.com",r=process.env.DEEPSEEK_MODEL||"deepseek-chat";if(!t)throw Error("DEEPSEEK_API_KEY is not configured");let n=new p.Ay({apiKey:t,baseURL:o}),c=await n.chat.completions.create({model:r,messages:[{role:"system",content:"You are a professional frontend developer. Generate a complete React component based on user requirements. Return ONLY the React component code without any imports or exports. Use modern React hooks and functional components. Include inline styles or Tailwind classes. Make it visually appealing and responsive."},{role:"user",content:e.trim()}],max_tokens:parseInt(process.env.DEEPSEEK_MAX_TOKENS||"2000"),temperature:parseFloat(process.env.DEEPSEEK_TEMPERATURE||"0.7")}),s=c.choices[0]?.message?.content;if(!s)throw Error("Empty response from DeepSeek API");return s}async function l(e){try{let{prompt:t}=await e.json();if(!t||"string"!=typeof t||0===t.trim().length)return a.NextResponse.json({error:"Prompt is required"},{status:400});let o=await i(t.trim());if(!o||0===o.trim().length)return a.NextResponse.json({error:"Could not generate preview"},{status:500});let r=`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${generatedProject.projectName} - Preview</title>
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
      ${o.replace("export default function App","function App").replace(/import.*from.*lucide-react.*\n/g,"").replace(/import.*from.*react.*\n/g,"")}
      
      // Render the component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    </script>
  </body>
</html>
`;return new a.NextResponse(r,{headers:{"Content-Type":"text/html"}})}catch(e){return console.error("Error generating preview:",e),a.NextResponse.json({error:"Failed to generate preview"},{status:500})}}let m=new n.AppRouteRouteModule({definition:{kind:c.RouteKind.APP_ROUTE,page:"/api/preview/route",pathname:"/api/preview",filename:"route",bundlePath:"app/api/preview/route"},resolvedPagePath:"F:\\project1\\APP\\11\\app\\api\\preview\\route.ts",nextConfigOutput:"",userland:r}),{workAsyncStorage:d,workUnitAsyncStorage:u,serverHooks:E}=m;function h(){return(0,s.patchFetch)({workAsyncStorage:d,workUnitAsyncStorage:u})}},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},80594:()=>{}};var t=require("../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),r=t.X(0,[1202,8700,1381],()=>o(32329));module.exports=r})();