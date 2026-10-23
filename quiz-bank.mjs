/**
 * Fixed, versioned concept checks. Correct options live server-side only.
 * Distinct pre, transfer and review forms: no answer key in public GET.
 * These are teaching instruments, not psychometric tests.
 */
const bank=[
 {id:'chaos.same-rule.pre.01',stage:'pre',experiment:'sensitivity',conceptIds:['chaos.same-rule'],
 prompt:'两位同学采用相同的 Logistic 方程与相同参数 r，只把初值 x₀ 改动极小一点。数十次迭代后两条曲线分开。最合理的解释是？',
 options:['计算结果不同，说明方程已自动改变','同一非线性方程也可能对初值差异十分敏感','只要演化方程相同，任意初值的轨道必然重合'],answer:1,
 explanation:'演化规则和 r 均未变化。改变的是初值，非线性系统可将极小初值差放大；仍需注意有限迭代和数值误差。',
 misconceptions:{0:'same-rule-confusion',2:'same-rule-confusion'}},
 {id:'chaos.control.pre.01',stage:'pre',experiment:'sensitivity',conceptIds:['inquiry.control-variable'],
 prompt:'为了单独研究初值差异对轨道分离的作用，两次 Logistic 实验应该怎样安排？',
 options:['固定 r 与步数，只改变初值差异','同时改变 r、初值和步数，尽可能看到不同现象','保持初值差异变化的同时更换公式'],answer:0,
 explanation:'对照实验一次只改变目标因素，避免把公式、参数和迭代时长变化混成一个解释。',
 misconceptions:{1:'control-variable',2:'parameter-vs-initial'}},
 {id:'chaos.same-rule.transfer.01',stage:'transfer',experiment:'sensitivity',conceptIds:['chaos.same-rule','chaos.sensitivity'],
 prompt:'一个学生用相同 r 的 Logistic 公式，分别从 0.217000 与 0.217001 开始计算。后期结果差别很大。由此**不能**直接得出的结论是？',
 options:['两次计算的初值不同','该模型在这组条件下显示了初值敏感性的迹象','两条轨道一定遵循不同的数学方程'],answer:2,
 explanation:'轨道显著分离不能推出方程不同。同一公式可能产生不同轨道；还应关注参数、误差和有限时间窗口。',
 misconceptions:{0:'same-rule-confusion',1:'same-rule-confusion'}},
 {id:'chaos.control.transfer.01',stage:'transfer',experiment:'sensitivity',conceptIds:['inquiry.control-variable'],
 prompt:'第二轮对照改变了 r 和初值差异，分离时间变了。若要判断主要是哪一因素造成变化，下一步最合理的是？',
 options:['只改动其中一个因素，另一个保持不变，再做对照','把每一次运行都看作独立理论证明','继续同时调大 r 和初值差异以增加可观察差别'],answer:0,
 explanation:'至少需要控制其余变量后分别改变因素；目前两者同时变化，不能把差异归因于单一因素。',
 misconceptions:{1:'control-variable',2:'control-variable'}},
 {id:'chaos.same-rule.review.01',stage:'review',experiment:'sensitivity',conceptIds:['chaos.same-rule'],
 prompt:'两个摆动模型使用完全相同的更新方程，但起始状态略微不同，随后轨道偏离。可以合理推断的是？',
 options:['方程在第二次实验中悄悄变了','单凭轨道偏离不能判定方程不同，应先核对初始条件及模型参数','只要算法相同，离散系统始终不可能出现轨道分离'],answer:1,
 explanation:'不同初值可在相同规则下演化出差异，不能把轨道偏离直接等同于规则改变。',
 misconceptions:{0:'same-rule-confusion',2:'same-rule-confusion'}},
 {id:'chaos.control.review.01',stage:'review',experiment:'sensitivity',conceptIds:['inquiry.control-variable'],
 prompt:'你想检验改变初值 x₀ 的效果。以下哪组试验最利于解释观察到的差别？',
 options:['第一次 r=3.6，第二次 r=3.9 且初值不同','固定 r、迭代步数与公式，仅改变 x₀','所有参数随机变化，重复10次就能确保归因'],answer:1,
 explanation:'一个变量变化、其他条件固定才能减少混杂。重复次数不能替代控制变量。',
 misconceptions:{0:'control-variable',2:'control-variable'}},
 {id:'evo.independence.pre.01',stage:'pre',experiment:'evo-pair',conceptIds:['evolution.independence'],
 prompt:'EvoWorld 对照实验每组有2个独立随机世界、200个tick。真正的独立重复数量更接近哪个？',
 options:['2个随机世界','200个tick','200个tick乘以所有个体数量'],answer:0,
 explanation:'在当前设计中独立重复单位是世界（随机种子），不是同一世界里相关的时间步或个体。',
 misconceptions:{1:'pseudoreplication',2:'pseudoreplication'}},
 {id:'evo.inference.transfer.01',stage:'transfer',experiment:'evo-pair',conceptIds:['evolution.inference'],
 prompt:'在两个种子的配对模拟中合作开启组均值更高。对真实生态系统最严谨的表述是？',
 options:['已证明所有真实生态系统合作都有优势','模拟内观测到差异，但样本太少且模型假设限制了外推','200tick相当于200个独立样本，因此显著'],answer:1,
 explanation:'少量模拟、模型机制与真实生态差异都限制外推。tick是同一模型内相关过程，不是独立重复。',
 misconceptions:{0:'simulation-overclaim',2:'pseudoreplication'}},
 {id:'evo.independence.review.01',stage:'review',experiment:'evo-pair',conceptIds:['evolution.independence','evolution.inference'],
 prompt:'把单个生态模拟世界运行2000tick，再与运行200tick比较：独立样本数是否因此变成10倍？',
 options:['是，因为tick数增加了十倍','否，仍是同一个随机世界，需要增加独立种子/世界','是，因为生命个体会不断繁殖'],answer:1,
 explanation:'延长观察长度不等于增加独立重复的数量；应该增加独立世界并约定统计指标。',
 misconceptions:{0:'pseudoreplication',2:'pseudoreplication'}}
];
export const CONCEPTS=Object.freeze([
 {id:'chaos.same-rule',label:'同一方程与不同轨道',experiment:'sensitivity'},
 {id:'chaos.sensitivity',label:'初值敏感性',experiment:'sensitivity'},
 {id:'inquiry.control-variable',label:'控制变量与可重复实验',experiment:'sensitivity'},
 {id:'evolution.independence',label:'独立随机种子与重复',experiment:'evo-pair'},
 {id:'evolution.inference',label:'模拟结论的推断边界',experiment:'evo-pair'}
]);
// Choice-specific, evidence-bound prompts: deterministic teaching support, not an LLM diagnosis.
const NEXT_STEP_BY_ERROR=Object.freeze({
 'same-rule-confusion':'回到本次PFL的条件卡，逐项核对公式、r和两条轨迹的初值。只观察到轨迹分离，能否据此断定公式变了？请用数据回答。',
 'parameter-vs-initial':'列出本次实验的r、x₀与初值扰动δ；设计只改变δ的一轮对照，保留其余参数。先预测，再观察。',
 'control-variable':'对比实验时先固定公式、r与迭代步数，每次只改一个目标变量；写出你准备保持不变的条件，再判断差异原因。',
 'pseudoreplication':'分别写下“独立随机世界数”和“每个世界的tick数”。如果想提高独立重复次数，应增加新的随机种子，而不是只延长同一世界的时间。',
 'simulation-overclaim':'回看两个独立随机世界的配对结果，描述模型内看到的差异，并解释为什么少量仿真不能直接证明现实生态中的普遍结论。',
 'needs-review':'重新读题，列出原判断依赖的证据和仍未知的条件；用一次控制变量实验或新变式题核对，不急着下结论。'
});
const all=new Map(bank.map(q=>[q.id,q]));
export function publicQuestion(q){
 if(!q)return null;
 return {itemId:q.id,questionVersion:1,stage:q.stage,experiment:q.experiment,
  prompt:q.prompt,options:q.options.slice(),conceptIds:q.conceptIds.slice()};
}
export function listPublicQuestions({stage,experiment}={}){
 return bank.filter(x=>(!stage||x.stage===stage)&&(!experiment||x.experiment===experiment)).map(publicQuestion);
}
export function getPublicQuestion(itemId){return publicQuestion(all.get(itemId))}
export function gradeQuestion(itemId,studentAnswer){
 const q=all.get(itemId);
 if(!q)throw new Error('题目ID不存在');
 if(!Number.isInteger(studentAnswer)||studentAnswer<0||studentAnswer>=q.options.length)
  throw new Error('请主动选择一个有效答案');
 const correct=studentAnswer===q.answer;
 return {itemId:q.id,questionVersion:1,stage:q.stage,experiment:q.experiment,
  conceptIds:q.conceptIds.slice(),studentAnswer,studentAnswerText:q.options[studentAnswer],
  gradedResult:correct?'correct':'incorrect',correct,
  correctAnswer:q.answer,correctAnswerText:q.options[q.answer],
  feedback:q.explanation,rubricVersion:'concept-rubric-1.0',
  // Never provide choice-specific remediation during the blinded pre-test.
  nextStep:correct||q.stage==='pre'?null:NEXT_STEP_BY_ERROR[q.misconceptions[studentAnswer]||'needs-review'],
  // A candidate is only supported by this concrete wrong choice, not a durable student label.
  misconception:correct?null:{
   code:q.misconceptions[studentAnswer]||'needs-review',
   source:'deterministic-question-rubric',status:'pending',
   reason:'根据这道客观题的具体错误选项提出的待核验解释，不等于已经确认的学生能力诊断。'
  }};
}
export function recommendedReviewItem(conceptId){
 if(conceptId?.startsWith('evolution.'))return 'evo.independence.review.01';
 return conceptId==='inquiry.control-variable'?'chaos.control.review.01':'chaos.same-rule.review.01';
}
