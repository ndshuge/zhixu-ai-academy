import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// views.js imports the V5 native API bridge, which exposes a window hook in browsers.
globalThis.window={addEventListener(){}};
const {today,learn}=await import('../apple-editions/ai-academy-v5/views.js');
const read=(file)=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+file,import.meta.url),'utf8');
const base=()=>({
 experiment:'sensitivity',step:0,highest:0,preIds:['p1'],preIndex:0,preResults:[],
 question:{itemId:'p1',prompt:'先选择一项',options:['选项A','选项B']},
 grade:null,preChoice:null,prediction:'',run:null,mentor:null,transferIds:['t1'],
 transferIndex:0,transferResults:[],transfer:{itemId:'t1',prompt:'迁移判断',options:['选项甲','选项乙']},
 transferGrade:null,transferChoice:null
});
const render=(l)=>learn({lesson:l});

test('no preselected radio and an explicit unselected semantic quiz state',()=>{
 const markup=render(base());
 assert.match(markup,/data-quiz-state="unselected"/);
 assert.equal((markup.match(/type="radio"/g)||[]).length,2);
 assert.doesNotMatch(markup,/checked(?:\s|>)/);
});
test('draft selection is restored visually but not yet submitted or scored',()=>{
 const l=base();l.preChoice=1;
 const markup=render(l);
 assert.match(markup,/data-quiz-state="selected"/);
 assert.match(markup,/value="1"[^>]*checked/);
 assert.match(markup,/data-answer-state="selected"/);
 assert.doesNotMatch(markup,/回答正确|这道题需要复习/);
});
test('submitted pretest is acknowledged without revealing score or answer',()=>{
 const l=base();l.grade={studentAnswer:0,gradedResult:'incorrect',feedback:'隐藏的评分内容'};
 const markup=render(l);
 assert.match(markup,/data-quiz-state="submitted"/);
 assert.match(markup,/初始判断已记录/);
 assert.doesNotMatch(markup,/隐藏的评分内容|data-answer-state="incorrect"|回答正确/);
});
test('transfer shows explicit correct/wrong outcome and optional analysis',()=>{
 const l=base();l.step=3;
 l.transferGrade={studentAnswer:0,gradedResult:'incorrect',feedback:'应该先观察变量关系。'};
 const wrong=render(l);
 assert.match(wrong,/data-quiz-state="incorrect"/);
 assert.match(wrong,/data-answer-state="incorrect"/);
 assert.match(wrong,/查看解析/);
 assert.match(wrong,/应该先观察变量关系/);
 l.transferGrade={studentAnswer:1,gradedResult:'correct',feedback:'正确理解了变量关系。'};
 const correct=render(l);
 assert.match(correct,/data-quiz-state="correct"/);
 assert.match(correct,/data-answer-state="correct"/);
 assert.match(correct,/回答正确/);
});
test('home provides real lesson continuation without inventing progress',()=>{
 const l=base();l.step=1;l.highest=1;
 const markup=today({bridge:{summary:{}},lesson:l});
 assert.match(markup,/下一站学习/);
 assert.match(markup,/data-action="resume-learning"/);
 assert.match(markup,/提出预测/);
});
test('selection and resume use session state without changing science engine or Dock',()=>{
 const app=read('v4.js'),css=read('v5-learning-continuity.css'),html=read('index.html');
 assert.match(app,/preChoice/);assert.match(app,/transferChoice/);
 assert.match(app,/resume-learning/);
 assert.match(app,/sessionStorage\.setItem\('zx-v4-lesson'/);
 assert.match(css,/#screen/);
 assert.doesNotMatch(css,/#mobile-tabs|\.mobile-tabbar|\.tab-item|\.zx-progressive-underlay/);
 assert.match(html,/v5-learning-continuity\.css/);
});
