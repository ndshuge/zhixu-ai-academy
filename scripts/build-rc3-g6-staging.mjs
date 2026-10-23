// G6 pre-submission staging: whitelist only. No secrets, no participant data, no signatures.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=process.cwd(),src=path.join(root,'submission','rc3-20261013');
const stage=path.join(src,'AI学院-RC3-交付审核包-NOT-SUBMIT');
fs.mkdirSync(stage,{recursive:true});
const mapping=[
 ['submission/rc3-20261013/AI学院-RC3-作品介绍-9页-审核候选.pdf','作品介绍-审核候选.pdf'],
 ['video-studio/output/AI_Academy_RC3_Film_FinalReview.mp4','AI学院-4分钟演示-审核候选.mp4'],
 ['video-studio/audio/full.srt','AI学院-4分钟演示-中文字幕.srt'],
 ['video-studio/output/FULL_FILM_ACCEPTANCE_20261013.json','视频验收.json'],
 ['submission/rc3-20261013/PDF_ACCEPTANCE_20261013.json','PDF验收.json'],
 ['video-studio/output/SCENE_MANIFEST_20261013.json','分镜及证据来源.json']
];
const hashes=[];
for(const [input,name] of mapping){
 const source=path.join(root,input),dest=path.join(stage,name);
 if(!fs.existsSync(source))throw Error('Missing source '+input);
 fs.copyFileSync(source,dest);
 const content=fs.readFileSync(dest);
 const hash=crypto.createHash('sha256').update(content).digest('hex');
 hashes.push({name,bytes:content.length,sha256:hash,source:input});
}
const video=JSON.parse(fs.readFileSync('video-studio/output/FULL_FILM_ACCEPTANCE_20261013.json','utf8'));
const pdf=JSON.parse(fs.readFileSync('submission/rc3-20261013/PDF_ACCEPTANCE_20261013.json','utf8'));
const source=JSON.parse(fs.readFileSync('video-studio/capture/assets/REAL_DEMO_EVIDENCE.json','utf8'));
if(video.status!=='PASS'||pdf.status!=='PASS'||source.humanStudents!==0||
 hashes.find(x=>x.name.endsWith('.mp4'))?.sha256!==video.sha256||
 hashes.find(x=>x.name.endsWith('.pdf'))?.sha256!==pdf.sha256)throw Error('Media/PDF source hashes disagree');
const forbidden=/(\.env|\.key$|\.pem$|id_rsa|credential|secret|token|api[_-]?key|\.sqlite|pi[_-]?session|student[_-]?records)/i;
for(const row of hashes)if(forbidden.test(row.name))throw Error('Unsafe filename '+row.name);
const note=`# AI学院RC3｜仅供本人审核，NOT SUBMIT
制作时间：2026-10-13
作品：AI学院，AI+高等教育 / AI+教学
真实学生参与人数：0
网页演示：自动化合成学生输入；规划界面为本机规则模式；没有实时LLM请求。
历史模型测试：1次真实请求包含8组合成方向题，不能作为真人教育效果证明。
PFL：真实科学内核计算；视频及PDF中的两条151点曲线由本次实际记录参数重新计算。
文件：9页PDF、4分钟H264/AAC MP4、中文字幕SRT、验收JSON与分镜证据。
注意：此包不包含官方要求的两份已签字扫描PDF；负责人姓名、学校/教师资格和官方提交平台回执尚待本人核对。
禁止将此ZIP直接作为最终官方投稿。不得代签，不得虚构学习效果或上传回执。
官方模板原件（只读）：E:\\CHATGPT\\projects\\ai-education-competition-2026\\official-materials\\附件1：参赛作品简介.docx 和 附件2：参赛承诺书.docx
正式命名：赛道名称+作品名称+负责人姓名+学校；未取得用户本人正式确认姓名，因此暂不写入私人身份。
`;
fs.writeFileSync(path.join(stage,'READ_ME_FIRST_NOT_SUBMIT.md'),note,'utf8');
hashes.push({name:'READ_ME_FIRST_NOT_SUBMIT.md',bytes:Buffer.byteLength(note),sha256:crypto.createHash('sha256').update(note).digest('hex')});
const summary={status:'PASS_WITH_BLOCKERS',kind:'WHITELIST_PRE_SUBMISSION_ONLY',
 generatedAt:new Date().toISOString(),items:hashes,
 sumBytes:hashes.reduce((a,b)=>a+b.bytes,0),
 requiredBeforeSubmission:[
 '本人检查9页PDF和4分钟视频的旁白、字幕、科学论述与真实性',
 '官方附件1作品简介填写并本人签字扫描为PDF',
 '官方附件2承诺书填写并本人签字扫描为PDF',
 '核对学生团队是否必须包含教师，以及负责人/队伍资格',
 '确认官方提交页面、文件命名、上传和真实回执',
 '实际提交前将NOT-SUBMIT审核候选重命名为官方格式'
 ],realStudentParticipants:0,realRemoteLLMCallsDuringRecording:0,
 noCredentialsIncluded:true,officiallySubmitted:false};
fs.writeFileSync(path.join(src,'G6_STAGING_AUDIT_20261013.json'),JSON.stringify(summary,null,2)+'\n');
console.log('RC3_G6_STAGING_PASS',JSON.stringify({files:hashes.length,bytes:summary.sumBytes,blockers:summary.requiredBeforeSubmission.length}));
