import {randomBytes} from 'node:crypto';
import {ProviderRegistry} from './model-provider.mjs';

// Local demonstration BYOK sessions. Credentials never enter a cookie,
// response, browser storage, Git, or application logs.
const COOKIE='academy_judge_sid';
const TTL=2*60*60*1000;
const MAX_SESSIONS=40;
export class JudgeSessions {
 constructor({registryFactory=()=>new ProviderRegistry({env:{}}),now=()=>Date.now()}={}){
  this.sessions=new Map();this.registryFactory=registryFactory;this.now=now;
 }
 prune(){
  const t=this.now();
  for(const [id,s] of this.sessions)if(s.expires<=t)this.sessions.delete(id);
  while(this.sessions.size>MAX_SESSIONS)this.sessions.delete(this.sessions.keys().next().value);
 }
 token(req){
  const match=(req.headers.cookie||'').match(/(?:^|;\s*)academy_judge_sid=([0-9a-f]{64})(?:;|$)/);
  return match?.[1]||null;
 }
 get(req){
  this.prune();const id=this.token(req);return id?this.sessions.get(id)||null:null;
 }
 configure(req,input){
  this.prune();
  const existing=this.get(req);
  const registry=existing?.registry||this.registryFactory();
  const info=registry.configure(input); // Validate before setting any cookie.
  const id=existing?.id||randomBytes(32).toString('hex');
  if(!existing){this.sessions.set(id,{id,registry,expires:this.now()+TTL});this.prune();}
  else existing.expires=this.now()+TTL;
  return {info,cookie:this.cookie(id)};
 }
 cookie(id){
  return COOKIE+'='+id+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+Math.floor(TTL/1000);
 }
 clear(req){
  const id=this.token(req);const s=this.get(req);
  if(s){s.registry.clear();this.sessions.delete(id);}
  return COOKIE+'=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
 }
 summary(req){
  const s=this.get(req);
  return s?{...s.registry.summary({admin:true}),scope:'browser-session',expiresAt:new Date(s.expires).toISOString()}:
   {configured:false,scope:'browser-session',credentialStorage:'server-memory-only',expiresAt:null};
 }
 select(req,school){
  const session=this.get(req);
  return {provider:session?.registry||school,scope:session?'browser-session':'school'};
 }
}
