import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.window={addEventListener(){}};
const {learn}=await import('../apple-editions/ai-academy-v5/views.js');
const lesson=step=>({
 experiment:'sensitivity',step,highest:step,preIds:['p1'],preIndex:0,preResults:[],
 question:{itemId:'p1',prompt:'判断',options:['是','否']},grade:null,preChoice:null,
 prediction:'我的预测',run:{metrics:[],plots:[]},mentor:null,transferIds:['t1'],
 transferIndex:0,transferResults:[],transfer:{itemId:'t1',prompt:'迁移判断',options:['是','否']},
 transferGrade:null,transferChoice:null
});
test('each learning stage has its own truthful page title instead of saying start on completed stages',()=>{
 const headings=['从判断开始','写下你的预测','读懂实验结果','验证你的理解'];
 headings.forEach((heading,step)=>{
  const html=learn({lesson:lesson(step)});
  assert.match(html,new RegExp('<header class="page-intro"><h1>'+heading+'</h1>'));
  assert.equal((html.match(/<header class="page-intro">/g)||[]).length,1);
  if(step>0)assert.doesNotMatch(html,/<h1>从判断开始<\/h1>/);
 });
});
test('stage title and progress replace duplicate numbered eyebrow inside the reading paper',()=>{
 [0,1,2,3].forEach(step=>{
  const html=learn({lesson:lesson(step)});
  assert.doesNotMatch(html,/class="lesson-eyebrow">0[1-4] ·/);
  assert.match(html,/class="progress-strip" role="progressbar"/);
  assert.match(html,/<article class="learning-paper">/);
 });
});
test('transfer questions do not carry the pretest answer secrecy disclaimer',()=>{
 const pre=learn({lesson:lesson(0)}),transfer=learn({lesson:lesson(3)});
 assert.match(pre,/前测提交后暂不显示正确答案/);
 assert.doesNotMatch(transfer,/前测提交后暂不显示正确答案/);
 assert.match(transfer,/迁移.*解析/);
});
test('feedback after a submitted transfer names the result and exposes an optional explanation',()=>{
 const l=lesson(3);l.transferGrade={studentAnswer:0,gradedResult:'correct',feedback:'独立变量'};
 const html=learn({lesson:l});
 assert.match(html,/data-quiz-state="correct"/);
 assert.match(html,/查看解析/);
 assert.match(html,/独立变量/);
});
