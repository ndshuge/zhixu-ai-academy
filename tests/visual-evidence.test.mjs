import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExperimentVisualization, pickEvidencePoint, pickEvoWorldPair} from '../apple-editions/ai-academy-v5/learning-core/visual-evidence.mjs';

const pfl={
 runId:'pfl-actual-21',experiment:'sensitivity',engineVersion:'pages-logistic-float64-v1',
 condition:{r:3.9,x0:0.217,steps:4,logDelta:-10},
 metrics:[{label:'首次超过0.01',value:3,unit:'步'}],
 summary:'依据 Logistic 计算',warnings:['浮点精度影响轨迹'],
 plots:[
 {title:'真实两条轨迹',xLabel:'迭代 n',yLabel:'状态 x',series:[
  {label:'Float64 A',points:[[0,.217],[1,.663],[2,.871],[3,.438]]},
  {label:'Float64 B',points:[[0,.2170000001],[1,.66300000018],[2,.8709999997],[3,.43800003]]}]},
 {title:'真实差值',xLabel:'迭代 n',yLabel:'绝对差',series:[{label:'Float64 差',points:[[0,.0000000001],[1,.00000000018],[2,.0000000003],[3,.00000003]]}]}
 ]};
const evo={runId:'evo-actual-88',experiment:'evo-pair',engineVersion:'evoworld-0.1.1',
 condition:{compare:'cooperation',repeats:2,ticks:200,baseSeed:12023},
 warning:'只有两个种子，不能断言普遍生态规律',
 results:[
 {seed:12023,condition:'合作开启',meanPopulation:40,endingPopulation:52},
 {seed:12023,condition:'合作关闭',meanPopulation:30,endingPopulation:27},
 {seed:116752,condition:'合作开启',meanPopulation:20,endingPopulation:21},
 {seed:116752,condition:'合作关闭',meanPopulation:35,endingPopulation:42}
 ]};

test('real PFL plot retains true axes, points, provenance and no invented interpolation',()=>{
 const vis=buildExperimentVisualization(pfl,'sensitivity');
 assert.equal(vis.evidence,true);
 assert.equal(vis.sourceRunId,'pfl-actual-21');
 assert.equal(vis.source,'official-engine-result');
 assert.equal(vis.views.length,2);
 assert.equal(vis.views[0].kind,'line');
 assert.equal(vis.views[0].xLabel,'迭代 n');
 assert.equal(vis.views[0].yLabel,'状态 x');
 assert.deepEqual(vis.views[0].series[0].points,pfl.plots[0].series[0].points);
 assert.equal(vis.views[0].series[0].points.length,4);
 assert.equal(vis.metrics[0].value,3);
 assert.match(vis.limitations.join('，'),/浮点精度/);
});
test('PFL data point selection uses only actual indices and can be handed to original mentor',()=>{
 const vis=buildExperimentVisualization(pfl,'sensitivity');
 const selected=pickEvidencePoint(vis,{plotIndex:0,seriesIndex:1,pointIndex:3});
 assert.deepEqual(selected.selection,{plotIndex:0,seriesIndex:1,pointIndex:3});
 assert.equal(selected.y,.43800003);
 assert.equal(selected.x,3);
 assert.equal(selected.plotTitle,'真实两条轨迹');
 for(const invalid of [{plotIndex:1,seriesIndex:9,pointIndex:0},{plotIndex:0,seriesIndex:1,pointIndex:99},{plotIndex:0,seriesIndex:0,pointIndex:-1},{plotIndex:'0',seriesIndex:0,pointIndex:1}])
  assert.throws(()=>pickEvidencePoint(vis,invalid));
});
test('Evo pairs true matched seed worlds with both mean and endpoint metrics',()=>{
 const vis=buildExperimentVisualization(evo,'evo-pair');
 assert.equal(vis.sourceRunId,'evo-actual-88');
 assert.equal(vis.pairs.length,2);
 assert.deepEqual(vis.pairs.map(p=>[p.seed,p.deltaMeanPopulation]),[[12023,10],[116752,-15]]);
 assert.equal(vis.pairs[0].deltaEndingPopulation,25);
 assert.equal(vis.views[0].kind,'grouped-bar');
 assert.equal(vis.views[0].series.length,2);
 assert.equal(vis.views[0].series[0].points.length,2);
 assert.equal(vis.summary.averagePairedDifference,-2.5);
 assert.equal(vis.summary.independentSeeds,2);
 assert.equal(vis.summary.derived,true);
 assert.match(vis.limitations.join(' '),/模拟|生态|独立/);
 assert.equal(vis.views.some(v=>v.kind==='line'),false);
 assert.throws(()=>pickEvidencePoint(vis,{plotIndex:0,seriesIndex:0,pointIndex:0}),/仅限|PFL/);
});
test('EvoWorld time-series visualizes only the actual sampled tick populations, never interpolates',()=>{
 const sampled={...evo,results:evo.results.map(row=>({
  ...row,populationSamples:[[0,24],[20,Math.round(row.meanPopulation)],[200,row.endingPopulation]]
 }))};
 const vis=buildExperimentVisualization(sampled,'evo-pair');
 const timeline=vis.views.find(v=>v.kind==='line');
 assert.equal(timeline.title,'真实世界种群的采样轨迹');
 assert.equal(timeline.series.length,4);
 assert.equal(timeline.series[0].points.length,3);
 assert.deepEqual(timeline.series[0].points,[[0,24],[20,40],[200,52]]);
 assert.equal(timeline.xLabel,'模拟时间 tick');
 assert.equal(timeline.source,'official-engine-samples');
 assert.equal(timeline.derived,false);
 assert.deepEqual(vis.views[0].categories,['12023','116752']);
});
test('student can pick one matched EvoWorld seed, but never an unobserved seed',()=>{
 const vis=buildExperimentVisualization(evo,'evo-pair');
 const pair=pickEvoWorldPair(vis,116752);
 assert.equal(pair.seed,116752);
 assert.equal(pair.deltaMeanPopulation,-15);
 assert.equal(pair.sourceRunId,'evo-actual-88');
 assert.throws(()=>pickEvoWorldPair(vis,333333));
 assert.throws(()=>pickEvoWorldPair(vis,'116752'));
});

