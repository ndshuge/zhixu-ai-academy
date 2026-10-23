import { World } from './world.mjs';
import { ENGINE_VERSION, validateConfig } from './config.mjs';
import { summary, pairedInference, holm } from './statistics.mjs';
export const PROTOCOLS = [
 { id:'controllers', title:'规则与神经网络', hypothesis:'在相同感知、动作和前向计算额度下，神经控制器能否提高固定队列的存活积分？',
   independent:'控制器与初始化方式', dependent:'平均存活个体数（population AUC / ticks）',
   confounds:'启发式初始化包含人工先验；随机网络未经训练；预算匹配的是矩阵前向额度，规则分支额外指令与墙钟仍不同。',
   limits:'仅比较未训练/启发式固定拓扑策略，不代表所有神经方法；固定队列不检验跨代优化。',
   overrides:{ reproduction:false, padControllerBudget:true, lifespanScale:4, cooperation:false, communication:'none' },
   arms:[{id:'rule',label:'规则',config:{controller:'rule',neuralInit:'random'}},{id:'neural-random',label:'随机网络',config:{controller:'neural',neuralInit:'random'}},{id:'neural-guided',label:'启发式网络',config:{controller:'neural',neuralInit:'guided'}}],
   contrasts:[['neural-random','rule'],['neural-guided','rule']] },
 { id:'cooperation',title:'稀缺资源与合作',hypothesis:'在具有协作采集收益的生态中，合作开关对存活积分的影响是否随再生率改变？',
   independent:'合作机制 × 再生率 0.004/0.028',dependent:'平均种群、协作采集量、分享量',
   confounds:'协作资源要求同格两名合作个体；合作阈值与收益由模型定义，非观察到的自然定律。关闭合作会固定合作基因为零。',
   limits:'比较机制包的因果效应，不证明合作自发形成；需另做混合策略入侵、收益矩阵与成本扫描。',
   overrides:{controller:'rule',communication:'local',environment:'stable',hardResources:true,mutationRate:0},
   arms:[{id:'scarce-off',label:'稀缺 · 无合作',config:{cooperation:false,regeneration:0.004}},{id:'scarce-on',label:'稀缺 · 合作',config:{cooperation:true,regeneration:0.004}},
     {id:'renewable-off',label:'再生 · 无合作',config:{cooperation:false,regeneration:0.028}},{id:'renewable-on',label:'再生 · 合作',config:{cooperation:true,regeneration:0.028}}],
   contrasts:[['scarce-on','scarce-off'],['renewable-on','renewable-off']] },
 { id:'mutation',title:'突变与跨代稳定性',hypothesis:'过高的突变率会降低适应后的稳定性吗？',independent:'每个遗传参数的突变概率 0/0.04/0.2',
   dependent:'平均种群；后半段种群变异系数；感知范围方差；每创始个体后代数',
   confounds:'只运行有限代数；固定网络拓扑；自然选择通过能量繁殖实现，不含学习；种群上限可能截断优势。',
   limits:'感知范围方差仅是单一性状多样性代理；零效应不等于突变率永远无影响。',
   overrides:{controller:'neural',neuralInit:'guided',environment:'seasonal'},
   arms:[{id:'m0',label:'μ = 0',config:{mutationRate:0}},{id:'m04',label:'μ = 0.04',config:{mutationRate:0.04}},{id:'m20',label:'μ = 0.20',config:{mutationRate:0.2}}],
   contrasts:[['m04','m0'],['m20','m0']] },
 { id:'environment',title:'环境改变与策略差异',hypothesis:'资源迁移是否提高可遗传感知范围的方差？', independent:'稳定/东西迁移环境',
   dependent:'感知范围方差（主指标）；平均种群（次指标）', confounds:'空间资源乘数与丰度变化并非完全相同；方差不等于功能性策略多样性。',
   limits:'仅支持环境条件对一个性状分布的影响，不能推断复杂智能的产生。',
   overrides:{controller:'neural',neuralInit:'guided',mutationRate:0.08}, metric:'traitDiversity',
   arms:[{id:'stable',label:'稳定',config:{environment:'stable'}},{id:'shifting',label:'迁移',config:{environment:'shifting'}}],contrasts:[['shifting','stable']] },
 { id:'communication',title:'局部通信与中心分配',hypothesis:'对相同公开观测进行通信，局部与中心架构的效率、掉线敏感性是否不同？', independent:'局部/中心 × 掉线概率 0/0.4',
   dependent:'平均种群；消息到达量；路由检查次数；通信能量与墙钟时间',
   confounds:'中心全局匹配目标，局部择近；局部按链路掉线，中心按网关整体掉线；失效相关性本就是实验条件。',
   limits:'中心未读取隐藏资源地图；相同发布信息与发送费不等于相同路由复杂度；不能推广到所有网络拓扑。',
   overrides:{controller:'rule',environment:'shifting',cooperation:true},
   arms:[{id:'local',label:'局部',config:{communication:'local',dropout:0}},{id:'central',label:'中心',config:{communication:'central',dropout:0}},
     {id:'local-fault',label:'局部 · 掉线',config:{communication:'local',dropout:0.4}},{id:'central-fault',label:'中心 · 掉线',config:{communication:'central',dropout:0.4}}],
   contrasts:[['local','central'],['local-fault','central-fault']] }
];
export const EXPERIMENT_BASE = Object.freeze({ width:36,height:24,initialPopulation:48,maxPopulation:160,
  resourceDensity:0.65,regeneration:0.02,seasonLength:300,sampleEvery:20,historyLimit:1000,lineageLimit:20000 });
