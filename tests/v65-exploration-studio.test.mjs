import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {renderCore} from '../apple-editions/ai-academy-v5/v5-core-ui.js';
import {buildObservedPath} from '../apple-editions/ai-academy-v5/v6-exploration-studio.js';
const root=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=f=>readFileSync(new URL(f,root),'utf8');
const line={plotIndex:0,kind:'line',title:'真实轨迹',xLabel:'迭代步',yLabel:'观测值',series:[{seriesIndex:0,label:'轨迹 A',points:[[0,0.1],[1,0.2],null,[3,0.5]]},{seriesIndex:1,label:'轨迹 B',points:[[0,0.1],[1,0.3],[2,0.4],[3,0.7]]}]};
const base={experimentId:'sensitivity',phase:'evidence',prediction:{text:'我预计两条轨迹会一直靠近',params:{r:3.9,x0:.217,steps:150,logDelta:-10}},
visualization:{evidence:true,sourceRunId:'test-only-run-1',metrics:[{label:'差值',value:0.32,unit:''}],views:[line],pairs:[],limitations:['不允许外推到现实']},reflection:null,mentor:null,comparison:null,coaching:null};
test('PFL studio keeps real graph and real-point scrubber with missing gaps',()=>{
 const html=renderCore(base);
 assert.match(html,/class="core-observatory core-evidence"/);
 assert.match(html,/data-studio-scrub/);
 assert.match(html,/data-studio-samples=/);
 assert.match(html,/studio-cursor-line/);
 assert.match(html,/实验详情/);
 assert.match(html,/test-only-run-1/);
 assert.match(html,/data-core-action="point"/);
 assert.match(html,/data-core-form="mentor"/);
 assert.match(html,/data-core-form="reflection"/);
 assert.match(html,/data-core-form="coach"/);
});
test('scrubbing reveals only observed points; missing value cuts the path',()=>{
 const points=[[0,0.1],[1,0.2],null,[3,0.5],[4,0.7]];
 const bounds={minX:0,maxX:4,minY:0,maxY:1};
 const early=buildObservedPath(points,bounds,1);
 const later=buildObservedPath(points,bounds,4);
 assert.ok(early.startsWith('M'));
 assert.equal((early.match(/L/g)||[]).length,1);
 assert.equal((later.match(/M/g)||[]).length,2,'a null observation must interrupt the trace');
 assert.equal((later.match(/L/g)||[]).length,2,'only two observed segments may be connected');
});
test('EvoWorld uses its actual paired seed results without fabricated timeline',()=>{
 const evo={...base,experimentId:'evo-pair',visualization:{evidence:true,sourceRunId:'evo-test',metrics:[],limitations:[],views:[{kind:'grouped-bar',title:'实际世界对照',categories:['12'],series:[{label:'开启',points:[[0,23]]},{label:'关闭',points:[[0,18]]}]}],pairs:[{seed:12,cooperationOn:{meanPopulation:23},cooperationOff:{meanPopulation:18}}]}};
 const html=renderCore(evo);
 assert.match(html,/data-core-action="pair"/);
 assert.match(html,/data-seed="12"/);
 assert.doesNotMatch(html,/data-studio-scrub/);
 assert.match(html,/独立/);
});
test('final learning evidence shows original prediction, recorded reflection, and real transfer score',()=>{
 const html=renderCore({...base,phase:'complete',reflection:{text:'实际观察表明两条轨迹后来分离',saved:true},
 transfer:{gradedResult:'correct',feedback:'已给出原版评价'}});
 assert.match(html,/探索记录/);
 assert.match(html,/我预计两条轨迹会一直靠近/);
 assert.match(html,/实际观察表明两条轨迹后来分离/);
 assert.match(html,/已给出原版评价/);
 assert.match(html,/data-core-action="restart"/);
 assert.doesNotMatch(html,/已完全掌握/);
});
test('pretest remains unselected; course phases keep existing actions',()=>{
 const html=renderCore({experimentId:'sensitivity',phase:'pretest',question:{prompt:'初值会怎样？',options:['相同','不同']}});
 assert.equal((html.match(/type="radio"/g)||[]).length,2);
 assert.doesNotMatch(html,/\bchecked\b/);
 const pending=renderCore({...base,phase:'ready'});
 assert.match(pending,/data-core-action="run"/);
});
test('learning CSS/JS are content scoped, no Dock or other main route mutations',()=>{
 const css=read('v6-exploration-studio.css'),js=read('v6-exploration-studio.js'),html=read('index.html');
 assert.match(html,/v6-exploration-studio.css/);
 assert.match(js,/data-studio-scrub/);
 assert.doesNotMatch(css,/#mobile-tabs|\.toolbar-trailing|#doctor-panel|body\[data-focus/);
 assert.match(css,/#screen \.core-learning/);
 assert.doesNotMatch(js,/bridge\.|\.runExperiment\(|localStorage|fetch\(/);
});