test('partial Evo sample arrays must be flagged rather than shown as full timelines',()=>{
 const partial={...evo,results:evo.results.map((row,index)=>index===0?{...row,populationSamples:[[0,24],[20,22],[200,row.endingPopulation]]}:row)};
 const vis=buildExperimentVisualization(partial,'evo-pair');
 assert.equal(vis.views.some(v=>v.kind==='line'),false);
 assert.ok(vis.limitations.some(x=>x.includes('sample')||x.includes('采样')));
});
test('Evo missing paired condition cannot manufacture comparison',()=>{
 const partial={...evo,results:evo.results.slice(0,3)};
 const vis=buildExperimentVisualization(partial,'evo-pair');
 assert.equal(vis.pairs.length,1);
 assert.equal(vis.summary.independentSeeds,1);
 assert.equal(vis.summary.averagePairedDifference,10);
 assert.match(vis.limitations.join(' '),/缺失|不完整/);
});
test('missing scientific samples remain gaps and keep original selection indices stable',()=>{
 const run={...pfl,plots:[{...pfl.plots[0],series:[{label:'Float64 observed',points:[[0,0.2],null,[2,0.4]]}]}]};
 const vis=buildExperimentVisualization(run,'sensitivity');
 assert.equal(vis.views[0].series[0].points.length,3);
 assert.equal(vis.views[0].series[0].points[1],null);
 assert.equal(pickEvidencePoint(vis,{plotIndex:0,seriesIndex:0,pointIndex:2}).y,0.4);
 assert.throws(()=>pickEvidencePoint(vis,{plotIndex:0,seriesIndex:0,pointIndex:1}),/真实|所选/);
});

test('invalid or foreign run result is not treated as trustworthy scientific evidence',()=>{
 assert.throws(()=>buildExperimentVisualization({runId:'a',experiment:'evo-pair',results:[]},'sensitivity'),/不匹配/);
 assert.throws(()=>buildExperimentVisualization({runId:'x',experiment:'sensitivity',plots:[{series:[{points:[[0,NaN]]}]}]},'sensitivity'),/有效|数据/);
 assert.throws(()=>buildExperimentVisualization({...evo,runId:''},'evo-pair'),/runId/);
});
