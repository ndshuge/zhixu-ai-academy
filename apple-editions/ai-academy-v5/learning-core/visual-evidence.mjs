/**
 * UI-neutral visualization schema derived solely from verified science API outputs.
 * Never interpolates results, invents samples, or interprets a two-world run as significance.
 */
const text=(value,max=260)=>String(value??'').slice(0,max);
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const round=v=>Math.round(v*1e10)/1e10;
const boundedArray=(value,max)=>Array.isArray(value)?value.slice(0,max):[];
function validPoint(point){
 return Array.isArray(point)&&point.length===2&&point.every(finite);
}
function base(run,experimentId){
 if(!run||!run.runId)throw Error('缺少真实科学实验 runId');
 if(run.experiment&&run.experiment!==experimentId)throw Error('实验类型与科学数据不匹配');
 if(!['sensitivity','evo-pair'].includes(experimentId))throw Error('不支持的实验类型');
 return {
  schemaVersion:1,experimentId,sourceRunId:text(run.runId,120),evidence:true,
  source:'official-engine-result',engine:text(run.engine,100),
  engineVersion:text(run.engineVersion,100),adapterSha256:run.adapterSha256||null,
  views:[],metrics:[],limitations:[],pairs:[],summary:null
 };
}
export function buildExperimentVisualization(run,experimentId){
 const result=base(run,experimentId);
 if(experimentId==='sensitivity'){
  const plots=boundedArray(run.plots,4);
  if(!plots.length)throw Error('科学数据缺少有效轨迹');
  result.views=plots.map((plot,plotIndex)=>{
   const series=boundedArray(plot.series,5).map((s,seriesIndex)=>{
    const pts=boundedArray(s.points,600);
    if(!pts.length||!pts.some(validPoint)||!pts.every(p=>p===null||validPoint(p)))
     throw Error('科学数据含有无效点，不允许伪造补齐');
    // Preserve null gaps at their original indices so tutor selections match the source API.
    return {seriesIndex,label:text(s.label),points:pts.map(p=>p===null?null:[p[0],p[1]])};
   });
   if(!series.length)throw Error('科学数据缺少有效轨迹');
   return {plotIndex,kind:'line',title:text(plot.title),xLabel:text(plot.xLabel||'迭代步'),yLabel:text(plot.yLabel||'观测值'),
    yScale:text(plot.yScale||'linear',40),series};
  });
  result.metrics=boundedArray(run.metrics,16).map(m=>({label:text(m.label),value:m.value??null,unit:text(m.unit,30)}));
  result.limitations=boundedArray(run.warnings,8).map(w=>text(w,350));
  if(run.summary)result.summary={text:text(run.summary,500),derived:false};
  return result;
 }
 const rows=boundedArray(run.results,40);
 if(rows.length===0)throw Error('EvoWorld 没有真实世界结果');
 const perSeed=new Map();
 for(const row of rows){
  const seed=row.seed;
  if(!Number.isInteger(seed)||seed<0||!finite(row.meanPopulation)||!finite(row.endingPopulation))
   throw Error('EvoWorld 世界指标包含无效数据');
  if(!['合作开启','合作关闭'].includes(row.condition))throw Error('未知实验处理条件');
  if(!perSeed.has(seed))perSeed.set(seed,{});
  const arm=row.condition==='合作开启'?'on':'off';
  if(perSeed.get(seed)[arm])throw Error('同一随机种子的处理条件发生重复，不能配对');
  perSeed.get(seed)[arm]={meanPopulation:row.meanPopulation,endingPopulation:row.endingPopulation};
 }
 result.pairs=[...perSeed.entries()].filter(([,arms])=>arms.on&&arms.off).map(([seed,arms])=>({
  seed,cooperationOn:arms.on,cooperationOff:arms.off,
  deltaMeanPopulation:round(arms.on.meanPopulation-arms.off.meanPopulation),
  deltaEndingPopulation:round(arms.on.endingPopulation-arms.off.endingPopulation),
  derived:true
 }));
 const complete=result.pairs.length;
 if(!complete)throw Error('EvoWorld 缺少任何完整的真实配对种子');
 const categories=result.pairs.map(p=>String(p.seed));
 result.views=[{
  plotIndex:null,kind:'grouped-bar',title:'配对种子的平均种群（模型内观察）',
  xLabel:'独立随机种子',yLabel:'200 tick 内的平均种群',categories,
  series:[
   {label:'合作开启',points:result.pairs.map((p,i)=>[i,p.cooperationOn.meanPopulation])},
   {label:'合作关闭',points:result.pairs.map((p,i)=>[i,p.cooperationOff.meanPopulation])}
  ]
 },{
  plotIndex:null,kind:'grouped-bar',title:'配对种子的结束种群（模型内观察）',
  xLabel:'独立随机种子',yLabel:'结束时种群数量',categories,
  series:[
   {label:'合作开启',points:result.pairs.map((p,i)=>[i,p.cooperationOn.endingPopulation])},
   {label:'合作关闭',points:result.pairs.map((p,i)=>[i,p.cooperationOff.endingPopulation])}
  ]
 }];
 // The Pages Evo runner supplies observed World.step() samples; the server may only
 // supply final/mean metrics. Absence of samples must never produce a fake trend.
 const fullySampled=rows.every(row=>Array.isArray(row.populationSamples)&&row.populationSamples.length>1);
 if(fullySampled){
  result.views.push({
   plotIndex:null,kind:'line',title:'真实世界种群的采样轨迹',
   xLabel:'模拟时间 tick',yLabel:'实际个体数',source:'official-engine-samples',derived:false,
   series:rows.map(row=>{
    const points=row.populationSamples.slice(0,40);
    if(!points.every(p=>validPoint(p)&&Number.isInteger(p[0])&&p[0]>=0&&Number.isInteger(p[1])&&p[1]>=0))
     throw Error('EvoWorld 采样数据无效，不能编造时间曲线');
    for(let i=1;i<points.length;i++)if(points[i][0]<=points[i-1][0])
     throw Error('EvoWorld 实际采样时间不能倒退或重复');
    return {label:'种子 '+row.seed+' · '+row.condition,points:points.map(p=>[p[0],p[1]])};
   })
  });
 }
 result.summary={
  independentSeeds:complete,averagePairedDifference:round(result.pairs.reduce((a,p)=>a+p.deltaMeanPopulation,0)/complete),
  derived:true,significanceClaim:false,note:'每个随机种子作为一个配对观察单位；世界内的 tick 不是独立重复。'
 };
 result.limitations=[text(run.warning||'这些结论只限于当前 EvoWorld 模型，不能直接外推真实生态。',380),
  '平均差是当前种子的描述值，不能由两组种子推断普遍优势或统计显著性。'];
 if(!fullySampled&&rows.some(r=>Array.isArray(r.populationSamples)))
  result.limitations.push('部分世界缺少实际采样，不能组合成连续的真实演化曲线。');
 if(complete<perSeed.size)result.limitations.push('部分随机种子的实验处理数据缺失，已仅使用完整的配对观测。');
 return result;
}
export function pickEvidencePoint(visualization,selection){
 if(!visualization||visualization.experimentId!=='sensitivity')throw Error('逐点选取仅限 PFL 真实轨迹');
 const {plotIndex,seriesIndex,pointIndex}=selection||{};
 if(![plotIndex,seriesIndex,pointIndex].every(x=>Number.isInteger(x)&&x>=0))throw Error('数据点坐标必须是非负整数索引');
 const plot=visualization.views?.[plotIndex],series=plot?.series?.[seriesIndex],p=series?.points?.[pointIndex];
 if(plot?.kind!=='line'||!validPoint(p))throw Error('所选数据点不在真实实验结果内');
 return {selection:{plotIndex,seriesIndex,pointIndex},
  plotTitle:plot.title,seriesLabel:series.label,x:p[0],y:p[1],
  sourceRunId:visualization.sourceRunId,source:'official-engine-result'};
}

export function pickEvoWorldPair(visualization,seed){
 if(visualization?.experimentId!=='evo-pair')throw Error('世界配对仅适用于 EvoWorld 科学实验');
 if(!Number.isInteger(seed))throw Error('随机种子必须是整数');
 const row=visualization.pairs?.find(p=>p.seed===seed);
 if(!row)throw Error('所选随机种子未出现在本次真实世界配对结果中');
 return JSON.parse(JSON.stringify({...row,sourceRunId:visualization.sourceRunId,
  source:'official-engine-result',derived:true}));
}
