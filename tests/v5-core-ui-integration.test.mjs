import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCore} from '../apple-editions/ai-academy-v5/v5-core-ui.js';
const base={experimentId:'sensitivity',phase:'pretest',question:{prompt:'哪个变量变化？',options:['初值','不变']},progress:{phaseIndex:1,totalPhases:7},busy:false};
test('science learning has explicit retry UI when the Original iframe is temporarily unavailable',()=>{
 const html=renderCore({phase:'idle',experimentId:'evo-pair'});
 assert.match(html,/data-action="retry-core"/);
 assert.match(html,/原版科学引擎/);
 assert.doesNotMatch(html,/data-core-form="pre"/);
});
test('core learning UI pretest never preselects or leaks answers',()=>{
 const html=renderCore(base);
 assert.match(html,/data-core-form="pre"/);
 assert.match(html,/type="radio"/);
 assert.doesNotMatch(html,/checked/);
 assert.doesNotMatch(html,/attemptToken|correctAnswer/);
});
test('core UI requires explicit button before real science run and model sharing',()=>{
 const ready=renderCore({...base,phase:'ready',question:null,prediction:{text:'观察增长规律',params:{r:3.9}}});
 assert.match(ready,/data-core-action="run"/);
 assert.doesNotMatch(ready,/data-core-action="approve"/);
 const coach=renderCore({...base,phase:'predict',question:null});
 assert.match(coach,/name="shareApproved"/);
 assert.doesNotMatch(coach,/name="shareApproved" checked/);
});
test('only actual evidence receives evidence identity and selectable original points',()=>{
 const plot={kind:'line',plotIndex:0,title:'实际轨迹',xLabel:'步',yLabel:'x',series:[{seriesIndex:0,label:'第一条',points:[[0,0.2],[1,0.7],null,[3,0.4]]}]};
 const html=renderCore({...base,phase:'evidence',question:null,experiment:{runId:'run-real',metrics:[]},visualization:{sourceRunId:'run-real',views:[plot],metrics:[],limitations:[],evidence:true}});
 assert.match(html,/run-real/);
 assert.match(html,/data-core-action="point"/);
 assert.doesNotMatch(html,/data-point="2"/);
 assert.match(html,/path/);
});
test('EvoWorld pairs only show actual seeded comparisons and never made-up curves',()=>{
 const html=renderCore({...base,phase:'evidence',experimentId:'evo-pair',question:null,experiment:{runId:'evo-real',metrics:[]},visualization:{sourceRunId:'evo-real',views:[],pairs:[{seed:42,cooperationOn:{meanPopulation:30},cooperationOff:{meanPopulation:20},deltaMeanPopulation:10}],limitations:[],metrics:[],evidence:true}});
 assert.match(html,/data-core-action="pair"/);
 assert.match(html,/data-seed="42"/);
 assert.doesNotMatch(html,/<svg class="core-line"/);
});
test('complete phase shows actual transfer result without falsely claiming mastery',()=>{
 const html=renderCore({...base,phase:'complete',question:null,transfer:{gradedResult:'incorrect',feedback:'需要比较'}});
 assert.match(html,/需要比较/);
 assert.doesNotMatch(html,/已经掌握|成绩提升/);
});
