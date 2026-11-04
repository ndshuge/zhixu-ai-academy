import test from 'node:test';
import assert from 'node:assert/strict';
import {settleLessonStep} from '../apple-editions/ai-academy-v5/v5-lesson-motion.js';
function specimen(){
 const animations=[],focuses=[];
 const paper={dataset:{},animate:(frames,options)=>{animations.push({frames,options});return {finished:Promise.resolve()}}};
 const title={setAttribute:(k,v)=>focuses.push([k,v]),focus:opts=>focuses.push(['focus',opts])};
 const stage={querySelector:selector=>selector==='.learning-paper'?paper:selector==='.page-intro h1'?title:null};
 return {paper,animations,focuses,stage};
}
test('learning-stage forward uses only the article, not Dock or the full reading screen',()=>{
 const s=specimen(),scroll=[];
 assert.equal(settleLessonStep(s.stage,{before:0,after:1,reduced:false,scrollTop:()=>scroll.push('top')}),true);
 assert.equal(s.paper.dataset.stepDirection,'forward');
 assert.equal(s.animations.length,1);
 assert.match(JSON.stringify(s.animations[0].frames[0]),/translate3d/);
 assert.equal(s.animations[0].options.fill,'none');
 assert.deepEqual(scroll,['top']);
 assert.ok(s.focuses.some(([action])=>action==='focus'));
});
test('backwards step travels the opposite direction',()=>{
 const s=specimen();
 settleLessonStep(s.stage,{before:3,after:1,reduced:false,scrollTop:()=>{}});
 assert.equal(s.paper.dataset.stepDirection,'backward');
 assert.ok(s.animations[0].frames[0].transform.includes('-'));
});
test('no animation for unchanged step or initial render',()=>{
 const s=specimen();
 assert.equal(settleLessonStep(s.stage,{before:1,after:1,reduced:false}),false);
 assert.equal(settleLessonStep(s.stage,{before:null,after:0,reduced:false}),false);
 assert.equal(s.animations.length,0);
 assert.deepEqual(s.focuses,[]);
});
test('reduced motion keeps scroll/focus navigation but never calls animate',()=>{
 const s=specimen(),scroll=[];
 assert.equal(settleLessonStep(s.stage,{before:0,after:3,reduced:true,scrollTop:()=>scroll.push(1)}),true);
 assert.equal(s.animations.length,0);
 assert.equal(scroll.length,1);
 assert.ok(s.focuses.length>0);
});
