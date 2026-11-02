/* V4 ONLY: business adapter to immutable Original Pages scientific engine.
   Never implement scoring/scientific experiments or leak BYOK credentials here. */
const ORIGINAL='/zhixu-ai-academy/';
export const newLesson=(experiment='sensitivity')=>({experiment,step:0,highest:0,preIds:[],preIndex:0,preResults:[],question:null,grade:null,prediction:'',run:null,mentor:null,transferIds:[],transferIndex:0,transferResults:[],transfer:null,transferGrade:null,plan:null,approvedRun:null});
export const conceptNames={'chaos.same-rule':'相同规则下的变化','chaos.sensitivity':'初值敏感性','inquiry.control-variable':'控制变量与科学验证','evolution.independence':'独立重复','evolution.inference':'演化模拟与推断边界'};
export class ScienceBridge{
 constructor(frame,notify=()=>{}){this.frame=frame;this.notify=notify;this.win=null;this.lib=null;this.store=null;this.summary=null;this.ready=false;this.modelLoaded=false;this.status=null;this.sessionId=sessionStorage.getItem('zx-v4-session')||crypto.randomUUID();sessionStorage.setItem('zx-v4-session',this.sessionId);}
 async connect(){
   try{this.lib=await import(ORIGINAL+'learning-store.js');this.store=this.lib.loadLearning(localStorage);this.refresh();}catch(e){this.notify('学习记录读取失败：'+e.message);}
   for(let n=0;n<45;n++){
    try{
     const w=this.frame.contentWindow;
     if(w?.ZHIXU_BROWSER_ADAPTER&&typeof w.fetch==='function'){
      this.win=w;this.modelLoaded=await this.loadAI();
      this.status=await this.request('/api/status');this.ready=true;return true;
     }
    }catch{}
    await new Promise(r=>setTimeout(r,300));
   }
   this.notify('科学引擎暂未连接；可以浏览课程，稍后重试。');return false;
 }
 async loadAI(){
  const w=this.win;if(w.ZHIXU_PAGES_AI)return true;
  return await new Promise(resolve=>{const s=w.document.createElement('script');s.src=ORIGINAL+'original-pages-byok.js';s.onload=()=>resolve(!!w.ZHIXU_PAGES_AI);s.onerror=()=>resolve(false);w.document.body.append(s);});
 }
 async request(path,body){
  if(!this.win)throw Error('科学引擎尚未连接。');
  const options=body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
  const r=await this.win.fetch(path,options),value=await r.json().catch(()=>({error:'原版科学接口没有返回可解析的内容'}));
  if(!r.ok)throw Error(value.error||'原版科学接口错误 '+r.status);
  return value;
 }
 refresh(){if(this.lib&&this.store)this.summary=this.lib.summarizeLearning(this.store);return this.summary;}
 async questionSet(stage,experiment){
  const data=await this.request('/api/learning/questions?stage='+stage+'&experiment='+encodeURIComponent(experiment));
  const ids=(data.questions||[]).slice(0,2).map(q=>q.itemId||q.id).filter(Boolean);
  if(!ids.length)throw Error('这门课程暂时没有对应的原版题目。');
  const question=await this.getQuestion(ids[0]);return {ids,question};
 }
 async getQuestion(id){return await this.request('/api/learning/item?itemId='+encodeURIComponent(id));}
 async grade(q,answer){
  const result=await this.request('/api/learning/grade',{attemptToken:q.attemptToken,itemId:q.itemId||q.id,answer});
  if(this.lib){this.lib.recordQuestionAttempt(this.store,result,{sessionId:this.sessionId});this.refresh();}
  return result;
 }
 async run(experiment,prediction,form){
  const payload=experiment==='evo-pair'?{experiment,prediction,seed:Number(form.seed)}:{experiment,prediction,params:{r:Number(form.r),x0:Number(form.x0),steps:Number(form.steps),logDelta:Number(form.logDelta)}};
  const result=await this.request('/api/run',payload);this.recordHypothesis(result,experiment,prediction);return result;
 }
 recordHypothesis(run,experiment,prediction){
  if(!this.lib)return;this.lib.recordHypothesis(this.store,run.runId,{experiment,prediction,engineVersion:run.engineVersion,condition:run.condition,metrics:run.metrics,results:run.results,lineage:run.lineage},{sessionId:this.sessionId});this.refresh();
 }
 async mentor(run,note,approved=false){return this.request('/api/mentor',{runId:run.runId,note,shareApproved:approved});}
 async propose(run){return this.request('/api/agent/plan',{runId:run.runId,goal:'仅改变一个可控变量，检验原有观察是否稳定。',mode:'rules'});}
 async approve(plan,prediction,experiment){const r=await this.request('/api/agent/approve',{planId:plan.planId,prediction});this.recordHypothesis(r,experiment,prediction);return r;}
 tasks(){return this.lib?.getReviewTasks(this.store)?.filter(t=>t.status!=='dismissed')||[];}
 decide(id,yes){this.lib?.decideMisconception(this.store,id,yes?'confirmed':'rejected');this.refresh();}
 export(){if(!this.lib)throw Error('学习记录尚未连接');return this.lib.exportLearning(this.store);}
 clear(){if(!this.lib)throw Error('学习记录尚未连接');this.lib.clearLearning(localStorage);this.store=this.lib.loadLearning(localStorage);this.refresh();}
 async modelStatus(){if(!this.win)return false;return this.win.ZHIXU_PAGES_AI?.status?.()===true;}
 async modelAsk(messages){const model=this.win?.ZHIXU_PAGES_AI;if(!model?.status?.())throw Error('请先在设置里验证 DeepSeek 连接');return model.ask(messages,430);}
}