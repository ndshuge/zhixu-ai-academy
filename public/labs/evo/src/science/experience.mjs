import { DEFAULTS,validateConfig } from '../core/config.mjs';
import { KNOWLEDGE } from './parameters.mjs';
import { genomeDifference } from './observer.mjs';

// Presentation contracts; neither these helpers nor the guide call a simulation RNG.
export const RECOMMENDATIONS=Object.freeze([
 {id:'food',question:'如果食物变少，生命会怎样？',intuition:'让植物补充得慢一点，观察生命能否跟上消耗。',key:'regeneration',value:.006,observe:'比较开始与结束的种群、植物存量和死亡次数。',predictions:['种群会下降','种群会增加','变化不明显 / 暂不确定'],next:'保持其他条件，换12个配对种子，结果是否还相似？'},
 {id:'longevity',question:'为什么一些生命能够活得更久？',intuition:'缩短年龄阈值，看看年龄与能量两种死亡条件。',key:'lifespanScale',value:.35,observe:'查看真实死亡事件的原因；年龄不是唯一限制。',predictions:['年龄阈值会更常出现','能量耗尽会更常出现','暂不确定'],next:'把寿命倍率恢复为1，配对比较存活和死亡原因。'},
 {id:'family',question:'后代和父母究竟有什么不同？',intuition:'查看一次真实出生，逐项比较继承的性状和权重。',key:'mutationRate',value:.12,observe:'寻找有亲子档案的出生；没有出生也会按时结束。',predictions:['基因可能不同','只有能量和年龄不同','暂不确定'],next:'把突变率设为0，亲子基因还有差异吗？'},
 {id:'communication',question:'关闭通信会影响什么？',intuition:'关闭资源坐标的发布与接收，合作规则仍然保留。',key:'communication',value:'none',observe:'查看实际消息计数、协作采集和存活数量。',predictions:['存活数量可能减少','存活数量可能增加','可能没有明显变化'],next:'只恢复局部通信，用配对种子检验全程平均种群。'},
 {id:'mutation',question:'突变越多，进化就越好吗？',intuition:'提高出生时的突变概率，观察亲子差异与种群。',key:'mutationRate',value:.3,observe:'记录基因差异、代数和种群；“不同”不等于“更好”。',predictions:['差异与存活都可能增加','差异增加但存活未必增加','暂不确定'],next:'预先选定适应度指标，再比较多个突变率和独立种子。'}
]);
export function recommendation(id){const p=RECOMMENDATIONS.find(p=>p.id===id);if(!p)throw new Error('未知推荐探索');return p;}
export function explorationConditions(id){const p=recommendation(id),baseline=validateConfig({...DEFAULTS,width:32,height:24,initialPopulation:48,maxPopulation:180,environment:'stable'});return {baseline,configuration:validateConfig({...baseline,[p.key]:p.value}),ticks:240};}
export function makeExploration(id,prediction){const p=recommendation(id);if(!p.predictions.includes(prediction))throw new Error('请主动选择一个预测');const conditions=explorationConditions(id);return {schema:'evoworld-exploration-0.3.0',id,question:p.question,prediction,...conditions,status:'predicted',conclusion:'',nextQuestion:''};}
export function completeExploration(record,report,{partial=false}={}){
 if(!record||report.window.start!==0||report.configuration.seed!==record.configuration.seed||JSON.stringify(report.configuration)!==JSON.stringify(record.configuration))throw new Error('报告条件与本次探索不匹配');
 if(!partial&&report.window.ticks!==record.ticks)throw new Error('探索没有到达预定终点');
 return {...structuredClone(record),status:partial?'partial':'completed',report:structuredClone(report),summary:briefReport(report),questionEvidence:questionEvidence(record.id,report),boundary:'单世界描述；参照条件未运行。不能据此断言改变参数造成了结果。'};
}
export function questionEvidence(id,r){
 const initial=r.initialConditions,final=r.finalConditions,events=r.raw.events,limits='以下来自实际保留记录；截断或缺失不代表事件没有发生。参照世界未运行，不能判断参数效应。';
 if(id==='family'||id==='mutation'){
  const archives=r.raw.archives,map=new Map(archives.map(a=>[a.id,a]));
  const pairs=archives.filter(a=>a.birthTick>r.window.start&&a.parentId).map(child=>({child,parent:map.get(child.parentId)})).filter(p=>p.parent).map(p=>({parentId:p.parent.id,childId:p.child.id,tick:p.child.birthTick,difference:genomeDifference(p.parent.genome,p.child.genome)}));
  const sample=pairs[0],changed=pairs.filter(p=>p.difference.changedTraits+p.difference.changedWeights>0).length;
  return {facts:['区间实际出生 '+(final.births-initial.births)+' 次；保留可比较亲子档案 '+pairs.length+' 对，其中 '+changed+' 对有基因差异。',sample?'实例：#'+sample.parentId+' → #'+sample.childId+'（出生tick '+sample.tick+'）；'+sample.difference.changedTraits+' 项性状、'+sample.difference.changedWeights+' 项权重不同。':'没有保留可比较的亲子档案：可能没有出生或记录不足，不生成故事。','终点存活个体最长代数 G'+final.generation+'；差异或代数增加不等于智能或适应度提高。'],records:pairs.slice(0,3),limits};
 }
 if(id==='longevity'){const deaths=events.filter(e=>e.type==='death');return {facts:['区间实际死亡 '+(final.deaths-initial.deaths)+' 次。保留死亡日志：年龄阈值 '+deaths.filter(e=>e.detail==='达到年龄阈值').length+' 次，能量耗尽 '+deaths.filter(e=>e.detail==='能量耗尽').length+' 次。',deaths.length?'可以展开日志检查每个原因；上一帧能量不等于死亡瞬间能量。':'此窗口没有保留死亡事件；不能强迫生命死亡来验证预测。'],records:deaths.slice(0,3),limits};}
 if(id==='communication')return {facts:['真实发布 '+(final.messagesSent-initial.messagesSent)+' 条、真实接收 '+(final.messagesDelivered-initial.messagesDelivered)+' 条；通信模式 '+r.configuration.communication+'。','累计协作采集增量 '+(final.cooperativeHarvest-initial.cooperativeHarvest).toFixed(2)+'；关闭通信没有关闭合作规则。消息计数不能替代存活效率对照。'],records:[],limits};
 return {facts:['植物存量 '+initial.food.toFixed(2)+' → '+final.food.toFixed(2)+'；实际再生率 '+r.configuration.regeneration+' / tick。','全程平均种群 '+r.raw.meanPopulation.toFixed(2)+'；起终点的时间变化不是与参照条件的差值。'],records:[],limits};
}
const metricLabels={population:'存活数量',food:'植物存量',agentEnergy:'个体总储能',traitDiversity:'感知性状方差'};
export function briefReport(r){
 const comparisons=r.measurements.filter(m=>m.key in metricLabels&&Number.isFinite(m.before)&&m.before>1e-8&&Number.isFinite(m.after)).map(m=>({...m,relative:m.delta/m.before})).sort((a,b)=>Math.abs(b.relative)-Math.abs(a.relative));
 const largest=comparisons[0],pop=r.measurements.find(m=>m.key==='population');
 return {changes:r.changes.map(c=>KNOWLEDGE[c.key].name+'：'+String(c.before)+' → '+String(c.after)),
 observed:'tick '+r.window.start+'–'+r.window.end+'，存活数量 '+pop.before+' → '+pop.after+'；新增出生 '+(r.finalConditions.births-r.initialConditions.births)+' 次，死亡 '+(r.finalConditions.deaths-r.initialConditions.deaths)+' 次。',
 largest:largest?{key:largest.key,before:largest.before,after:largest.after,relative:largest.relative,text:'最大相对变化：'+metricLabels[largest.key]+' '+(largest.relative*100).toFixed(1)+'%（仅比较初值非零的种群、植物、储能、感知方差；不跨单位比较绝对差）。'}:null,
 mechanisms:r.sections.definitions.slice(0,3).map(d=>({key:d.key,text:d.direct,source:d.source})),
 supported:'可以描述这个种子、这些条件和这个时间窗口中实际发生的变化。',
 uncertain:(r.changes.length>1?'同时改变多个参数，不能归因于某一个参数。':'尚未运行参照世界，不能把时间上的变化当作参数效应。')+' 本次n=1，没有独立重复的置信区间或因果检验。',
 next:r.nextQuestions[0]||'选择一个变量，预先固定终点和指标，做独立种子的配对对照。'};
}
export function eventMeaning(e){
 if(!e||!Number.isInteger(e.tick)||e.tick<1)return null;
 const base={key:e.type+':'+e.tick+':'+e.id,tick:e.tick,id:e.id,related:e.related,event:structuredClone(e),source:{file:'src/core/world.mjs',anchor:'stepOnce'},score:20};
 if(e.type==='death')return {...base,score:e.detail==='能量耗尽'?95:75,title:'#'+e.id+' '+e.detail+'后死亡',meaning:'能量与年龄是不同的生存约束；这是日志记录的死亡条件，不是个体意图。',rule:'死亡判定：energy ≤ 0 或 age ≥ lifespan × lifespanScale。上一帧能量不能当成死亡瞬间能量。'};
 if(e.type==='birth'&&e.related)return {...base,score:85,title:'#'+e.related+' 繁殖出 #'+e.id,meaning:e.mutation?'实际亲子比较：'+e.mutation.changedTraits+' 项性状、'+e.mutation.changedWeights+' 项权重不同；差异不代表更优。':'出生已记录；父代基因档案缺失，不能补写遗传差异。',rule:'繁殖转移父代能量；出生时各基因独立按μ突变。父代不会因子代突变被改写。',source:{file:'src/core/controllers.mjs',anchor:'mutateGenome'}};
 if(e.type==='cooperation')return {...base,score:80,title:'#'+e.id+' 完成协作动作并实际采集',meaning:'协作资源采集要求同格存在至少两名符合条件的合作个体。这次记录的采集增量可能还含其他资源。',rule:'本tick action=协作采集 且 harvested真实增加；不把总增量冒称纯协作收益。'};
 if(e.type==='share')return {...base,score:70,title:'#'+e.id+' 向 #'+e.related+' 分享 '+e.amount+' 能量',meaning:'这是模型中真实的能量转移；暂不能推断它改善了群体存活。',rule:'分享在资源结算后执行，有成本和接收条件。'};
 if(e.type==='extinction')return {...base,score:100,title:'当前种群已经灭绝',meaning:'这个条件下世界走到了零存活；实验仍可按固定终点完成，不能泛化到所有种子。',rule:'观察器记录存活数量从非零到零；不自动重新补入生命。'};
 if(e.type==='signal')return {...base,score:35,title:'#'+e.id+' 发布一个资源坐标',meaning:'消息来自实际感知。发布不等于送达，也不意味着存在全知。',rule:'记录发布者与资源坐标；接收取决于通信模式、半径和掉线。'};
 if(e.type==='harvest')return {...base,score:45,title:'#'+e.id+' 获得 '+e.amount.toFixed(2)+' 采集能量',meaning:'采集累计值真实增加；同时的代谢使净能量变化可能不同。',rule:'harvested(t) − harvested(t−1) > 0；资源请求按比例结算。'};
 if(e.type==='action')return {...base,title:'#'+e.id+' 切换为'+e.detail,meaning:'你看到的是控制器与结算产生的动作标签，不是心理活动。',rule:'选中个体 action 与上一tick不同。'};
 return null;
}
export class ImportantFeed{
 constructor(){this.seen=new Set();this.cooldowns=new Map();this.items=[];}
 update(events){const candidates=events.map(eventMeaning).filter(Boolean).filter(e=>!this.seen.has(e.key)).sort((a,b)=>b.score-a.score||b.tick-a.tick);
  for(const e of candidates){this.seen.add(e.key);if(this.seen.size>2048)this.seen.delete(this.seen.values().next().value);const category=e.event.type,previous=this.cooldowns.get(category);if(previous!==undefined&&e.tick-previous<50)continue;this.cooldowns.set(category,e.tick);this.items.push(e);}
  this.items.sort((a,b)=>b.score-a.score||b.tick-a.tick);this.items=this.items.slice(0,3);return this.items;
 }
}
