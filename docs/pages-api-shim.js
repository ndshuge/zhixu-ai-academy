/* Zhixu Pages local compatibility adapter.
   Honest boundaries: browser-local scientific calculations and approval state,
   not a Node server, not an authoritative remote experiment ledger.
   Real DeepSeek answers only if the user verifies BYOK and authorizes each call.
*/
(()=>{'use strict';
const nativeFetch=window.fetch.bind(window),runs=new Map(),plans=new Map(),attempts=new Map();
const pfx='/api/',VERSION='pages-logistic-float64-v1';
const SNAPSHOT_KEY='zhixu-pages-science-session-v1';
let evidenceTrace=[];
function safeReadSnapshot(){
 try{
  const v=JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY)||'null');
  if(!v||v.version!==1||!Array.isArray(v.runs)||!Array.isArray(v.plans))return;
  const now=Date.now();
  for(const [id,obj] of v.runs.slice(-12))if(typeof id==='string'&&obj&&obj.result&&typeof obj.prediction==='string')runs.set(id,obj);
  for(const [id,obj] of v.plans.slice(-15))if(typeof id==='string'&&obj&&now-obj.created<15*60e3)plans.set(id,obj);
  for(const [id,obj] of (v.attempts||[]).slice(-20))if(typeof id==='string'&&obj&&now-obj.created<30*60e3)attempts.set(id,obj);
  evidenceTrace=Array.isArray(v.trace)?v.trace.slice(-200):[];
 }catch{}
}
function saveSnapshot(kind,fields={}){
 const trace={kind,at:new Date().toISOString(),...fields};
 evidenceTrace.push(trace);evidenceTrace=evidenceTrace.slice(-200);
 try{
  sessionStorage.setItem(SNAPSHOT_KEY,JSON.stringify({version:1,savedAt:Date.now(),
   runs:[...runs.entries()].slice(-12),plans:[...plans.entries()].slice(-15),
   attempts:[...attempts.entries()].slice(-20),trace:evidenceTrace}));
 }catch{/* storage may be unavailable; calculations must still work */}
}
safeReadSnapshot();

