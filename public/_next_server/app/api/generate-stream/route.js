"use strict";(()=>{var e={};e.id=1796,e.ids=[1796,7914],e.modules={3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},12412:e=>{e.exports=require("assert")},21820:e=>{e.exports=require("os")},27910:e=>{e.exports=require("stream")},28354:e=>{e.exports=require("util")},29021:e=>{e.exports=require("fs")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{e.exports=require("path")},34631:e=>{e.exports=require("tls")},37351:(e,t,r)=>{r.r(t),r.d(t,{patchFetch:()=>_,routeModule:()=>x,serverHooks:()=>w,workAsyncStorage:()=>A,workUnitAsyncStorage:()=>E});var s={};r.r(s),r.d(s,{POST:()=>v});var o=r(45002),n=r(89587),a=r(1202),i=r(24715),l=r(81381),c=r(38605),p=r(76703),d=r(37914),u=r(51304);function m(e,t){let r=e.length;r<100?(t.push(`${e}，请先创建基础结构。`),t.push(`${e}，请完善功能和样式。`)):r<200?(t.push(`${e}，第一部分：基础实现。`),t.push(`${e}，第二部分：功能完善。`)):(t.push(`${e.substring(0,r/3)}...，第一阶段实现。`),t.push(`${e.substring(r/3,2*r/3)}...，第二阶段完善。`),t.push(`${e.substring(2*r/3)}，第三阶段集成。`))}let g=new Map;async function h(e,t,r,s,o,n,a){try{console.log(`🔄 启动异步后备处理，任务ID: ${e}`);let i=new l.Ay({apiKey:s,baseURL:o}),c=n?`基于以下已生成的代码片段，继续完成完整的React组件：

已生成：${n}

原始需求：${t}

请生成完整的、可运行的代码。`:t,p=await i.chat.completions.create({model:r,messages:[{role:"system",content:`Generate a complete React component. Return ONLY the React component code, no explanations, no markdown, no JSON structure.

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

export default App;`},{role:"user",content:c}],max_tokens:parseInt(process.env.DEEPSEEK_MAX_TOKENS||"4000"),temperature:parseFloat(process.env.DEEPSEEK_TEMPERATURE||"0.7")}),d=p.choices[0]?.message?.content||"",m=y(n+d);(!m||m.length<100)&&(m=`import React from 'react';

function GeneratedApp() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          Code generation completed with fallback mode.
        </p>
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This was generated using fallback mode due to complexity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GeneratedApp;`);let h={files:{"src/App.tsx":m,"src/index.css":`body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
}`,"package.json":JSON.stringify({name:"generated-app",version:"0.1.0",dependencies:{react:"^18.2.0","react-dom":"^18.2.0","react-scripts":"5.0.1"}},null,2)},projectName:"smart-generated-app"},f=g.get(e);f&&(f.status="completed",f.progress=100),console.log(`✅ 异步后备处理完成，任务ID: ${e}`);try{let e=0;h.files&&Object.values(h.files).forEach(t=>{e+=String(t).length}),await (0,u.un)(a.id,{model:r,prompt_length:t.length,generated_length:e,type:"code_generation"}),console.log("✅ 异步模式代码生成使用已记录")}catch(e){console.error("❌ 记录使用失败:",e)}return h}catch(r){console.error("异步后备处理失败:",r);let t=g.get(e);throw t&&(t.status="failed"),r}}async function f(e,t,r,s){try{let o={conversation_id:e,user_id:s,role:t,content:r,message_type:"code_generation",created_at:new Date().toISOString()};await (0,d.add)("conversation_messages",o),console.log(`💾 Message saved to conversation ${e}`)}catch(e){throw console.error("❌ Failed to save message to conversation:",e),e}}function y(e){let t=(e.match(/\n/g)||[]).length;return t>5?e:e.length>100&&t<3?(console.log("Formatting minified code"),e.replace(/;/g,";\n").replace(/{/g,"{\n").replace(/}/g,"\n}").replace(/\n\s*\n\s*\n/g,"\n\n").split("\n").map((e,t,r)=>{let s=e.trim();if(!s)return"";let o=0;for(let e=0;e<t;e++){let t=r[e].trim();t.endsWith("{")&&o++,t.startsWith("}")&&o--}return"  ".repeat(Math.max(0,o))+s}).join("\n")):e}async function v(e){try{let t,r,s;let o=await (0,p.oC)(e);if(!o.success)return console.log("❌ Authentication failed:",o.error),i.NextResponse.json({error:o.error||"Authentication required"},{status:401});let n=o.user;console.log("✅ User authenticated:",n.email);let a="pro"===n.subscription_plan?"pro":"free";console.log("\uD83D\uDCCA User tier:",a);let{prompt:d,model:v="deepseek-chat",conversationId:x}=await e.json();if(console.log("\uD83D\uDCDD Request details:",{prompt:d,requestedModel:v,conversationId:x,userId:n.id}),!d||"string"!=typeof d||0===d.trim().length)return i.NextResponse.json({error:"Prompt is required"},{status:400});console.log("\uD83C\uDFAF 启用分段生成模式（全任务适用）");let A=function(e){let t=[];if(e.includes("包含")||e.includes("包括")||e.includes("和")||e.includes("以及")||e.includes("功能")||e.includes("组件")){let r=e.split(/[，,。包含包括和以及功能组件]/).filter(e=>e.trim().length>5);if(r.length>=2){let e=r[0].trim();t.push(`${e}，请创建一个基础的组件结构。`);for(let s=1;s<Math.min(r.length,4);s++){let o=r[s].trim();o.length>3&&t.push(`${e}，请添加${o}功能。`)}if(r.length>4){let s=r.slice(3).join("、");t.push(`${e}，请集成${s}等其他功能。`)}}else m(e,t)}else m(e,t);return t.length<2&&m(e,t),t.slice(0,5)}(d);console.log(`📊 提示已分割为 ${A.length} 个部分`);let E=`stream_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,w={taskId:E,status:"streaming",streamedContent:"",progress:0,lastActivity:Date.now(),mode:"streaming"};g.set(E,w);let _=function(e,t){let r=e.length+2*e.split(" ").length,s=t.includes("gpt-4")||t.includes("claude")||t.includes("deepseek");return r>800||r>400&&s}(d,v);if(console.log(`📊 复杂度评估: ${d.length} 字符, 风险等级: ${_?"高":"低"}`),_)return console.log("\uD83D\uDEA8 高风险任务，直接切换到异步模式"),h(E,d,v,process.env.DEEPSEEK_API_KEY,process.env.DEEPSEEK_BASE_URL,"",n).then(e=>{let t=g.get(E);t&&(t.status="completed",t.progress=100)}).catch(e=>{console.error("异步生成失败:",e);let t=g.get(E);t&&(t.status="failed")}),new Response(`data: ${JSON.stringify({type:"mode_switch",mode:"async",taskId:E,reason:"high_complexity"})}

data: ${JSON.stringify({type:"async_started",taskId:E,message:"复杂任务已切换到异步模式，请等待完成"})}

data: [DONE]

`,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache"}});if(console.log("\uD83C\uDFAF 低风险任务，使用智能流式生成模式"),console.log("\uD83D\uDD10 Step 3: Checking model permissions"),console.log(`🔍 Checking model access: userTier=${a}, requestedModel=${v}`),!(0,c.v1)(a,v))return console.log(`❌ Access denied: ${v} requires higher tier than ${a}`),i.NextResponse.json({error:`Access denied: ${v} requires a higher subscription tier. Your tier: ${a}`},{status:403});let b=c.lb[v];if(!b)return console.log(`❌ Invalid model: ${v} not found in AVAILABLE_MODELS`),console.log(`📋 Available models:`,Object.keys(c.lb)),i.NextResponse.json({error:`Invalid model: ${v}. Available models: ${Object.keys(c.lb).join(", ")}`},{status:400});switch(console.log(`✅ Model access granted: ${v} (provider: ${b.provider})`),console.log("\uD83D\uDD11 Step 4: Setting up API configuration"),console.log(`🔧 Configuring API for provider: ${b.provider}`),b.provider){case"deepseek":console.log("\uD83C\uDFAF Using DeepSeek API"),t=process.env.DEEPSEEK_API_KEY,r=process.env.DEEPSEEK_BASE_URL||"https://api.deepseek.com",s=v;break;case"openai":console.log("\uD83C\uDFAF Using OpenAI API"),t=process.env.OPENAI_API_KEY,r=process.env.OPENAI_BASE_URL||"https://api.openai.com/v1",s=v;break;case"anthropic":console.log("\uD83C\uDFAF Using Anthropic API"),t=process.env.ANTHROPIC_API_KEY,r=process.env.ANTHROPIC_BASE_URL||"https://api.anthropic.com",s=v;break;case"zhipu":console.log("\uD83C\uDFAF Using Zhipu AI API"),t=process.env.GLM_API_KEY,r=process.env.GLM_BASE_URL||"https://open.bigmodel.cn/api/paas/v4/",s=process.env.GLM_MODEL||"glm-4-6";break;default:return console.log(`❌ Unsupported provider: ${b.provider}`),i.NextResponse.json({error:`Unsupported model provider: ${b.provider}`},{status:400})}if(console.log(`🔑 API config: key=${t?"present":"missing"}, baseUrl=${r}, model=${s}`),console.log("\uD83D\uDD10 Step 5: Checking API key configuration"),!t)return console.error(`❌ ${b.provider} API key is not configured`),i.NextResponse.json({error:`${b.provider} API key is not configured. Please set the appropriate API key in your environment variables.`,details:`Required environment variable: ${b.provider.toUpperCase()}_API_KEY`},{status:400});if(console.log(`✅ API key found for ${b.provider}`),["your_deepseek_api_key_here","your_glm_api_key_here","your_openai_api_key_here","your_anthropic_api_key_here"].includes(t))return console.error(`❌ ${b.provider} API key is using placeholder value`),i.NextResponse.json({error:`${b.provider} API key is using placeholder value. Please set the actual API key in your CloudBase environment variables.`,details:`Required environment variable: ${b.provider.toUpperCase()}_API_KEY (current value is a placeholder)`},{status:400});console.log(`✅ API key validation passed for ${b.provider}`);let I=new l.Ay({apiKey:t,baseURL:r});console.log("\uD83E\uDD16 Starting streaming AI generation...");let N=performance.now(),k=new ReadableStream({async start(e){let o=!1,a=t=>{if(!o)try{e.enqueue(t)}catch(e){console.error("Failed to enqueue data:",e),o=!0}},i=()=>{if(!o)try{e.close(),o=!0}catch(e){console.error("Failed to close controller:",e)}};try{let e;let o=await I.chat.completions.create({model:s,messages:[{role:"system",content:`Generate a complete React component. Return ONLY the React component code, no explanations, no markdown, no JSON structure.

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

export default App;`},{role:"user",content:d.trim()}],max_tokens:parseInt(process.env.DEEPSEEK_MAX_TOKENS||"4000"),temperature:parseFloat(process.env.DEEPSEEK_TEMPERATURE||"0.7"),stream:!0}),l=0,c="",p=setInterval(()=>{try{a(`data: ${JSON.stringify({type:"heartbeat",timestamp:Date.now()})}

`)}catch(e){console.error("Failed to send heartbeat:",e)}},1e4),m="",g=!1;for await(let e of o){let s=e.choices[0]?.delta?.content;if(s){if(w.streamedContent=c+=s,w.lastActivity=Date.now(),w.progress=Math.min(90,c.length/Math.max(2*d.length,500)*100),!g&&function(e){let t=Date.now()-e.lastActivity;return!!(t>3e4)||!!(t>15e3)&&!!(e.streamedContent.length<50)||!!(e.progress>0)&&!!(t>1e4)&&!!(e.progress<20)}(w)){console.log("\uD83D\uDD04 检测到生成风险，切换到异步模式"),g=!0,w.status="fallback_async",w.mode="async",a(`data: ${JSON.stringify({type:"mode_switch",mode:"async",taskId:w.taskId,reason:"runtime_risk_detected",progress:w.progress})}

`),h(w.taskId,d,v,t,r,c,n).catch(e=>{console.error("异步后备处理失败:",e),a(`data: ${JSON.stringify({type:"error",error:"异步处理失败",details:e.message})}

`)});break}for(let e of s)if(m+=e,l++,m.length>=5){let e={type:"chars",chars:m,totalLength:l,progress:w.progress};a(`data: ${JSON.stringify(e)}

`),m="",await new Promise(e=>setTimeout(e,2))}}}if(m.length>0){let e={type:"chars",chars:m,totalLength:l};a(`data: ${JSON.stringify(e)}

`)}clearInterval(p),console.log("AI streaming completed, total characters streamed:",l);let A=c.trim(),E=A.match(/```(?:jsx?|typescript|js|react)?\s*([\s\S]*?)```/);E&&(A=E[1].trim()),(A=y(A))&&!(A.length<50)||(A=`import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          Code generation completed successfully!
        </p>
      </div>
    </div>
  );
}

export default App;`),console.log("Final code formatted, length:",A.length);let _={type:"complete",project:{files:{"src/App.tsx":A,"src/index.css":`body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
}`,"package.json":JSON.stringify({name:"generated-app",version:"0.1.0",dependencies:{react:"^18.2.0","react-dom":"^18.2.0","react-scripts":"5.0.1"}},null,2)},projectName:"streaming-app"}};a(`data: ${JSON.stringify(_)}

`),a(`data: [DONE]

`),i(),console.log("Streaming generation completed, processing final response...");try{let t=c.trim(),r=c.match(/```(?:json)?\s*([\s\S]*?)```/);r&&(t=r[1].trim());let s=t.indexOf("{"),o=t.lastIndexOf("}");if(-1!==s&&-1!==o&&o>s&&(t=t.substring(s,o+1)),(e=JSON.parse(t)).files&&e.files["src/App.tsx"]){let t=e.files["src/App.tsx"],r=y(t);e.files["src/App.tsx"]=r}}catch(r){console.warn("JSON parsing failed in streaming response, using fallback");let t=c;for(let e of[/```(?:jsx?|typescript|js|react)?\s*([\s\S]*?)```/,/(?:function|const)\s+App[\s\S]*?(?=```|$)/]){let r=c?.match(e);if(r&&r[1]&&r[1].length>100){t=r[1].trim();break}}(t=y(t))&&!(t.length<50)||(t=`import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          The AI generated streaming content, but the code structure was incomplete.
          This is a fallback component to ensure the app runs.
        </p>
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> The streaming generation may have been truncated.
            Try simplifying your request or try again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;`),e={files:{"src/App.tsx":t,"src/index.css":`body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
}`,"package.json":JSON.stringify({name:"generated-app",version:"0.1.0",dependencies:{react:"^18.2.0","react-dom":"^18.2.0","react-scripts":"5.0.1"}},null,2)},projectName:"streaming-app"}}if(x)try{console.log("\uD83D\uDCBE Saving AI response to conversation:",x),await f(x,"assistant",JSON.stringify(e),n.id),console.log("✅ AI response saved to conversation")}catch(e){console.error("❌ Failed to save AI response to conversation:",e)}try{let t=0;e.files&&Object.values(e.files).forEach(e=>{t+=String(e).length}),await (0,u.un)(n.id,{model:v,prompt_length:d.length,generated_length:t,type:"code_generation"}),console.log("✅ 代码生成使用已记录")}catch(e){console.error("❌ 记录使用失败:",e)}let b={type:"complete",project:e};a(`data: ${JSON.stringify(b)}

`),a(`data: [DONE]

`),i();let k=performance.now();console.log(`✅ Streaming request completed in ${(k-N).toFixed(2)}ms`)}catch(s){console.error("Error in streaming response:",s);let e="Failed to generate code",t="";s?.status===402||s?.response?.status===402?(e="Insufficient API Balance",t="Your API account has insufficient balance. Please top up your account to continue using the service."):s?.status===401||s?.response?.status===401?(e="Invalid API Key",t="The API key is invalid or expired. Please check your API configuration."):s?.status===429||s?.response?.status===429?(e="Rate Limit Exceeded",t="Too many requests. Please wait a moment and try again."):s?.message&&(e=s.message,t=s.message);let r={type:"error",error:e,details:t,statusCode:s?.status||s?.response?.status||500};a(`data: ${JSON.stringify(r)}

`),a(`data: [DONE]

`),i()}}});return new i.NextResponse(k,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"}})}catch(e){return console.error("Error starting streaming generation:",e),i.NextResponse.json({error:"Failed to start streaming generation"},{status:500})}}let x=new o.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/generate-stream/route",pathname:"/api/generate-stream",filename:"route",bundlePath:"app/api/generate-stream/route"},resolvedPagePath:"F:\\project1\\APP\\11\\app\\api\\generate-stream\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:A,workUnitAsyncStorage:E,serverHooks:w}=x;function _(){return(0,a.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:E})}},37914:(e,t,r)=>{let s;r.d(t,{C3:()=>a,TF:()=>p,Ul:()=>n,add:()=>l,query:()=>i,tA:()=>u,testConnection:()=>d,yo:()=>c}),s=r(3097);let o=null;function n(){if(!o){let e=function(){let e=process.env.TENCENT_CLOUD_SECRET_ID,t=process.env.TENCENT_CLOUD_SECRET_KEY,r=process.env.TENCENT_CLOUD_ENV_ID;return e&&t&&r?{secretId:e,secretKey:t,envId:r}:(console.warn("腾讯云CloudBase配置不完整"),null)}();if(!e)return console.error("无法获取腾讯云CloudBase配置"),null;if(!s)return console.error("CloudBase SDK未加载"),null;try{o=s.init({secretId:e.secretId,secretKey:e.secretKey,env:e.envId}),console.log("\uD83D\uDCCA 腾讯云CloudBase连接已建立")}catch(e){return console.error("❌ 创建CloudBase应用实例失败:",e),null}}return o}function a(){let e=n();if(!e)return null;try{return e.database()}catch(e){return console.error("❌ 获取CloudBase数据库实例失败:",e),null}}async function i(e,t={}){let r=a();if(!r)throw Error("数据库连接不可用");try{let s=r.collection(e);t.where&&(s=s.where(t.where)),t.orderBy&&t.orderDirection&&(s=s.orderBy(t.orderBy,t.orderDirection)),t.limit&&(s=s.limit(t.limit)),t.offset&&(s=s.skip(t.offset));let o=await s.get();return{data:o.data||[],requestId:o.requestId}}catch(t){if(console.error("CloudBase数据库查询错误:",t),t.message&&(t.message.includes("DATABASE_COLLECTION_NOT_EXIST")||t.message.includes("Db or Table not exist")))return console.warn(`集合 ${e} 不存在，返回空结果`),{data:[],requestId:"collection-not-found"};throw t}}async function l(e,t){let r=a();if(!r)throw Error("数据库连接不可用");try{let s=r.collection(e),o=await s.add(t);return{id:o.id,requestId:o.requestId}}catch(s){if(console.error("CloudBase数据库添加错误:",s),s.message&&(s.message.includes("DATABASE_COLLECTION_NOT_EXIST")||s.message.includes("Db or Table not exist"))){console.log(`集合 ${e} 不存在，尝试创建...`);try{let s=r.collection(e),o=await s.add(t);return console.log(`集合 ${e} 创建成功并插入数据，文档ID: ${o.id}`),{id:o.id,requestId:o.requestId}}catch(t){if(console.error(`重试创建集合 ${e} 失败:`,t.message),console.error("错误详情:",t),t.message&&(t.message.includes("DATABASE_COLLECTION_NOT_EXIST")||t.message.includes("Db or Table not exist")))throw Error(`数据库集合 ${e} 无法访问。请在CloudBase控制台创建该集合并设置适当的权限。`);throw t}}throw s}}async function c(e,t,r){let s=a();if(!s)throw Error("数据库连接不可用");try{let o=s.collection(e),n=await o.doc(t).update(r);return{updated:n.updated,requestId:n.requestId}}catch(t){if(console.error("CloudBase数据库更新错误:",t),t.message&&t.message.includes("DATABASE_COLLECTION_NOT_EXIST"))throw console.warn(`集合 ${e} 不存在，无法更新文档`),Error(`集合 ${e} 不存在`);throw t}}async function p(e,t){let r=a();if(!r)throw Error("数据库连接不可用");try{let s=r.collection(e),o=await s.doc(t).remove();return{deleted:o.deleted,requestId:o.requestId}}catch(e){throw console.error("CloudBase数据库删除错误:",e),e}}async function d(){try{return await i("payments",{limit:1}),console.log("✅ 腾讯云CloudBase数据库连接测试成功"),console.log(`   数据库环境: ${process.env.TENCENT_CLOUD_ENV_ID}`),!0}catch(e){return console.error("❌ 腾讯云CloudBase数据库连接测试失败:",e),!1}}let u={from:e=>({select:(t="*")=>({eq:(t,r)=>({single:async()=>{try{return{data:(await i(e,{where:{[t]:r},limit:1})).data[0]||null,error:null}}catch(e){return{data:null,error:e}}}}),single:async()=>{try{return{data:(await i(e,{limit:1})).data[0]||null,error:null}}catch(e){return{data:null,error:e}}}}),insert:t=>({select:()=>({single:async()=>{try{return{data:{id:(await l(e,t)).id},error:null}}catch(e){return{data:null,error:e}}}})}),update:t=>({eq:(r,s)=>({single:async()=>{try{let o=await i(e,{where:{[r]:s},limit:1});if(0===o.data.length)return{data:null,error:Error("Document not found")};let n=o.data[0]._id;return{data:{updated:(await c(e,n,t)).updated},error:null}}catch(e){return{data:null,error:e}}}})}),upsert:t=>({single:async()=>{try{return{data:{id:(await l(e,t)).id},error:null}}catch(e){return{data:null,error:e}}}})})}},38605:(e,t,r)=>{r.d(t,{Rt:()=>n,i9:()=>s,lb:()=>o,v1:()=>a});let s={free:{name:"Free",nameZh:"免费版",limits:{},maxRequests:30,models:["deepseek-chat"]},pro:{name:"Pro",nameZh:"专业版",limits:{},maxRequests:500,models:["deepseek-chat","deepseek-coder","glm-4.6"]},enterprise:{name:"Enterprise",nameZh:"企业版",limits:{},maxRequests:-1,models:["deepseek-chat","deepseek-coder","glm-4.6"]}},o={"deepseek-chat":{id:"deepseek-chat",name:"DeepSeek Chat",nameZh:"DeepSeek 对话",description:"General purpose AI assistant",descriptionZh:"通用AI助手",provider:"deepseek",contextWindow:32768,maxTokens:4096,pricing:{input:.001,output:.002}},"deepseek-coder":{id:"deepseek-coder",name:"DeepSeek Coder",nameZh:"DeepSeek 编程",description:"Specialized for coding tasks",descriptionZh:"专为编程任务优化",provider:"deepseek",contextWindow:16384,maxTokens:4096,pricing:{input:.001,output:.002}},"glm-4.6":{id:"glm-4.6",name:"GLM-4.6",nameZh:"智谱清言4.6",description:"Advanced multimodal AI model by Zhipu AI",descriptionZh:"智谱AI多模态高级AI模型",provider:"zhipu",contextWindow:32768,maxTokens:4096,pricing:{input:.001,output:.002}}};function n(e){return s[e].models.map(e=>o[e]).filter(Boolean)}function a(e,t){return s[e].models.includes(t)}},41204:e=>{e.exports=require("string_decoder")},44870:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:e=>{e.exports=require("crypto")},55591:e=>{e.exports=require("https")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:e=>{e.exports=require("timers")},74075:e=>{e.exports=require("zlib")},79428:e=>{e.exports=require("buffer")},79551:e=>{e.exports=require("url")},81630:e=>{e.exports=require("http")},83997:e=>{e.exports=require("tty")},91645:e=>{e.exports=require("net")},94735:e=>{e.exports=require("events")}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[1202,8700,2806,3097,8431,1381,3880,6703],()=>r(37351));module.exports=s})();