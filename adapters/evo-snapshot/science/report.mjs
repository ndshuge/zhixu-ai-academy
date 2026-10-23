import { DEFAULTS,ENGINE_VERSION,validateConfig } from '../core/config.mjs';
import { World } from '../core/world.mjs';
import { pairedInference } from '../core/statistics.mjs';
import { changedParameters,KNOWLEDGE } from './parameters.mjs';
export const EVENT_NAMES={birth:'出生',death:'死亡',share:'能量分享',harvest:'觅食采集',cooperation:'协作采集',competition:'同格资源结算',signal:'资源信息发布',action:'行为切换',climate:'环境阶段变化',extinction:'种群灭绝'};
export function explainRun(observation,baseline=DEFAULTS,expectation=null){
 const {initial,final}=observation,changes=changedParameters(observation.config,baseline);
 const metrics=['population','births','deaths','food','hard','detritus','agentEnergy','sunlight','heat','traitDiversity','meanSpeed','meanCooperation','cooperativeHarvest','shared','messagesSent','messagesDelivered','cappedBirths'];
 const measurements=metrics.map(key=>({key,before:initial[key],after:final[key],delta:final[key]-initial[key]}));
 const facts=[
  '在tick '+observation.startTick+'至 '+observation.endTick+' 的观察区间内，种群从 '+initial.population+' 变为 '+final.population+'。',
  '这段区间真实新增 '+(final.births-initial.births)+' 次出生与 '+(final.deaths-initial.deaths)+' 次死亡；平均种群 '+observation.meanPopulation.toFixed(2)+'。',
  '光能输入增加 '+(final.sunlight-initial.sunlight).toFixed(2)+'，耗散增加 '+(final.heat-initial.heat).toFixed(2)+'；终点能量残差 '+final.balanceError.toExponential(2)+'。',
  '感知性状方差从 '+initial.traitDiversity.toFixed(4)+' 变为 '+final.traitDiversity.toFixed(4)+'；这是一个性状代理，不代表总体智能。'
 ];
 const uncertainties=['本次只有1个世界，不能估计独立世界间的不确定性，也没有因果显著性检验。'];
 if(changes.length>1)uncertainties.push('相对默认配置同时改变 '+changes.length+' 项参数；不能把结果全部归因于其中某一项。');
 if(final.cappedBirths>initial.cappedBirths)uncertainties.push('种群上限阻止过部分出生，可能截断策略的繁殖优势。');
 if(observation.startTick>0)uncertainties.push('观察从导入或重新连接的tick开始，早期事件没有被还原。');
 if(observation.origin==='snapshot')uncertainties.push('本次初态来自导入存档；默认配置不等于默认播种状态。JSON保留观察开始时的完整快照，配对对照会重新播种新世界。');
 if(Object.values(observation.dropped).some(n=>n>0))uncertainties.push('事件、关键帧或个体档案存在截断；不能把缺失记录当作没有发生。');
 const mechanisms=changes.map(c=>({key:c.key,name:c.knowledge.name,before:c.before,after:c.after,formula:c.knowledge.formula,source:c.knowledge.source,direct:c.knowledge.intuition,interaction:c.knowledge.interactions}));
 const hypothesis=changes.length?changes.filter(c=>!['seed','unitsPerCell','secondsPerTick','historyLimit','lineageLimit','sampleEvery','padControllerBudget'].includes(c.key)).map(c=>({key:c.key,text:c.knowledge.indirect,status:'可能机制；需要对照，尚未由本条轨迹证明'})):[{text:'默认条件下资源供给、代谢和繁殖反馈都可能解释变化；不能从趋势确定唯一原因。',status:'可能机制'}];
 const observedDirection=final.population>initial.population?'up':final.population<initial.population?'down':'same';
 const validExpectation=expectation&&['up','down','same'].includes(expectation.direction)&&expectation.reference===initial.population&&observation.startTick===0;
 const expectationRecord={...expectation,observedDirection,statement:validExpectation?'你事先预测：'+expectation.prediction+'。终点种群相对创始数的方向与所登记预测'+(expectation.direction===observedDirection?'一致':'不一致')+'；仅比较本条轨迹的方向，不证明原因。':expectation?.prediction?'你事先预测：'+expectation.prediction+'。未登记适用于本观察区间的定量方向，请自行对照实测事实；软件不补写预测。':'本次没有事先登记预测。现在可以描述结果，但不能把事后解释当作事前预测。'};
 return {schema:'evoworld-scientific-explanation-0.2.0',engine:ENGINE_VERSION,configuration:observation.config,baseline:{...baseline},changes,window:{start:observation.startTick,end:observation.endTick,ticks:observation.ticksObserved},
  initialConditions:initial,finalConditions:final,sections:{definitions:mechanisms,observations:facts,expectation:expectationRecord,statistics:{independentWorlds:1,confidenceInterval:null,pValue:null,statement:'单世界描述；曲线点与个体并非独立重复样本。'},hypotheses:hypothesis,limitations:uncertainties},
  measurements,events:observation.events.slice(-80),nextQuestions:changes.length?changes.map(c=>c.knowledge.experiment):['仅改变植物再生率，用相同种子和固定终点做配对比较。'],
  control:{instructions:'选定一个参数，保持所有其他科学配置不变；预先指定主指标为全程平均种群。使用至少2个新种子，推荐12个；固定步数和样本数，不看结果后延长。',eligibleKeys:Object.keys(DEFAULTS).filter(k=>!['seed','historyLimit','lineageLimit','sampleEvery','unitsPerCell','secondsPerTick'].includes(k))},
  evidence:{digest:observation.digest,recordingLimits:observation.limits,dropped:observation.dropped,boundary:observation.boundary},raw:observation};
}
export function reportMarkdown(r){
 const s=r.sections;
 return '# 本次世界的科学记录\n\n引擎 '+r.engine+'；tick '+r.window.start+'–'+r.window.end+'。\n\n## 模型定义\n\n'+s.definitions.map(m=>'- '+m.name+'：'+JSON.stringify(m.before)+' → '+JSON.stringify(m.after)+'。'+m.direct+'；'+m.formula+'。源码 '+m.source.file+' / '+m.source.anchor).join('\n')+'\n\n## 实际观测\n\n'+s.observations.map(x=>'- '+x).join('\n')+'\n\n## 与事前预测的关系\n\n'+s.expectation.statement+'\n\n## 统计证据\n\n'+s.statistics.statement+' n=1，无CI或p值。\n\n## 可能解释与限制\n\n'+s.hypotheses.map(h=>'- '+h.text+'（'+h.status+'）').join('\n')+'\n'+s.limitations.map(x=>'- '+x).join('\n')+'\n\n## 下轮对照\n\n'+r.control.instructions+'\n\n'+r.nextQuestions.join('\n\n')+'\n\n## 完整条件\n\n~~~json\n'+JSON.stringify(r.configuration,null,2)+'\n~~~\n\n状态摘要 '+r.evidence.digest+'。完整事件和原始数据随JSON导出。\n';
}
export function planPair(config,key,reference,{repeats=6,ticks=1200,baseSeed=73129}={}){
 if(!KNOWLEDGE[key]||!(key in DEFAULTS)||key==='seed')throw new Error('请选择一个科学参数，seed由配对计划统一指定');
 if(!Number.isInteger(repeats)||repeats<2||repeats>40||!Number.isInteger(ticks)||ticks<200||ticks>10000||repeats*ticks*2>600000||!Number.isInteger(baseSeed)||baseSeed<0||baseSeed>4294967295)throw new Error('对照需2–40次重复、200–10000步、有效种子且总预算≤600000世界步');
 const a=validateConfig(config),b=validateConfig({...config,[key]:reference});
 if(a[key]===b[key])throw new Error('两条件参数值相同，请选择不同的参照值');
 return {schema:'evoworld-single-factor-pair-0.2.0',engine:ENGINE_VERSION,key,parameter:KNOWLEDGE[key].name,repeats,ticks,seeds:Array.from({length:repeats},(_,i)=>(baseSeed+i*104729)>>>0),conditions:[{label:'当前值',config:a},{label:'参照值',config:b}],primaryMetric:'meanPopulation',stoppingRule:'固定种子数和tick；无可选停止；一次计划一个主对比'};
}
export async function runPair(plan,{progress=()=>{},cancelled=()=>false,yieldWork=()=>Promise.resolve()}={}){
 const runs=[];
 for(let i=0;i<plan.seeds.length;i++)for(const arm of i%2?[1,0]:[0,1]){
  const seed=plan.seeds[i],w=new World({...plan.conditions[arm].config,seed});let integral=0;
  for(let t=0;t<plan.ticks;t++){
   if(cancelled())return null;w.step();integral+=w.agents.length;
   if(t%40===39){progress({done:runs.length,total:plan.seeds.length*2,within:(t+1)/plan.ticks});await yieldWork();}
  }
  runs.push({arm,seed,meanPopulation:integral/plan.ticks,final:w.metrics(),digest:w.digest(),config:w.config});
 }
 const a=plan.seeds.map(seed=>runs.find(r=>r.seed===seed&&r.arm===0).meanPopulation),b=plan.seeds.map(seed=>runs.find(r=>r.seed===seed&&r.arm===1).meanPopulation);
 const statistics=pairedInference(a,b,plan.seeds[0]);
 return {plan,runs,statistics,interpretation:'仅对本计划单参数干预的模型内平均种群比较。一个预定对比无需Holm；连续探索多次后应另外定义并校正比较家族。小样本bootstrap区间和符号交换检验均有假设；不证明现实普遍规律。'};
}