let questionsCache=null;
const rnd=()=>crypto.randomUUID();
const result=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store','X-Zhixu-Engine':'browser-local'}});
const error=(status,message)=>result({error:message},status);
const clip=(x,n=500)=>String(x??'').trim().slice(0,n);
const model=()=>window.ZHIXU_PAGES_AI;
const getRun=id=>runs.get(id);
const logistic=(r,x,n,float32=false)=>{
 const v=[x];for(let i=0;i<n;i++){let next=r*v[i]*(1-v[i]);v.push(float32?Math.fround(next):next)}return v;
};
function experiment(experiment,params){
 if(!['sensitivity','logistic'].includes(experiment))throw Error('Pages 浏览器版暂未迁移 EvoWorld 服务器计算，请在完整本机版运行此实验。');
 const r=Number(params.r??3.9),x=Number(params.x0??.217),n=Number(params.steps??150);
 const logDelta=Number(params.logDelta??-10),delta=experiment==='sensitivity'?10**logDelta:0;
 if(!Number.isFinite(r)||r<3.3||r>4||x<=0||x>=1||n<20||n>300||!Number.isInteger(n))throw Error('参数超过科学实验允许范围');
 if(experiment==='sensitivity'&&(logDelta< -14||logDelta>-3))throw Error('扰动参数不合法');
 const a=logistic(r,x,n),b=logistic(r,x+delta,n);
 const fa=logistic(r,Math.fround(x),n,true),fb=logistic(r,Math.fround(x+delta),n,true);
 const d=a.map((v,i)=>Math.abs(v-b[i])),df=fa.map((v,i)=>Math.abs(v-fb[i]));
 const first=d.findIndex(z=>z>.01),lambda=Array.from({length:Math.min(n,80)},(_,i)=>Math.log(Math.abs(r*(1-2*a[i]))+1e-20)).reduce((u,v)=>u+v,0)/Math.min(n,80);
 const list=(arr)=>arr.map((v,i)=>[i,v]);
 const condition={r,x0:x,steps:n};if(experiment==='sensitivity')condition.logDelta=logDelta;
 return {experiment,engine:'浏览器真实数学计算',engineVersion:VERSION,adapterSha256:null,condition,
 metrics:[
  {label:'实际可表示 δ₀',value:b[0]-a[0],unit:''},
  {label:'首次超过0.01',value:first>=0?first:'未达到',unit:'步'},
  {label:'Lyapunov 采样均值',value:lambda,unit:''}
 ],summary:'浏览器内独立按 Logistic 方程计算两条轨迹；数学计算真实，未依赖服务器。模型分析需额外授权。',
 warnings:['此数据是浏览器浮点科学演示，不冒充 Physics Frontier Lab 服务端同版本计算。'],
 diagnostics:{modelVersion:VERSION,precision:'IEEE-754 binary64',actualDelta:b[0]-a[0],progress:n,totalSteps:n,experimentId:experiment},
 plots:[
  {title:'原始两条迭代轨迹',xLabel:'迭代 n',yLabel:'状态 x',series:[{label:'Float64 初值 x₀',points:list(a)},{label:'Float64 x₀+δ',points:list(b)}]},
  {title:'扰动大小与 Float32 精度对比',xLabel:'迭代 n',yLabel:'绝对差',series:[{label:'Float64 轨迹差',points:list(d)},{label:'Float32 轨迹差',points:list(df)}]}
 ]};
}
function baseMentor(run){
 return {mode:'rules',observed:'已根据当前浏览器实算观测曲线和指标；原始预测与反思由学生自行填写。',
 question:'怎样验证你所看到的轨迹分离来自初值差，而不是修改了公式？',
 suggestion:'保持 r 和迭代步数不变，仅更改 logDelta，再做第二轮实验。',
 rationale:'浏览器本地科学方法提示，不是 AI 模型生成。',
 availability:'当前未授权真实 DeepSeek 在线请求'};
}
const evoTransfer={prompt:'两种模拟合作策略在两个随机种子的重复实验中有差异。可以直接认为合作在所有情境都有普遍优势吗？',options:['可以，两个种子足以证明普遍结论','不能，需要更多独立重复，提前规定指标并检验条件边界','可以，因为200个tick就是200个独立实验'],answer:1,explanation:'随机种子对应模拟世界重复单位，而不是每个tick都代表一次独立实验；模型结果不能无条件外推到现实。'};
const transfer={prompt:'同样使用 Logistic 映射和同一个 r，两个接近初值在若干次迭代后分开。这意味着什么？',
 options:['相同参数必然完全重合','相同规则也可能对初值高度敏感','只要迭代规则相同，轨迹永远重合'],
 answer:1,explanation:'敏感初值依赖意味着在某些参数区域，微小初值差异会随迭代放大，不能仅根据相同公式断定轨迹一致。'};
