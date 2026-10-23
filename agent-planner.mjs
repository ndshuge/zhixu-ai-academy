/**
 * AI学院：可验证的科学工具注册表与下一轮受控实验规划。
 * V0.3 currently uses deterministic pedagogical policies, NOT an LLM agent.
 * A future model planner must output only a proposal; never call run tools directly.
 *
 * This module is self-contained: no dependency on mutable PFL/EvoWorld source.
 */
const deepFreeze=(v)=>{
  if(v&&typeof v==='object'&&!Object.isFrozen(v)){
    Object.freeze(v);
    for(const x of Object.values(v))deepFreeze(x);
  }
  return v;
};

export const SCIENCE_TOOLS=deepFreeze([
 {id:'pfl.sensitivity',experiment:'sensitivity',name:'混沌初值敏感性',
  reads:['r','x0','logDelta','steps'],variable:'logDelta',budget:'≤300 迭代步',
  insight:'比较两条初值非常接近的轨道，注意混沌条件与浮点精度边界'},
 {id:'pfl.logistic',experiment:'logistic',name:'Logistic 非线性迭代',
  reads:['r','x0','steps'],variable:'r',budget:'≤300 迭代步',
  insight:'只改变映射参数r，比较不同动力学行为，保留初值与观察时间'},
 {id:'evo.paired',experiment:'evo-pair',name:'数字生命合作配对对照',
  reads:['seed'],variable:'seed',budget:'两臂×两个种子×200 tick',
  insight:'改变随机种子，重复合作机制对照；小样本不具有统计推断力'}
]);

export const MAX_STUDENT_EXPERIMENT_ROUNDS=5;

export function buildRuleProposal(priorRun,{goal=''}={}){
 if(!priorRun||!priorRun.result||!priorRun.result.experiment)
  throw new Error('没有经过服务器验证的实验结果');
 if(typeof goal!=='string'||goal.length>300)
  throw new Error('学生的探究目标过长或不合法');
 const experiment=priorRun.result.experiment;
 const previous=priorRun.result.condition;
 const cleanGoal=goal.trim().slice(0,300);
 const tool=SCIENCE_TOOLS.find(t=>t.experiment===experiment);
 if(!tool)throw new Error('无对应的受控科学工具');
 const initial=priorRun.depth||0;
 if(initial>=MAX_STUDENT_EXPERIMENT_ROUNDS-1)
  throw new Error('已达到本次教学工作台的安全演示轮数限制');
 let next,before,after,field,reason,hypothesis,limitations;
 if(experiment==='sensitivity'){
  field='logDelta'; before=Number(previous.logDelta);
  if(!Number.isInteger(before))throw new Error('原始扰动参数无效');
  after=before<=-6?Math.min(-3,before+3):Math.max(-14,before-3);
  if(after===before)throw new Error('无法生成有效的单变量对照');
  next={r:Number(previous.r),x0:Number(previous.x0),steps:Number(previous.steps),logDelta:after};
  reason='只改变 log₁₀(δ)，把初值扰动改动三个数量级；方程参数 r、主轨道初值与迭代步数全部保持不变。';
  hypothesis='扰动增大后，首次达到分离阈值所需的迭代步数是否改变？';
  limitations='浮点精度和有限观察窗影响数值结果；不同阈值的首次到达时刻不能当作混沌的充分判据。';
 }else if(experiment==='logistic'){
  field='r';before=Number(previous.r);
  after=Number((before>=3.75?Math.max(3.3,before-.2):Math.min(4,before+.2)).toFixed(2));
  if(after===before)throw new Error('无法生成有效的单变量对照');
  next={r:after,x0:Number(previous.x0),steps:Number(previous.steps)};
  reason='只改变映射参数 r，保留初值、迭代步数。比较轨道表现，但不预先给“混沌”标签。';
  hypothesis='r 改变以后，长期轨道会向固定点、周期还是非周期表现转变？';
  limitations='有限的单条轨迹不足以证实普遍性的动力学类型；可能存在暂态与周期窗口。';
 }else{
  field='seed';before=Number(previous.baseSeed);
  // Use a new precommitted seed to produce a second paired replication.
  after=before<=4_293_999_899?before+101:before-101;
  if(!Number.isInteger(before)||after<0||after>4_294_000_000)
   throw new Error('原始种子无效');
  next={seed:after};
  reason='仅调整配对实验的基准随机种子，合作开关、环境、种群配置、200tick与各臂两次独立重复保持不变。';
  hypothesis='在另一个事先固定的随机种子组中，合作开启与关闭的平均种群差是否还具有相同方向？';
  limitations='增加这一轮后仍然只有少量独立重复，不能声称合作具有普遍因果效果；应继续做统计方案。';
 }
 if(!Number.isFinite(before)||!Number.isFinite(after))throw new Error('计划数值无效');
 const changes=[{field,from:before,to:after}];
 return {
  plannerMode:'rules',toolId:tool.id,experiment,
  goal:cleanGoal,studyQuestion:hypothesis,why:reason,limits:limitations,
  controlPolicy:'exactly-one-variable',
  fixedVariables:tool.reads.filter(x=>x!==field),
  changes,params:experiment==='evo-pair'?null:next,
  seed:experiment==='evo-pair'?next.seed:null,
  budget:tool.budget,round:initial+2,
  approvalRequired:true,autoExecuted:false,
  note:'当前由可检验规则生成，不代表远程LLM已经完成自主工具规划。'
 };
}

/**
 * Verify strict single-variable mutation even if future planner is an LLM.
 * The tool policy must not accept text names or arbitrary file/command actions.
 */
export function verifyProposalAgainstRun(priorRun,proposal){
 if(!priorRun?.result||!proposal||typeof proposal!=='object'||Array.isArray(proposal))
  return false;
 const experiment=priorRun.result.experiment,tool=SCIENCE_TOOLS.find(x=>x.experiment===experiment);
 if(!tool||proposal.experiment!==experiment||proposal.toolId!==tool.id)return false;
 const changes=proposal.changes;
 if(!Array.isArray(changes)||changes.length!==1||changes[0].field!==tool.variable)return false;
 const c=changes[0];
 const before=experiment==='evo-pair'?Number(priorRun.result.condition.baseSeed):Number(priorRun.result.condition[tool.variable]);
 if(c.from!==before||!Number.isFinite(c.to)||c.from===c.to)return false;
 if(experiment==='evo-pair'){
  return proposal.params===null&&Number.isInteger(proposal.seed)&&proposal.seed===c.to&&
   c.to>=0&&c.to<=4_294_000_000;
 }
 const keys=tool.reads,params=proposal.params;
 if(!params||typeof params!=='object'||Array.isArray(params)||Object.keys(params).sort().join()!==keys.slice().sort().join())return false;
 if(params[tool.variable]!==c.to)return false;
 const original=priorRun.result.condition;
 if(keys.some(key=>key!==tool.variable&&params[key]!==original[key]))return false;
 if(params.steps>300||params.steps<1)return false;
 if(experiment==='sensitivity')
  return Number.isInteger(params.logDelta)&&params.logDelta>=-14&&params.logDelta<=-3
   &&params.r>=3.3&&params.r<=4&&params.x0>0&&params.x0<.85;
 return params.r>=3.3&&params.r<=4&&params.x0>0&&params.x0<.85;
}
