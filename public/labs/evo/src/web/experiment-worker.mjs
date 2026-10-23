import { planExperiment,prepareRun,advanceRun,finishRun,analyze } from '../core/experiments.mjs';
import { runPair } from '../science/report.mjs';
let token=0;
onmessage=async e=>{const m=e.data;if(m.type==='cancel'){token++;postMessage({type:'cancelled'});return;}
  if(m.type==='pair'){const mine=++token;try{const report=await runPair(m.plan,{cancelled:()=>mine!==token,progress:data=>postMessage({type:'pair-progress',...data}),yieldWork:()=>new Promise(r=>setTimeout(r,0))});if(report&&mine===token)postMessage({type:'pair-result',report});}catch(error){if(mine===token)postMessage({type:'error',message:error.message});}return;}if(m.type!=='run')return;
  const mine=++token;try{const plan=planExperiment(m.id,m.options),runs=[];let completed=0;const total=plan.arms.length*plan.repeats;
    for(let i=0;i<plan.seeds.length;i++)for(const arm of i%2?[...plan.arms].reverse():plan.arms){const start=performance.now(),w=prepareRun(plan,arm,plan.seeds[i]);
      for(let t=0;t<plan.ticks;t+=40){if(mine!==token)return;advanceRun(w,Math.min(40,plan.ticks-t));postMessage({type:'progress',completed,total,within:Math.min(1,(t+40)/plan.ticks),arm:arm.label,seed:plan.seeds[i]});await new Promise(r=>setTimeout(r,0));}
      const row=finishRun(w,plan,arm,plan.seeds[i],performance.now()-start);if(Math.abs(row.balanceError)>1e-5)throw new Error('Energy audit failed');runs.push(row);completed++;
    }if(mine===token)postMessage({type:'result',report:analyze(plan,runs)});
  }catch(error){if(mine===token)postMessage({type:'error',message:error.message});}
};
