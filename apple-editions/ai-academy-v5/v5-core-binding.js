import {createV5InteractiveLesson} from './learning-core/v5-adapter.mjs';

/** UI shell adapter. The teaching core owns the sequence and all provenance.
 *  This file owns only explicit user actions and UI-controlled async state. */
export function makeCoreHost(bridge){
 let current=null;
 const snapshot=()=>current?.snapshot()||null;
 const ensure=()=>{if(!current)throw Error('尚未进入真实实验课程');return current};
 async function start(experiment,{restart=false}={}){
  if(!['sensitivity','evo-pair'].includes(experiment))throw Error('该功能核只支持 PFL 和 EvoWorld');
  if(!bridge.ready)throw Error('原版科学引擎尚未就绪');
  if(!restart&&current?.snapshot().experimentId===experiment)return snapshot();
  current=createV5InteractiveLesson(bridge,{experiment});
  try{await current.start()}catch(e){current=null;throw e}
  return snapshot();
 }
 async function action(button){
  const c=ensure(),a=button.dataset.coreAction;
  switch(a){
   case 'run':return await c.runExperiment();
   case 'transfer':return await c.loadTransfer();
   case 'restart':return await start(c.snapshot().experimentId,{restart:true});
   case 'point':return c.selectEvidence({plotIndex:Number(button.dataset.plot),seriesIndex:Number(button.dataset.series),pointIndex:Number(button.dataset.point)});
   case 'pair':return c.selectWorldPair(Number(button.dataset.seed));
   default:throw Error('未知的实验操作：'+String(a));
  }
 }
 async function submit(form){
  const c=ensure(),data=new FormData(form),value=String(data.get('answer')??'');
  const approved=data.get('shareApproved')==='on';
  switch(form.dataset.coreForm){
   case 'pre':
    if(!/^\d+$/.test(value))throw Error('请先独立选择一项答案');
    return await c.submitPre(Number(value));
   case 'prediction':{
    const text=String(data.get('prediction')||'').trim();
    const params=c.snapshot().experimentId==='evo-pair'
     ?{seed:Number(data.get('seed'))}
     :{r:Number(data.get('r')),x0:Number(data.get('x0')),steps:Number(data.get('steps')),logDelta:Number(data.get('logDelta'))};
    return c.setPrediction({text,params});
   }
   case 'reflection':return await c.submitReflection(String(data.get('reflection')||''));
   case 'transfer':
    if(!/^\d+$/.test(value))throw Error('请先独立选择一项答案');
    return await c.submitTransfer(Number(value));
   case 'coach':return await c.requestStageCoach({question:String(data.get('question')||''),shareApproved:approved});
   case 'mentor':return await c.requestMentor({note:String(data.get('note')||''),shareApproved:approved});
   case 'propose':return await c.proposeComparison({goal:String(data.get('goal')||'')});
   case 'approve':return await c.approveComparison({prediction:String(data.get('prediction')||'')});
   default:throw Error('未知教学表单');
  }
 }
 return {start,snapshot,action,submit,stop(){current=null}};
}
