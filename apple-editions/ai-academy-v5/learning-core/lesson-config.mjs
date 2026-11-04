import {validateLogisticParams} from './logistic-model.mjs';

export function validateEvoParams(params){
 if(!params||typeof params!=='object'||Array.isArray(params)
    ||Object.keys(params).length!==1 || !Object.hasOwn(params,'seed'))throw Error('EvoWorld 必须提供单独的 seed 参数');
 if(!Number.isInteger(params.seed)||params.seed<1||params.seed>99999999)throw Error('EvoWorld 种子必须是 1–99999999 的整数');
 return {seed:params.seed};
}

const evoPrompts={
 pretest:[
  '一个世界运行很多 tick，是否等于做了多个独立世界？',
  '思考“独立实验单位”应当是种子生成的世界，还是世界内部的时间步。',
  '先按自己的理解选择，现阶段不会提前公布答案。'
 ],
 predict:[
  '如果随机种子改变，独立模拟中的结果会保持一致吗？',
  '请说明要改变的是种子，哪些规则和对照条件需要保持不变。',
  '写下预测，并明确它属于模型内的假设，不能直接推断现实世界。'
 ],
 ready:[
  '确认你已写下关于独立模拟的事前预测。',
  '单独选择种子；世界运行的 tick 数不等于独立重复次数。',
  '由你主动批准运行 EvoWorld 实验。'
 ],
 evidence:[
  '比较不同种子和不同条件下的观测结果。',
  '模拟结果是否支持原先预测？多个 tick 不能当成多个独立重复。',
  '讨论模拟的假设与边界：现有结果是否足以支持关于现实生态的结论？'
 ],
 reflected:[
  '请尝试把“独立重复”的概念带入新的问题。',
  '区分多次观察同一个世界与多次独立生成世界。',
  '迁移前先总结这套模型允许和不允许作出的推论。'
 ],
 transfer:[
  '模拟模型里的观察能否直接当成真实自然界的证明？',
  '关注实验单位、随机种子以及模型假设是否保持一致。',
  '独立作答后才能得到原版题库评分。'
 ],
 complete:[
  '迁移题已由原版题库判分；需要继续验证模型推断边界。',
  '请根据真实错因候选判断自己是否把 tick 误当独立重复。',
  '完成一次练习不等于证明理解程度或现实自然规律。'
 ]
};
export function resolveLesson(experiment='sensitivity'){
 if(experiment==='sensitivity')return {
  experiment,lessonId:'logistic-sensitivity-v1',conceptId:'chaos.sensitivity',
  validateParams:validateLogisticParams,formulaPreview:true,prompts:null
 };
 if(experiment==='evo-pair')return {
  experiment,lessonId:'evo-independence-v1',conceptId:'evolution.inference',
  validateParams:validateEvoParams,formulaPreview:false,prompts:evoPrompts
 };
 throw Error('不支持的学习实验：'+String(experiment));
}
