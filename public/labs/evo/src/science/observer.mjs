// Read-only observation of the unchanged kernel. No random calls, no state writes.
export const OBSERVER_VERSION='evoworld-observer-0.2.0';
const boundedPush=(list,item,max)=>{list.push(item);if(list.length>max){list.shift();return 1;}return 0;};
const point=a=>({id:a.id,x:a.x,y:a.y,energy:a.energy,age:a.age,action:a.action,harvested:a.harvested,generation:a.generation,parentId:a.parentId,controller:a.controller});
export function genomeDifference(parent,child){
 if(!parent||!child)return null;
 const traits=Object.keys(child.traits).map(key=>({key,before:parent.traits[key],after:child.traits[key],delta:child.traits[key]-parent.traits[key]}));
 const weights=child.weights.map((after,index)=>({index,before:parent.weights[index],after,delta:after-parent.weights[index]})).filter(x=>x.delta!==0);
 return {traits,changedTraits:traits.filter(x=>x.delta!==0).length,weights,changedWeights:weights.length};
}
export class Observer {
 constructor(world,{eventLimit=2048,frameLimit=600,archiveLimit=2000,origin='fresh'}={}){
  this.limits={eventLimit,frameLimit,archiveLimit};this.events=[];this.frames=[];this.archives=new Map();
  this.dropped={events:0,frames:0,archives:0};this.selectedId=null;this.startTick=world.tick;this.startMetrics=world.metrics();this.initialConfig={...world.config};
  this.origin=origin;this.initialSnapshot=world.snapshot();
  this.lastTick=world.tick;this.integral=0;this.minPopulation=world.agents.length;this.maxPopulation=world.agents.length;this.lastClimate=world.climate().phase;
  this.previous=new Map(world.agents.map(a=>[a.id,{...point(a),ref:a}]));this.genomes=new Map();
  for(const a of world.agents)this.archive(a,world.tick===0&&origin==='fresh'?'founder':'observed');
 }
 archive(a,kind){
  if(this.archives.has(a.id))return;
  const record={...point(a),birthTick:a.birthTick,observedFrom:kind==='birth'?a.birthTick:this.lastTick,deathTick:null,genome:structuredClone(a.genome)};
  this.archives.set(a.id,record);this.genomes.set(a.id,a.genome);
  if(this.archives.size>this.limits.archiveLimit){const first=this.archives.keys().next().value;this.archives.delete(first);this.genomes.delete(first);this.dropped.archives++;}
  if(kind==='founder')this.add({tick:this.startTick,type:'birth',id:a.id,related:a.parentId,x:a.x,y:a.y,detail:'创始个体'});
 }
 add(event){this.dropped.events+=boundedPush(this.events,event,this.limits.eventLimit);}
 select(id){this.selectedId=id;}
 advance(world){
  if(world.tick!==this.lastTick+1)throw new Error('Observer requires every consecutive authoritative tick');
  const c=world.config,now=new Map(world.agents.map(a=>[a.id,a])),harvestGroups=new Map();
  this.integral+=world.agents.length;this.minPopulation=Math.min(this.minPopulation,world.agents.length);this.maxPopulation=Math.max(this.maxPopulation,world.agents.length);
  const phase=world.climate().phase;
  if(phase!==this.lastClimate){this.add({tick:world.tick,type:'climate',id:null,detail:world.climate().label});this.lastClimate=phase;}
  for(const a of world.agents){
   const old=this.previous.get(a.id);
   if(!old){this.archive(a,'birth');const parent=this.archives.get(a.parentId);this.add({tick:world.tick,type:'birth',id:a.id,related:a.parentId,x:a.x,y:a.y,mutation:genomeDifference(parent?.genome,a.genome)});}
   else{
    const gain=a.harvested-old.harvested;
    if(gain>0){const cell=world.cell(a.x,a.y);if(!harvestGroups.has(cell))harvestGroups.set(cell,[]);harvestGroups.get(cell).push(a.id);
     if(a.id===this.selectedId||a.action==='协作采集')this.add({tick:world.tick,type:a.action==='协作采集'?'cooperation':'harvest',id:a.id,x:a.x,y:a.y,amount:gain,detail:'本tick总采集量；包含可能的多资源结算'});}
    if(a.id===this.selectedId&&a.action!==old.action)this.add({tick:world.tick,type:'action',id:a.id,detail:a.action,x:a.x,y:a.y});
   }
  }
  for(const [id,old]of this.previous)if(!now.has(id)){
   const record=this.archives.get(id);if(record)record.deathTick=world.tick;
   this.add({tick:world.tick,type:'death',id,related:old.parentId,x:old.ref.x,y:old.ref.y,detail:old.ref.age>=old.ref.genome.traits.lifespan*c.lifespanScale?'达到年龄阈值':'能量耗尽',lastObservedEnergy:old.energy});
  }
  for(const [cell,ids]of harvestGroups)if(ids.length>1)this.add({tick:world.tick,type:'competition',id:ids[0],related:ids[1],ids,cell,detail:'实际在同一资源格采集；需求按比例结算'});
  for(const e of world.events)if(e.tick===world.tick&&e.type==='share'){
   const a=now.get(e.id),b=now.get(e.related);this.add({...e,x:a?.x,y:a?.y,toX:b?.x,toY:b?.y,detail:'真实能量转移'});
  }
  // Publication is known; recipient identity is not recorded by the kernel.
  const m=world.messages.find(m=>m.id===this.selectedId);
  if(m)this.add({tick:world.tick,type:'signal',id:m.id,x:now.get(m.id)?.x,y:now.get(m.id)?.y,toX:m.x,toY:m.y,detail:'发布已感知的资源坐标，不等于确认某条链路送达'});
  const tracked=now.get(this.selectedId);
  if(tracked)this.dropped.frames+=boundedPush(this.frames,{tick:world.tick,...point(tracked),target:tracked.target?{...tracked.target}:null,inputs:[...(tracked.brain?.inputs||[])],outputs:[...(tracked.brain?.outputs||[])]},this.limits.frameLimit);
  if(world.agents.length===0&&this.previous.size)this.add({tick:world.tick,type:'extinction',id:null,detail:'当前整个种群灭绝'});
  this.previous=new Map(world.agents.map(a=>[a.id,{...point(a),ref:a}]));this.lastTick=world.tick;
 }
 view(id=this.selectedId){
  const archive=this.archives.get(id),parent=archive?this.archives.get(archive.parentId):null;
  return {version:OBSERVER_VERSION,startTick:this.startTick,endTick:this.lastTick,limits:this.limits,dropped:{...this.dropped},
   recent:this.events.slice(-120),frames:this.frames.filter(f=>f.id===id).slice(-180),
   individual:archive?structuredClone(archive):null,parent:parent?structuredClone(parent):null,
   offspring:[...this.archives.values()].filter(a=>a.parentId===id).slice(-24).map(a=>({...point(a),birthTick:a.birthTick,deathTick:a.deathTick,mutation:genomeDifference(archive?.genome,a.genome)})),
   mutation:genomeDifference(parent?.genome,archive?.genome)};
 }
 export(world){
  return {version:OBSERVER_VERSION,engine:this.initialSnapshot.version,origin:this.origin,config:{...world.config},initialSnapshot:structuredClone(this.initialSnapshot),startTick:this.startTick,endTick:world.tick,initial:this.startMetrics,final:world.metrics(),
   ticksObserved:world.tick-this.startTick,meanPopulation:world.tick>this.startTick?this.integral/(world.tick-this.startTick):world.agents.length,
   populationRange:[this.minPopulation,this.maxPopulation],events:structuredClone(this.events),frames:structuredClone(this.frames),archives:structuredClone([...this.archives.values()]),limits:this.limits,dropped:{...this.dropped},
   history:structuredClone(world.history),digest:world.digest(),
   boundary:'仅保存有界事件及选中个体逐tick关键帧；不含过去整个世界资源场。导入旧存档时观察从导入tick开始。档案关系缺失不代表不存在祖先。'};
 }
}
