/**
 * V5-facing composition root. It does not render UI or call a paid model.
 * ScienceBridge already writes original V2 graded attempts and PFL hypotheses.
 * Only the learner's independent post-experiment reflection is appended here.
 */
import {createInteractiveLesson} from './interactive-lesson.mjs';

export function createV5InteractiveLesson(bridge,{storage=globalThis.localStorage,experiment='sensitivity'}={}){
 if(!bridge?.lib?.appendLearningEvent||!bridge.store||!bridge.sessionId)
  throw Error('V5 原版学习证据桥尚未就绪');
 const science={};
 // Bind original methods to their owner; prototype cloning would hide summary/status updates.
 for(const method of ['questionSet','grade','run','mentor','propose','approve','modelStatus','modelAsk']){
  if(typeof bridge[method]==='function')science[method]=bridge[method].bind(bridge);
 }
 if(typeof bridge.request==='function'){
  science.mentorWithSelection=(run,note,shareApproved,selection)=>bridge.request('/api/mentor',{runId:run.runId,note,shareApproved,selection});
  science.proposeWithGoal=(run,goal)=>bridge.request('/api/agent/plan',{runId:run.runId,goal,mode:'rules'});
 }
 return createInteractiveLesson({
  science,
  experiment,
  recordReflection:async({text,lessonId,sourceRunId,experimentId})=>{
   bridge.lib.appendLearningEvent(bridge.store,'learning_reflection',
    {lessonId,experimentId,observation:text,note:'学生主动书写的反思，不代表成绩提升或已掌握'},
    {sessionId:bridge.sessionId,sourceRunId,conceptIds:[experimentId==='evo-pair'?'evolution.inference':'chaos.sensitivity']},
    storage);
   // V2 event is already committed; a secondary summary failure must not allow duplicate saves.
   try{bridge.refresh?.()}catch{bridge.notify?.('反思已保存，但学习摘要刷新失败，可稍后重新打开。')}
  }
 });
}