const proposal=(run,goal)=>{
 if(run.result.experiment==='evo-pair'){
  const from=run.result.condition.baseSeed,to=(from+104729)>>>0;
  return {plannerMode:'rules',toolId:'browser-evo-world-pair',
    experiment:'evo-pair',goal,studyQuestion:'更换配对随机种子后，合作机制的相对效果是否仍然稳定？',
    why:'只更改随机种子，保持模型参数、合作开关、200步与重复次数一致。',
    limits:'两组种子只是很小的模拟样本，不能推出真实生态中的普遍结论。',
    controlPolicy:'one-variable',fixedVariables:['model','cooperation','ticks','repeats'],
    changes:[{field:'seed',from,to}],seed:to,params:null,
    budget:1,round:run.depth+2,approvalRequired:true,autoExecuted:false,
    note:'需要学生独立写出下一轮预测并明确批准。'};
 }
 const x=run.result.condition,from=x.logDelta??-10,to=Math.max(-14,Math.min(-3,from-1));
 const params={...x,logDelta:to};
 return {plannerMode:'rules',toolId:'browser-local-logistic-compare',experiment:run.result.experiment,goal,studyQuestion:'减小初值扰动后，两条轨迹在相同迭代窗口会怎样？',
 why:'一次只改变扰动指数，保留 r、初值和迭代次数作为控制变量。',
 limits:'仅适用于当前 Logistic 浏览器计算，不能推广为一切复杂系统的定律。',
 controlPolicy:'one-variable',fixedVariables:['r','x0','steps'],
 changes:[{field:'logDelta',from,to}],params,budget:1,round:run.depth+2,approvalRequired:true,autoExecuted:false,note:'须由学生输入新的独立预测并明确点击批准才能执行。',
 seed:null};
};
async function questions(){if(questionsCache)return questionsCache;const res=await nativeFetch(new URL('./pages-demo-question-data.json',location.href));questionsCache=await res.json();return questionsCache;}
async function handler(path,init={}){
 const url=new URL(path,location.href),method=(init.method||'GET').toUpperCase();
 const data=method==='POST'?JSON.parse(init.body||'{}'):{};
 if(url.pathname==='/api/status'){
  const active=model()?.status?.()===true;
  return result({ok:true,app:'知序 AI 学院 Pages',version:'0.4.2-pages-adapter',pflVersion:VERSION,evoVersion:'evoworld-0.1.1-browser',mentorMode:active?'llm-configured':'rules',provider:active?'DeepSeek':null,model:active?'deepseek-chat':null,providerVerified:active,providerSource:'browser-BYOK',usage:{today:0,limit:12,tokensToday:0},
    experiments:['sensitivity','logistic','evo-pair'],experimentPlanner:{mode:'browser-rules-and-optional-LLM',approvalRequired:true,maxRounds:3,scope:'one-variable',constrainedLLMSelectionAvailable:active}});
 }
 if(url.pathname==='/api/transfer'){
  const target=getRun(url.searchParams.get('runId'))?.result?.experiment==='evo-pair'?evoTransfer:transfer;
  return result({prompt:target.prompt,options:target.options});
 }
 if(url.pathname==='/api/run'&&method==='POST'){
  const prediction=clip(data.prediction);if(!prediction)return error(400,'必须先提交个人预测');
  const resultValue=data.experiment==='evo-pair'
   ?await (await import('./pages-evo-pair.mjs')).runEvoPair(data.seed)
   :experiment(data.experiment,data.params||data);
  const runId=rnd();runs.set(runId,{prediction,result:resultValue,mentored:false,depth:0});saveSnapshot('scientific-run',{runId,experiment:data.experiment||'sensitivity'});
  return result({runId,...resultValue});
 }
 if(url.pathname==='/api/mentor'&&method==='POST'){
  const run=getRun(data.runId);if(!run)return error(404,'找不到本次实验');
  run.mentored=true;saveSnapshot('mentor-reviewed',{runId:data.runId,authorized:data.shareApproved===true&&model()?.status?.()===true});const fallback=baseMentor(run);
  if(data.shareApproved===true&&model()?.status?.()===true){
   try{const reply=await model().ask([{role:'system',content:'你是知序 AI 学院博士。仅根据实验数值给出事实观察、一个追问和一个单变量验证建议，不虚构实验，不夸大学习效果。中文150字以内。'},{role:'user',content:JSON.stringify({prediction:run.prediction,reflection:clip(data.note),experiment:run.result.experiment,condition:run.result.condition,metrics:run.result.metrics,selectedPoint:data.selection})}],320);
    return result({...fallback,mode:'llm',reply:reply.reply,provider:'DeepSeek',model:reply.model,usage:reply.usage,availability:'本次授权后实际调用 DeepSeek 官方模型，科学结果由浏览器计算',qualityCheck:{scope:'browser-local-real-science',issues:[]}});
   }catch(e){return result({...fallback,fallbackReason:'LIVE_DEEPSEEK_FAILED',availability:'真实 DeepSeek 连接失败：'+clip(e.message,110)+'；已保留浏览器本地科学数据'})}
  }
  return result(fallback);
 }
 if(url.pathname==='/api/agent/plan'&&method==='POST'){
  const run=getRun(data.runId);if(!run)return error(404,'未找到科学实验');
  if(!run.mentored)return error(409,'请先完成当前科学实验的导师问答');
  const goal=clip(data.goal,300),pr=proposal(run,goal),id=rnd();
  if(data.mode==='llm'&&data.shareApproved!==true)return error(403,'没有本次 AI 规划授权');
  if(data.mode==='llm'&&data.shareApproved&&model()?.status?.()===true){
   try{
    const out=await model().ask([{role:'system',content:'你是科学实验规划导师。对给出的确定性单变量方案写80字以内解释，不能改动参数，不能声称已经运行。'},{role:'user',content:JSON.stringify({goal,changes:pr.changes,conditions:run.result.condition})}],180);
    pr.plannerMode='llm-constrained';pr.why=out.reply.slice(0,350);pr.note+=' 本次理由已经由 DeepSeek 模型实际生成。';
   }catch(e){pr.fallbackReason='MODEL_REQUEST_FAILED';pr.note+=' AI请求失败，已退回浏览器规则方案。'}
  }else if(data.mode==='llm'){pr.fallbackReason='MODEL_NOT_CONNECTED'}
  plans.set(id,{runId:data.runId,proposal:pr,created:Date.now(),used:false});saveSnapshot('proposed-for-approval',{planId:id,runId:data.runId,mode:pr.plannerMode});
  return result({planId:id,expiresAt:new Date(Date.now()+15*60e3).toISOString(),...pr});
 }
 if(url.pathname==='/api/agent/approve'&&method==='POST'){
  if(Object.keys(data).some(x=>!['planId','prediction'].includes(x)))return error(400,'审批仅允许计划编号与新预测');
  const p=plans.get(data.planId),newPrediction=clip(data.prediction);
  if(!p)return error(404,'方案不存在');
  if(p.used)return error(409,'本轮方案已被执行，不能重复批准');
  if(Date.now()-p.created>15*60e3)return error(410,'方案已过期');
  if(newPrediction.length<8)return error(400,'请填写至少8字的第二轮预测');
  const parent=getRun(p.runId);if(newPrediction===parent.prediction)return error(400,'请填写与第一轮不同的新预测');
  const prop=p.proposal;
  const out=prop.experiment==='evo-pair'
   ?await (await import('./pages-evo-pair.mjs')).runEvoPair(prop.seed)
   :experiment(prop.experiment,prop.params);
  const runId=rnd();
  const lineage={parentRunId:p.runId,changed:prop.changes,toolId:prop.toolId,plannerMode:prop.plannerMode,studyQuestion:prop.studyQuestion,goal:prop.goal,why:prop.why,limits:prop.limits,approvedAt:new Date().toISOString()};
  runs.set(runId,{prediction:newPrediction,result:out,depth:parent.depth+1,mentored:false});p.used=true;saveSnapshot('student-approved-execution',{runId,planId:data.planId,parentRunId:p.runId});
  return result({runId,...out,lineage,studentApproval:'explicit-browser-local',planConsumed:true});
 }
 if(url.pathname==='/api/evaluate'&&method==='POST'){
  if(!getRun(data.runId))return error(404,'科学实验记录不存在');
  const target=getRun(data.runId).result.experiment==='evo-pair'?evoTransfer:transfer;
  return result({correct:data.answer===target.answer,explanation:target.explanation});
 }
 if(url.pathname==='/api/learning/questions'){
  const q=await import('./pages-quiz-bank.mjs');
  return result({questions:q.listPublicQuestions({stage:url.searchParams.get('stage')||undefined,
   experiment:url.searchParams.get('experiment')||undefined})});
 }
 if(url.pathname==='/api/learning/item'){
  const q=await import('./pages-quiz-bank.mjs');
  const id=url.searchParams.get('itemId'),item=q.getPublicQuestion(id);
  if(!item)return error(404,'题目不存在');
  const token=rnd();attempts.set(token,{id,used:false,created:Date.now()});saveSnapshot('question-issued',{itemId:id});
  return result({...item,attemptToken:token});
 }
 if(url.pathname==='/api/learning/grade'&&method==='POST'){
  const token=attempts.get(data.attemptToken);
  if(!token||token.id!==data.itemId||token.used)return error(409,'题目凭据不存在、已使用或不匹配');
  if(Date.now()-token.created>30*60*1000)return error(410,'答题凭据已过期');
  const q=await import('./pages-quiz-bank.mjs');
  try{
   const graded=q.gradeQuestion(data.itemId,data.answer);
   token.used=true;saveSnapshot('question-graded',{itemId:data.itemId,result:graded.gradedResult});
   return result({...graded,suggestedReviewItem:q.recommendedReviewItem(graded.conceptIds[0]),
    provenance:'original-versioned-rubric-browser-local-not-server-enforced'});
  }catch(e){return error(400,e.message)}
 }
 if(url.pathname==='/api/learning/concepts'){
  const q=await import('./pages-quiz-bank.mjs');return result({concepts:q.CONCEPTS});
 }
 if(url.pathname==='/api/agent/tools')return result({plannerMode:'browser-local',approvalRequired:true,tools:[{id:'browser-local-logistic-compare',name:'浏览器 Logistic 单变量对照实验'}]});
 if(url.pathname==='/api/evidence/summary'){
  try{
   const response=await nativeFetch(new URL('./technical-evidence-summary.json',location.href),{cache:'no-store'});
   if(!response.ok)return error(503,'原版技术汇总文件未加载');
   const report=await response.json();
   if(report.scope!=='VERIFIED_SYNTHETIC_TECHNICAL_TESTS_NOT_STUDENT_LEARNING'||report.actualStudentParticipants!==0)
    return error(503,'无法确认合成技术测试类别');
   return result(report);
  }catch{return error(503,'技术汇总未就绪：请检查网络或 Pages 发布');}
 }
 if(url.pathname==='/api/browser/session'){
  return result({scope:'browser-tab-session-not-server',version:1,runCount:runs.size,planCount:plans.size,
    traces:evidenceTrace,storage:'sessionStorage',apiKeyStored:false});
 }

 if(url.pathname==='/api/safety/cases')return result({cases:[
 {id:'extra-field',name:'输出夹带指令',summary:'模型选择之外又附加了 shell 命令',protectedBy:'严格单字段 JSON 白名单'},
 {id:'tool-injection',name:'越权工具请求',summary:'模型尝试指定一个不存在的系统工具',protectedBy:'模型只能选择 A/B'},
 {id:'change-unapproved-variable',name:'擅改多个参数',summary:'提案尝试修改未经授权的科学变量',protectedBy:'浏览器版单变量科学校验'}
],scope:'FIXED_LOCAL_SIMULATION_NOT_REAL_MODEL_INCIDENT'});
 if(url.pathname==='/api/safety/check'){
  const id=url.searchParams.get('id');
  const names={'extra-field':['输出夹带指令','严格 JSON 字段校验','INVALID_MODEL_OUTPUT'],
   'tool-injection':['越权工具请求','仅允许 A/B 选择','UNKNOWN_TOOL_FORBIDDEN'],
   'change-unapproved-variable':['擅改多个参数','单变量白名单','SCIENCE_VARIABLE_DENIED']};
  if(!names[id])return error(400,'未知安全案例');
  const [name,protectedBy,reason]=names[id];
  return result({scenario:id,name,summary:'固定离线案例，不代表真实大模型攻击',protectedBy,blocked:true,decision:'REJECTED',reason,modelCalls:0,scientificExecutions:0,scope:'FIXED_LOCAL_SIMULATION_NOT_REAL_MODEL_INCIDENT',approvalRequired:true});
 }
 return error(501,'此服务端功能尚未迁移到 Pages，不能伪装已完成。');
}
const orig=window.fetch.bind(window);
window.fetch=(input,init)=>{
 const loc=typeof input==='string'?input:input instanceof URL?input.href:input?.url;
 if(typeof loc==='string'){
  const url=new URL(loc,location.href);
  if(url.origin===location.origin&&url.pathname.startsWith('/api/')){
   return Promise.resolve().then(()=>handler(loc,init)).catch(e=>error(422,e.message||String(e)));
  }
 }
 return orig(input,init);
};
window.ZHIXU_BROWSER_ADAPTER={
 kind:'client-science-not-server',engine:VERSION,
 exportSession:()=>({scope:'browser-tab-not-school-server',version:1,
   exportedAt:new Date().toISOString(),runs:[...runs.entries()],plans:[...plans.entries()],
   trace:evidenceTrace,apiKeyIncluded:false}),
 clearSession:()=>{runs.clear();plans.clear();attempts.clear();evidenceTrace=[];try{sessionStorage.removeItem(SNAPSHOT_KEY)}catch{}},
 sessionStatus:()=>({runs:runs.size,plans:plans.size,events:evidenceTrace.length})
};
})();