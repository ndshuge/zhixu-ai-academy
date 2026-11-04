import test from 'node:test';
import assert from 'node:assert/strict';
import {computePfl,computeEvo} from '../server.mjs';
import {buildExperimentVisualization} from '../apple-editions/ai-academy-v5/learning-core/visual-evidence.mjs';

test('actual Physics Frontier Lab computed tracks can be rendered without synthetic frames',()=>{
 const real=computePfl({experiment:'sensitivity',params:{r:3.9,x0:0.217,steps:150,logDelta:-10}});
 const vis=buildExperimentVisualization({runId:'real-pfl-test',...real},'sensitivity');
 assert.equal(real.engine,'Physics Frontier Lab');
 assert.equal(vis.views[0].series[0].points.length,151);
 assert.deepEqual(vis.views[0].series[0].points,real.plots[0].series[0].points);
 assert.equal(vis.engineVersion,real.engineVersion);
 assert.equal(vis.views[0].xLabel,real.plots[0].xLabel);
});
test('actual EvoWorld engine paired worlds can be visualized with correct pair sample size',async()=>{
 const real=await computeEvo({seed:12023});
 const vis=buildExperimentVisualization({runId:'real-evo-test',...real},'evo-pair');
 assert.equal(real.engine,'EvoWorld');
 assert.equal(vis.pairs.length,2);
 assert.equal(vis.summary.independentSeeds,2);
 assert.equal(vis.views.length,2); // no fabricated time-series on server path
 assert.equal(vis.views.some(v=>v.kind==='line'),false);
 assert.equal(vis.summary.significanceClaim,false);
 const n=vis.pairs.reduce((a,p)=>a+p.deltaMeanPopulation,0)/2;
 assert.equal(vis.summary.averagePairedDifference,Math.round(n*1e10)/1e10);
});
