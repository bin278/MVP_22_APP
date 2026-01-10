"use strict";(()=>{var e={};e.id=8496,e.ids=[8496],e.modules={3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},12412:e=>{e.exports=require("assert")},21820:e=>{e.exports=require("os")},27910:e=>{e.exports=require("stream")},28354:e=>{e.exports=require("util")},29021:e=>{e.exports=require("fs")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{e.exports=require("path")},34631:e=>{e.exports=require("tls")},41204:e=>{e.exports=require("string_decoder")},44870:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},54369:(e,t,r)=>{r.r(t),r.d(t,{POST:()=>d,taskQueue:()=>c});var s=r(24715),o=r(76703),n=r(81381),a=r(51304);function p(e,t){r.e(1051).then(r.bind(r,51051)).then(({broadcastTaskUpdate:r})=>{r(e,t)}).catch(e=>{console.error("Failed to import broadcast function:",e)})}var i=function(e){return e.PENDING="pending",e.RUNNING="running",e.COMPLETED="completed",e.FAILED="failed",e.CANCELLED="cancelled",e}(i||{});global.taskQueue||(global.taskQueue=new Map);let c=global.taskQueue;function l(e,t=!1){let r={files:{"src/App.tsx":e,"src/index.css":`body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
}`,"package.json":JSON.stringify({name:"generated-app",version:"0.1.0",dependencies:{react:"^18.2.0","react-dom":"^18.2.0","react-scripts":"5.0.1"}},null,2)},projectName:"smart-generated-app"};return t&&(r.isModification=!0),r}async function u(e,t,r){let s=new n.Ay(t.includes("deepseek")?{apiKey:process.env.DEEPSEEK_API_KEY,baseURL:process.env.DEEPSEEK_BASE_URL||"https://api.deepseek.com/v1"}:{apiKey:process.env.OPENAI_API_KEY});r(10);try{var o;let n=await s.chat.completions.create({model:t,messages:[{role:"system",content:`Generate a complete React component. Return ONLY the React component code, no explanations, no markdown, no JSON structure.

Requirements:
1. Use proper code formatting with consistent indentation (2 spaces)
2. Include all necessary React imports
3. Create a functional component with proper JSX structure
4. Use Tailwind CSS classes for styling
5. Make it immediately runnable
6. Export as default

Example output:
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Hello World</h1>
        <p className="text-gray-600">Welcome to my app!</p>
      </div>
    </div>
  );
}

export default App;`},{role:"user",content:e.trim()}],max_tokens:parseInt(process.env.DEEPSEEK_MAX_TOKENS||"4000"),temperature:parseFloat(process.env.DEEPSEEK_TEMPERATURE||"0.7")});r(80);let a=((o=n.choices[0]?.message?.content||"").match(/\n/g)||[]).length>5?o:o.replace(/;/g,";\n").replace(/{/g,"{\n").replace(/}/g,"\n}").replace(/\n\s*\n\s*\n/g,"\n\n"),p=l(a);return r(100),p}catch(e){throw console.error("AI生成失败:",e),e}}async function d(e){console.log("\uD83D\uDCE5 收到异步生成请求");try{let t=await (0,o.oC)(e);if(!t.success)return s.NextResponse.json({error:t.error},{status:401});let r=t.user,{prompt:n,model:a,conversationId:p,existingContent:i,isModification:l,originalCode:u}=await e.json();console.log("\uD83D\uDCDD 请求参数:",{prompt:n.substring(0,50)+"...",model:a,conversationId:p,isModification:l});let d=`async_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,m={taskId:d,userId:r.id,conversationId:p,prompt:n.trim(),model:a||"deepseek-chat",status:"pending",progress:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return c.set(d,m),console.log(`✅ 任务已存储到全局队列: ${d}, 队列大小: ${c.size}`),setImmediate(()=>{console.log(`🚀 开始异步处理任务: ${d}, isModification: ${!!i}`),g(m,i,!!i).catch(e=>{console.error("异步任务处理失败:",e)})}),s.NextResponse.json({success:!0,taskId:d,status:"accepted",message:"异步任务已提交处理"})}catch(e){return console.error("创建异步任务失败:",e),s.NextResponse.json({error:"创建任务失败"},{status:500})}}async function g(e,t,r=!1){try{e.status="running",e.startedAt=new Date().toISOString(),e.progress=10,e.updatedAt=new Date().toISOString(),c.set(e.taskId,e),p(e.taskId,{type:"status_update",status:"running",progress:10,message:"开始处理任务..."});let s=t?`Continue generating from this existing code:

${t}

Additional requirements: ${e.prompt}`:e.prompt;console.log(`🎯 处理任务类型: ${r?"修改":"生成"}, 现有内容长度: ${t?.length||0}`);let o=await u(s,e.model,t=>{e.progress=10+.8*t,e.updatedAt=new Date().toISOString(),c.set(e.taskId,e),p(e.taskId,{type:"progress_update",progress:e.progress,message:`生成进度: ${Math.round(e.progress)}%`})}),n=l(o.files["src/App.tsx"]||o.files[Object.keys(o.files)[0]],r);e.status="completed",e.progress=100,e.result=n,e.completedAt=new Date().toISOString(),e.updatedAt=new Date().toISOString(),c.set(e.taskId,e);try{let t=0;n.files&&Object.values(n.files).forEach(e=>{t+=String(e).length}),await (0,a.un)(e.userId,{model:e.model,prompt_length:e.prompt.length,generated_length:t,type:r?"code_modification":"code_generation"}),console.log("✅ [异步任务] 代码生成使用已记录")}catch(e){console.error("❌ [异步任务] 记录使用失败:",e)}p(e.taskId,{type:"completed",result:o,message:"代码生成完成！"}),console.log(`✅ 异步任务 ${e.taskId} 完成`)}catch(t){console.error(`❌ 异步任务 ${e.taskId} 失败:`,t),e.status="failed",e.error=t.message||"生成失败",e.updatedAt=new Date().toISOString(),c.set(e.taskId,e),p(e.taskId,{type:"failed",error:e.error,message:"代码生成失败"})}}},55511:e=>{e.exports=require("crypto")},55591:e=>{e.exports=require("https")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:e=>{e.exports=require("timers")},74075:e=>{e.exports=require("zlib")},79428:e=>{e.exports=require("buffer")},79551:e=>{e.exports=require("url")},81630:e=>{e.exports=require("http")},83997:e=>{e.exports=require("tty")},91645:e=>{e.exports=require("net")},94735:e=>{e.exports=require("events")},98682:(e,t,r)=>{r.r(t),r.d(t,{patchFetch:()=>u,routeModule:()=>p,serverHooks:()=>l,workAsyncStorage:()=>i,workUnitAsyncStorage:()=>c});var s=r(45002),o=r(89587),n=r(1202),a=r(54369);let p=new s.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/generate-async/route",pathname:"/api/generate-async",filename:"route",bundlePath:"app/api/generate-async/route"},resolvedPagePath:"F:\\project1\\APP\\11\\app\\api\\generate-async\\route.ts",nextConfigOutput:"",userland:a}),{workAsyncStorage:i,workUnitAsyncStorage:c,serverHooks:l}=p;function u(){return(0,n.patchFetch)({workAsyncStorage:i,workUnitAsyncStorage:c})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[1202,8700,2806,3097,8431,1381,3880,6703],()=>r(98682));module.exports=s})();