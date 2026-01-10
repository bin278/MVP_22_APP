(()=>{var e={};e.id=9454,e.ids=[9454],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},17546:()=>{},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},29746:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>E,routeModule:()=>u,serverHooks:()=>l,workAsyncStorage:()=>p,workUnitAsyncStorage:()=>m});var o={};r.r(o),r.d(o,{POST:()=>d});var s=r(45002),n=r(89587),i=r(1202),a=r(24715),c=r(81381);async function d(e){try{let{code:t,instruction:r}=await e.json();if(!t||"string"!=typeof t)return a.NextResponse.json({error:"Code is required"},{status:400});if(!r||"string"!=typeof r||0===r.trim().length)return a.NextResponse.json({error:"Instruction is required"},{status:400});let o=process.env.DEEPSEEK_API_KEY,s=process.env.DEEPSEEK_BASE_URL||"https://api.deepseek.com",n=process.env.DEEPSEEK_MODEL||"deepseek-chat";if(!o||"your_actual_api_key_here"===o)return a.NextResponse.json({error:"DeepSeek API key is not configured"},{status:500});let i=new c.Ay({apiKey:o,baseURL:s});console.log("\uD83D\uDD04 开始同步AI代码修改..."),console.log("\uD83D\uDD27 开始AI代码修改，让AI完全修改完毕...");try{let e=await i.chat.completions.create({model:n,messages:[{role:"system",content:`You are a code modification assistant. Modify the given React/TypeScript code according to the user's instruction. Return ONLY the modified code, no explanations, no markdown, no JSON structure.

Requirements:
1. Keep the same code structure and formatting style
2. Only modify what the user asks for
3. Ensure the code remains functional
4. Use proper indentation (2 spaces)
5. Return the complete modified code
6. Take your time to make comprehensive modifications

Example:
User code: "function App() { return <div>Hello</div>; }"
Instruction: "Add a button"
Response: "function App() { return <div><div>Hello</div><button>Click me</button></div>; }"`},{role:"user",content:`Current code:
\`\`\`typescript
${t}
\`\`\`

Instruction: ${r}

Return only the modified code:`}],max_tokens:parseInt(process.env.DEEPSEEK_MAX_TOKENS||"3000"),temperature:parseFloat(process.env.DEEPSEEK_TEMPERATURE||"0.5")});console.log("✅ 同步代码修改完成");let o=e.choices[0]?.message?.content;if(!o)throw Error("No content generated from AI");let s=o.trim(),c=s.match(/```(?:typescript|tsx|jsx|js|ts)?\s*([\s\S]*?)```/);return c&&(s=c[1].trim()),a.NextResponse.json({code:0,msg:"代码修改成功",data:{code:s,codeLength:s.length}})}catch(e){if(console.error("❌ 同步代码修改失败:",e),"ECONNABORTED"===e.code||e.message?.includes("timeout"))return a.NextResponse.json({code:-1,msg:"网络请求超时，请稍后重试",error:"网络超时"},{status:500});return a.NextResponse.json({code:-1,msg:"代码修改失败",error:e.message},{status:500})}}catch(e){return console.error("Error starting code modification:",e),a.NextResponse.json({code:-1,msg:"请求处理失败",error:e.message},{status:500})}}let u=new s.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/modify-code/route",pathname:"/api/modify-code",filename:"route",bundlePath:"app/api/modify-code/route"},resolvedPagePath:"F:\\project1\\APP\\11\\app\\api\\modify-code\\route.ts",nextConfigOutput:"",userland:o}),{workAsyncStorage:p,workUnitAsyncStorage:m,serverHooks:l}=u;function E(){return(0,i.patchFetch)({workAsyncStorage:p,workUnitAsyncStorage:m})}},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},80594:()=>{}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[1202,8700,1381],()=>r(29746));module.exports=o})();