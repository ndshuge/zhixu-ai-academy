import { IndexedWorld as World } from '../science/indexed-world.mjs';
import { Observer } from '../science/observer.mjs';
import { explainRun } from '../science/report.mjs';
import { makeExploration,completeExploration } from '../science/experience.mjs';
let exploration=null;
let world=new World(),observer=new Observer(world),selected=null,running=true,speed=10,accumulator=0,last=performance.now(),lastView=0,perfTick=0,perfTime=last,actualSpeed=0;
function advance(){world.step();observer.advance(world);}
function send(force=false){const now=performance.now();if(!force&&now-lastView<100)return;lastView=now;
 if(now-perfTime>=500){actualSpeed=(world.tick-perfTick)/(now-perfTime)*1000*world.config.secondsPerTick;perfTime=now;perfTick=world.tick;}
 const view=world.view(selected);view.history=view.history.slice(-300);view.observation=observer.view(selected);view.messages=world.messages;
 for(let i=0;i<view.agents.length;i++){const a=world.agents[i];Object.assign(view.agents[i],{direction:a.brain?.outputs.slice(0,2)||[0,0],cooperation:a.genome.traits.cooperation,age:a.age,birthTick:a.birthTick,parentId:a.parentId,harvested:a.harvested,traits:{...a.genome.traits}});}
 postMessage({type:'view',view,running,speed,actualSpeed});
}
onmessage=e=>{const m=e.data;try{
 if(m.type==='reset'){exploration=null;world=new World(m.config);observer=new Observer(world);selected=null;accumulator=0;perfTick=0;perfTime=performance.now();actualSpeed=0;last=performance.now();}
 if(m.type==='explore'){
  const record=makeExploration(m.id,m.prediction);
  if(world.tick!==0||JSON.stringify(world.config)!==JSON.stringify(record.configuration))throw new Error('世界条件已变化，请重新载入推荐条件再预测。');
  exploration=record;running=true;speed=10;accumulator=0;last=performance.now();
 }
 if(m.type==='explore-cancel'&&exploration){const record=completeExploration(exploration,explainRun(observer.export(world),exploration.baseline,{prediction:exploration.prediction}),{partial:true});exploration=null;running=false;postMessage({type:'exploration-complete',record});}
 if(m.type==='running'&&!m.value&&exploration){const record=completeExploration(exploration,explainRun(observer.export(world),exploration.baseline,{prediction:exploration.prediction}),{partial:true});exploration=null;postMessage({type:'exploration-complete',record});}
 if(m.type==='running'){running=!!m.value;accumulator=0;last=performance.now();}
 if(m.type==='speed'){if(![1,5,10,30,100].includes(m.value))throw new Error('Invalid playback speed');speed=m.value;accumulator=0;}
 if(m.type==='step'&&!running)advance();
 if(m.type==='select'){selected=m.id;observer.select(selected);}
 if(m.type==='snapshot')postMessage({type:'snapshot',data:world.snapshot()});
 if(m.type==='history')postMessage({type:'history',data:world.history});
 if(m.type==='explain')postMessage({type:'explanation',report:explainRun(observer.export(world),undefined,m.expectation)});
 if(m.type==='local-record')postMessage({type:'local-record',data:observer.export(world)});
 if(m.type==='restore'){exploration=null;world=World.restore(m.data);observer=new Observer(world,{origin:'snapshot'});running=false;selected=null;accumulator=0;perfTick=world.tick;perfTime=performance.now();actualSpeed=0;postMessage({type:'restored'});}
 send(true);
 }catch(error){postMessage({type:'error',message:error.message});}};
function pump(){const now=performance.now(),dt=Math.min(150,now-last);last=now;
 try{if(running&&exploration){accumulator=Math.min(500,accumulator+dt/1000/world.config.secondsPerTick*speed);const deadline=now+12;while(accumulator>=1&&world.tick<exploration.ticks){advance();accumulator--;if(performance.now()>deadline)break;}if(world.tick===exploration.ticks){const record=completeExploration(exploration,explainRun(observer.export(world),exploration.baseline,{prediction:exploration.prediction}));exploration=null;running=false;postMessage({type:'exploration-complete',record});}}
 else if(running){accumulator=Math.min(500,accumulator+dt/1000/world.config.secondsPerTick*speed);const deadline=now+12;let done=0;while(accumulator>=1){advance();accumulator--;done++;if(done%2===0&&performance.now()>deadline)break;}}send();}
 catch(error){running=false;exploration=null;postMessage({type:'error',message:error.message});}
 setTimeout(pump,running&&accumulator>=1?0:4);
}
pump();
