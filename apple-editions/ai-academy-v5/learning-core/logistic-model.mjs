// Deterministic browser-side preview, never an official PFL observation.
export function validateLogisticParams(input){
 if(!input||typeof input!=='object')throw Error('缺少实验参数');
 const out={};
 for(const key of ['r','x0','steps','logDelta']){
  const v=input[key];
  if(typeof v!=='number'||!Number.isFinite(v))throw Error('实验参数必须为有限数值：'+key);
  out[key]=v;
 }
 if(out.r<3.3||out.r>4||out.x0<=0||out.x0>=1||
    !Number.isInteger(out.steps)||out.steps<20||out.steps>300||
    out.logDelta< -14||out.logDelta> -3||
    out.x0+10**out.logDelta>=1)throw Error('实验参数超出原版科学引擎允许范围');
 return out;
}
export function computeLogisticPreview(input){
 const params=validateLogisticParams(input);
 let x=params.x0,y=params.x0+10**params.logDelta;
 const first=[],second=[];
 for(let i=0;i<=params.steps;i++){
  first.push([i,x]);second.push([i,y]);
  x=params.r*x*(1-x);y=params.r*y*(1-y);
 }
 const divergence=first.findIndex((p,i)=>Math.abs(p[1]-second[i][1])>=0.1);
 return {kind:'formula-preview',evidence:false,engine:'local-logistic-formula',
  note:'仅供互动观察的公式预览，不计入学习证据；正式计算以原版 PFL 为准。',
  params,series:[{label:'初值 A',points:first},{label:'初值 B',points:second}],
  firstLargeSeparationAt:divergence<0?null:divergence};
}
