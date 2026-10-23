import test from 'node:test';
import assert from 'node:assert/strict';
import {ProviderRegistry} from '../model-provider.mjs';

test('OpenCode Go uses stable session header and never exposes key in summaries',async()=>{
 const requests=[];
 const mockFetch=async(url,opts)=>{
  requests.push({url,headers:opts.headers,body:JSON.parse(opts.body)});
  return {ok:true,json:async()=>({choices:[{message:{content:'请观察两条轨迹如何逐渐分离。'}}],usage:{total_tokens:42}})};
 };
 const registry=new ProviderRegistry({env:{
  ACADEMY_LLM_BASE_URL:'https://opencode.ai/zen/go/v1',
  ACADEMY_LLM_MODEL:'deepseek-v4.1-flash',
  ACADEMY_LLM_API_KEY:'FAKE-UNIT-TEST-KEY',
  ACADEMY_LLM_DISPLAY_NAME:'本机测试'
 },fetchImpl:mockFetch});
 const first=await registry.generate([{role:'user',content:'实验一'}]);
 const second=await registry.generate([{role:'user',content:'实验二'}]);
 assert.equal(first.text,'请观察两条轨迹如何逐渐分离。');
 assert.equal(requests.length,2);
 assert.equal(requests[0].headers['x-opencode-session'],requests[1].headers['x-opencode-session']);
 assert.match(requests[0].headers['x-opencode-session'],/^[0-9a-f-]{36}$/);
 assert.match(requests[0].headers['User-Agent'],/AI-Academy-Local-Demo/);
 assert.equal(requests[0].body.model,'deepseek-v4.1-flash');
 assert.ok(!JSON.stringify(registry.summary({admin:true})).includes('FAKE-UNIT-TEST-KEY'));
 const other=new ProviderRegistry({env:{},fetchImpl:mockFetch});
 assert.notEqual(registry.demoSessionId,other.demoSessionId);
});