export function planExperiment(id, options = {}) {
  const protocol = PROTOCOLS.find(p=>p.id===id); if (!protocol) throw new Error('Unknown experiment');
  const repeats=options.repeats??12, ticks=options.ticks??1800, baseSeed=options.baseSeed??73129;
  if (!Number.isInteger(repeats)||repeats<2||repeats>40||!Number.isInteger(ticks)||ticks<200||ticks>10000||!Number.isInteger(baseSeed)||baseSeed<0||baseSeed>4294967295) throw new Error('Invalid experiment repeats/ticks/seed');
  if (repeats*ticks*protocol.arms.length>600000) throw new Error('Experiment exceeds 600k world-step budget');
  const seeds=Array.from({length:repeats},(_,i)=>(baseSeed + i*104729)>>>0);
  const arms=protocol.arms.map(a=>({...a,config:validateConfig({...EXPERIMENT_BASE,...protocol.overrides,...a.config})}));
  return { engine:ENGINE_VERSION,id,protocol:{...protocol,arms:undefined},seeds,repeats,ticks,arms,
    primaryMetric:protocol.metric??'meanPopulation',statisticalUnit:'independent world; paired arms by seed',
    stoppingRule:'fixed ticks/repeats; no optional stopping or tuning after results' };
}
export function finishRun(world, plan, arm, seed, elapsedMs=0) {
  const m=world.metrics(), h=world.history.filter(x=>x.tick>=plan.ticks/2), values=h.map(x=>x.population), s=summary(values);
  // Full population integral is accumulated outside the bounded chart history.
  return { experiment:plan.id,arm:arm.id,label:arm.label,seed,ticks:plan.ticks,meanPopulation:world.populationIntegral/plan.ticks,
    finalPopulation:m.population,traitDiversity:m.traitDiversity,stabilityCV:s.mean ? s.sd/s.mean : 0,
    extinct:m.population===0?1:0,maxGeneration:m.generation,births:m.births,deaths:m.deaths,
    descendantsPerFounder:m.births/world.config.initialPopulation,cooperativeHarvest:m.cooperativeHarvest,shared:m.shared,
    eaten:m.eaten,messagesSent:m.messagesSent,messagesDelivered:m.messagesDelivered,routingChecks:m.routingChecks,
    neuralEvaluations:m.neuralEvaluations,neuralMACs:m.neuralMACs,controllerCalls:m.controllerCalls,cappedBirths:m.cappedBirths,
    balanceError:m.balanceError,elapsedMs,initialEnvironmentHash:world.initialEnvironmentHash,finalDigest:world.digest(),config:world.config };
}
export function analyze(plan,runs) {
  const metric=plan.primaryMetric, groups=plan.arms.map(arm=>({id:arm.id,label:arm.label,...summary(runs.filter(r=>r.arm===arm.id).map(r=>r[metric]))}));
  const contrasts=holm(plan.protocol.contrasts.map(([a,b],i)=>({a,b,metric,...pairedInference(
    plan.seeds.map(seed=>runs.find(r=>r.arm===a&&r.seed===seed)[metric]),
    plan.seeds.map(seed=>runs.find(r=>r.arm===b&&r.seed===seed)[metric]),plan.seeds[0]+i)})));
  return { plan,runs,groups,contrasts, interpretation:'Model-specific repeated-world comparison; CI is bootstrap uncertainty, pHolm controls planned contrasts within this experiment. Secondary metrics are descriptive.' };
}
export function prepareRun(plan,arm,seed) {
  const w=new World({...arm.config,seed}); w.populationIntegral=0;
  w.initialEnvironmentHash=JSON.stringify([Array.from(w.food),Array.from(w.hard),w.agents.map(a=>[a.x,a.y,a.energy])]);
  // Stable non-cryptographic digest for convenient paired-environment equality checks.
  let h=2166136261; for(const ch of w.initialEnvironmentHash) h=Math.imul(h^ch.charCodeAt(0),16777619);
  w.initialEnvironmentHash=(h>>>0).toString(16).padStart(8,'0'); return w;
}
export function advanceRun(w,count) { for(let i=0;i<count;i++){w.step();w.populationIntegral+=w.agents.length;} }
