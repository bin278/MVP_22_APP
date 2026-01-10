(()=>{var e={};e.id=2013,e.ids=[2013],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},17546:()=>{},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},80594:()=>{},87930:(e,t,i)=>{"use strict";i.r(t),i.d(t,{patchFetch:()=>u,routeModule:()=>l,serverHooks:()=>v,workAsyncStorage:()=>c,workUnitAsyncStorage:()=>p});var s={};i.r(s),i.d(s,{POST:()=>d});var a=i(45002),r=i(89587),o=i(1202),n=i(24715);async function d(e){try{let{code:t,device:i="desktop"}=await e.json();if(!t)return n.NextResponse.json({error:"Code is required"},{status:400});let s={desktop:"100%",tablet:"768px",mobile:"375px"},a=s[i]||s.desktop,r=function(e,t){var i;let s=e.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/),a=s?s[1]:"Component",r=function(e){let t=e.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g,"").replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*/g,""),i=[];return(t.split("\n").forEach((e,t)=>{let s=e.match(/^(\s*)(<([A-Z][a-zA-Z]*)|([a-z][a-zA-Z]*))/);if(s){let e=s[1].length,t=s[3]||s[4],a=!!s[3];i.push({tag:t,indent:Math.floor(e/2),isComponent:a})}}),0===i.length)?'<div class="structure-item">\uD83D\uDCC4 组件结构 (无法解析)</div>':i.slice(0,20).map(({tag:e,indent:t,isComponent:i})=>{let s=t>0?`indent-${Math.min(t,3)}`:"";return`<div class="structure-item ${s}">&lt;<span class="${i?"component":"tag"}">${e}</span>&gt;</div>`}).join("")+(i.length>20?'<div class="structure-item">... (更多元素)</div>':"")}(e),o=(i=e,[...new Set((i.match(/className=["']([^"']+)["']/g)||[]).map(e=>e.match(/className=["']([^"']+)["']/)?.[1]||"").join(" ").split(/\s+/).filter(e=>e.length>0))]),n=function(e){let t=e.match(/interface\s+(\w+)\s*Props\s*{([^}]+)}/);return t?t[2].split("\n").map(e=>e.trim().match(/(\w+)\s*:/)?.[1]).filter(Boolean):[]}(e),d=function(e){let t=[];return(e.match(/import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/g)||[]).forEach(e=>{let i=e.match(/import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/);if(i){let[,e,s]=i;e.split(",").forEach(e=>{t.push(`${e.trim()} (from ${s})`)})}}),(e.match(/import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g)||[]).forEach(e=>{let i=e.match(/import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/);i&&t.push(`${i[1]} (from ${i[2]})`)}),t.slice(0,15)}(e),l={lines:e.split("\n").length,size:Math.round(e.length/1024),hasHooks:/use(State|Effect|Callback|Memo|Ref|Context)/.test(e),hasEventHandlers:/on[A-Z][a-zA-Z]+/.test(e),componentCount:(e.match(/<[A-Z][a-zA-Z]*/g)||[]).length};return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>静态预览 - ${a}</title>
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
      max-width: ${t};
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
      <h1>🎨 ${a}</h1>
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
            <div class="value">${a}</div>
          </div>
          <div class="info-card">
            <div class="label">代码行数</div>
            <div class="value">${l.lines} 行</div>
          </div>
          <div class="info-card">
            <div class="label">文件大小</div>
            <div class="value">${l.size} KB</div>
          </div>
          <div class="info-card">
            <div class="label">组件数量</div>
            <div class="value">${l.componentCount} 个</div>
          </div>
        </div>
      </div>

      ${d.length>0?`
      <div class="section">
        <div class="section-title">📦 依赖项</div>
        <div class="imports-list">
          ${d.map(e=>`<div class="import-tag">${e}</div>`).join("")}
        </div>
      </div>
      `:""}

      ${n.length>0?`
      <div class="section">
        <div class="section-title">⚙️ Props 接口</div>
        <div class="imports-list">
          ${n.map(e=>`<div class="import-tag">${e}</div>`).join("")}
        </div>
      </div>
      `:""}

      ${o.length>0?`
      <div class="section">
        <div class="section-title">🎨 使用的样式类</div>
        <div class="imports-list">
          ${o.slice(0,10).map(e=>`<div class="import-tag">${e}</div>`).join("")}
          ${o.length>10?`<div class="import-tag">+${o.length-10} 更多</div>`:""}
        </div>
      </div>
      `:""}

      <div class="section">
        <div class="section-title">🏗️ 组件结构</div>
        <div class="structure-tree">
          ${r}
        </div>
      </div>

      <div class="section">
        <div class="section-title">💻 代码片段</div>
        <div class="code-preview">${function(e){let t={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return e.replace(/[&<>"']/g,e=>t[e])}(e.substring(0,2e3))}${e.length>2e3?"\n\n... (代码已截断)":""}</div>
      </div>

      <div class="section">
        <div class="section-title">✨ 特性检测</div>
        <div class="info-grid">
          <div class="info-card">
            <div class="label">React Hooks</div>
            <div class="value">${l.hasHooks?"✅ 使用中":"❌ 未使用"}</div>
          </div>
          <div class="info-card">
            <div class="label">事件处理</div>
            <div class="value">${l.hasEventHandlers?"✅ 包含":"❌ 无"}</div>
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
</html>`}(t,a);return new n.NextResponse(r,{headers:{"Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff"}})}catch(e){return console.error("Error generating static preview:",e),n.NextResponse.json({error:"Failed to generate static preview: "+e.message},{status:500})}}let l=new a.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/preview-static/route",pathname:"/api/preview-static",filename:"route",bundlePath:"app/api/preview-static/route"},resolvedPagePath:"F:\\project1\\APP\\11\\app\\api\\preview-static\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:c,workUnitAsyncStorage:p,serverHooks:v}=l;function u(){return(0,o.patchFetch)({workAsyncStorage:c,workUnitAsyncStorage:p})}}};var t=require("../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),s=t.X(0,[1202,8700],()=>i(87930));module.exports=s})();