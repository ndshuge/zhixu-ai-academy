/**
 * G2 pre-registered live pilot. Frozen synthetic science inputs only.
 * Real scientific evidence comes from pinned PFL; no student records or keys.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {computePfl} from '../server.mjs';
import {buildSafeProposalChoices} from '../llm-science-planner.mjs';
import {verifyProposalAgainstRun} from '../agent-planner.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=join(root,'evidence','rc3-20261012','g2-live');
await mkdir(out,{recursive:true});
const situations=[
 {id:'S01',experiment:'sensitivity',params:{r:3.9,x0:.217,logDelta:-10,steps:150},direction:-1,goal:'只减小初值扰动 δ，观察两轨达到分离阈值的时刻是否推迟。'},
 {id:'S02',experiment:'sensitivity',params:{r:3.9,x0:.217,logDelta:-10,steps:150},direction:1,goal:'只增大初值扰动 δ，观察分离阈值到达时间是否提前。'},
 {id:'S03',experiment:'sensitivity',params:{r:3.7,x0:.311,logDelta:-7,steps:180},direction:-1,goal:'保持其余条件不变，减小 δ 再比较实验结果。'},
 {id:'S04',experiment:'sensitivity',params:{r:3.7,x0:.311,logDelta:-7,steps:180},direction:1,goal:'保持其余条件不变，增大 δ 再比较实验结果。'},
 {id:'L01',experiment:'logistic',params:{r:3.6,x0:.217,steps:160},direction:-1,goal:'只减小映射参数 r，观察非线性迭代长期轨迹。'},
 {id:'L02',experiment:'logistic',params:{r:3.6,x0:.217,steps:160},direction:1,goal:'只增大映射参数 r，观察非线性迭代长期轨迹。'},
 {id:'L03',experiment:'logistic',params:{r:3.8,x0:.183,steps:180},direction:-1,goal:'固定其余变量，将 r 降低，比较轨道规律。'},
 {id:'L04',experiment:'logistic',params:{r:3.8,x0:.183,steps:180},direction:1,goal:'固定其余变量，将 r 提高，比较轨道规律。'}
];
const display=[],scoring=[];
for(const item of situations){
 const original=computePfl({experiment:item.experiment,params:item.params});
 const previous={result:original,prediction:'我还不确定这些差异来自初值还是参数；希望独立控制变量检验。',depth:0};
 const choices=buildSafeProposalChoices(previous,{goal:item.goal});
 const field=choices[0].proposal.changes[0].field,before=choices[0].proposal.changes[0].from;
 const alternatives=choices.map(o=>({choice:o.id,field,to:o.proposal.changes[0].to,
  studyQuestion:o.proposal.studyQuestion,
  verified:verifyProposalAgainstRun(previous,o.proposal)}));
 if(!alternatives.every(x=>x.verified))throw Error('Unvalidated candidate '+item.id);
 const reference=alternatives.filter(x=>Math.sign(x.to-before)===item.direction);
 if(reference.length!==1)throw Error('Cannot produce unambiguous held-out preference '+item.id);
 display.push({id:item.id,experiment:item.experiment,goal:item.goal,
  studentPrediction:previous.prediction,originalCondition:original.condition,
  actualScientificMetrics:(original.metrics||[]).slice(0,5).map(m=>({label:m.label,value:m.value,unit:m.unit})),
  candidatePlans:alternatives.map(({verified,...rest})=>rest)});
 scoring.push({id:item.id,expectedChoice:reference[0].choice,
  ruleChoice:'A',goalDirection:item.direction,field,before,
  choices:alternatives.map(x=>({choice:x.choice,to:x.to}))});
}
const prompt='请担任科学教学智能体，只针对给定的科学计算结果和已通过服务器校验的A/B候选实验，按学生目标选择更符合控制变量方向的一个。\n'+
 '不要运行工具、修改文件、访问网络或索取任何信息。只输出如下格式的原始JSON：'+
 '{"choices":[{"id":"S01","choice":"A"},...] }。必须覆盖每个ID恰好一次，每项只允许A或B，无额外字段或解释。科学结果来自确定性PFL；学生预测为合成样例。\n'+
 JSON.stringify(display);
const hash=createHash('sha256').update(JSON.stringify({display,scoring})).digest('hex');
await writeFile(join(out,'frozen-cases.json'),JSON.stringify({
 protocol:'RC3-G2-live-synthetic-v1',createdAt:new Date().toISOString(),
 inputHash:hash,reference:scoring,display,modelCallsBudgetMax:1,
 realParticipants:0,externalSpendingLimitCNY:5,
 notes:['Frozen BEFORE the real model call','Reference is signed direction of the requested single variable, not a claim of general teaching quality']
},null,2)+'\n');
await writeFile(join(out,'live-prompt.txt'),prompt+'\n');
console.log('RC3_LIVE_TEST_PREPARED',JSON.stringify({cases:display.length,inputHash:hash,promptChars:prompt.length,ruleCorrect:scoring.filter(x=>x.ruleChoice===x.expectedChoice).length,oracleCorrect:scoring.length,modelCallsMax:1}));
