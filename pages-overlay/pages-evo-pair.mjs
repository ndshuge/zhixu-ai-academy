// Browser-port of the project's published EvoWorld engine; actual independent world steps, not prefilled output.
import {World} from './labs/evo/src/core/world.mjs';
import {DEFAULTS,ENGINE_VERSION} from './labs/evo/src/core/config.mjs';
const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
export async function runEvoPair(seed=73129){
 const s=Number(seed);
 if(!Number.isInteger(s)||s<0||s>4294000000)throw Error('EvoWorld 种子范围不合法');
 const seedList=[s,(s+104729)>>>0],results=[];
 const common={...DEFAULTS,width:18,height:14,initialPopulation:24,maxPopulation:90,
 controller:'mixed',environment:'stable',sampleEvery:20,historyLimit:200};
 for(const independentSeed of seedList){
  for(const cooperation of [true,false]){
   const world=new World({...common,cooperation,seed:independentSeed});
   let populationIntegral=0;
   for(let i=0;i<200;i++){
    world.step();
    populationIntegral+=world.agents.length;
    if(i%45===44)await yieldTask();
   }
   const end=world.metrics();
   results.push({seed:independentSeed,condition:cooperation?'合作开启':'合作关闭',
    meanPopulation:populationIntegral/200,endingPopulation:end.population,
    balanceError:end.balanceError,digest:world.digest()});
  }
 }
 return {experiment:'evo-pair',engine:'EvoWorld 浏览器真实世界模拟',
   engineVersion:ENGINE_VERSION+'-browser',adapterSha256:null,
   condition:{compare:'cooperation',repeats:2,ticks:200,baseSeed:s},
   results,warning:'每个处理条件仅运行两个固定种子的独立世界。结果属于本模拟模型，不能据此证明普遍生态规律。'};
}
