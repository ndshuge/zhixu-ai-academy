import { World } from '../core/world.mjs';
const wrap=(x,n)=>((x%n)+n)%n;
export const EXECUTION_VERSION='cached-neighborhood-0.2.0';
// Cache only the exact ordered bin-key sequence. Membership, distance, radius,
// neighbor order, decisions and RNG are still the original model operations.
export class IndexedWorld extends World{
 constructor(config={}){super(config);this.neighborKeys=new Map();}
 neighbors(a,radius){
  const bx=Math.floor(a.x/3),by=Math.floor(a.y/3),r=Math.ceil(radius/3)+1;
  const cacheKey=bx+':'+by+':'+r+':'+this.binRows+':'+this.binCols;
  let keys=this.neighborKeys.get(cacheKey);
  if(!keys){keys=[];const seen=new Set();
   for(let y=by-r;y<=by+r;y++)for(let x=bx-r;x<=bx+r;x++){
    const key=wrap(y,this.binRows)*this.binCols+wrap(x,this.binCols);
    if(!seen.has(key)){seen.add(key);keys.push(key);}
   }
   if(this.neighborKeys.size>=2048)this.neighborKeys.delete(this.neighborKeys.keys().next().value);
   this.neighborKeys.set(cacheKey,keys);
  }
  const result=[];
  for(const key of keys)for(const b of this.bins.get(key)||[])if(b.id!==a.id&&this.distance(a,b)<=radius)result.push(b);
  return result;
 }
 static restore(data){const w=World.restore(data);Object.setPrototypeOf(w,IndexedWorld.prototype);w.neighborKeys=new Map();return w;}
}
