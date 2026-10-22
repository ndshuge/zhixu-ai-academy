const experiment=new URLSearchParams(location.search).get('experiment');
if(experiment==='evo-pair')document.querySelector('[data-exp="evo-pair"]')?.click();
const resume=()=>{try{const data=JSON.parse(localStorage.getItem('ai-academy-learning-v02'));const latest=data?.events?.findLast(e=>e.kind==='lab_observation');if(latest){const node=document.getElementById('exploration-resume');node.hidden=false;node.textContent='最近探索已留证：'+(latest.payload.lab==='evo'?'EvoWorld':'PFL')+' · '+new Date(latest.occurredAt).toLocaleString()+'。继续本页预测与受控实验，探索观察不计入客观题成绩。'}}catch{}};resume();
