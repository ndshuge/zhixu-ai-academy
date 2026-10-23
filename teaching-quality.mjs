/** Bounded deterministic checks, not a semantic proof of model correctness. */
export function checkTeachingReply(text,result){
 const issues=[];
 if(typeof text!=='string'||!text.trim())return {ok:false,issues:['empty-response']};
 const clean=text.replace(/\s+/g,' ').trim();
 const affirmative=(rx)=>{for(const m of clean.matchAll(rx)){const before=clean.slice(Math.max(0,m.index-14),m.index);if(!/(不能|不可|不足|不要|不应|并不|尚未|未能|无法|不是|不等于|避免|没有|不代表)/.test(before))return true}return false};
 if(affirmative(/(?:无需|跳过|绕过|不用)[^。；]{0,12}(?:批准|审批|授权)|(?:我已|系统已)[^。；]{0,10}(?:执行实验|更改参数)/g))issues.push('approval-bypass');
 if(affirmative(/(?:证明|证实)[^。；]{0,12}(?:现实|普遍|所有环境)|(?:提升|提分|学习效果)[^。；]{0,10}\d+\s*%/g))issues.push('unsupported-real-world-or-learning-claim');
 if(affirmative(/(?:同时|一并)[^。；]{0,10}(?:改变|修改)[^。；]{0,10}(?:多个|两个|所有)(?:变量|参数|条件)/g))issues.push('multi-variable-advice');
 if(result?.experiment==='evo-pair'&&affirmative(/(?:tick|个体)[^。；]{0,12}(?:就是|等于|作为)[^。；]{0,8}独立样本|合作[^。；]{0,10}(?:总是|必然|所有环境)[^。；]{0,8}(?:优势|更好)/gi))issues.push('invalid-independent-unit');
 const first=result?.metrics?.find(x=>String(x.label).includes('首次'));
 if(result?.experiment==='sensitivity'&&affirmative(/Float32[^。；]{0,45}(?:\d+\s*步|首次)[^。；]{0,30}(?:0\.01|分离)/g))issues.push('misattributes-float64-threshold-to-float32');
 if(first&&Number.isFinite(Number(first.value))){
  for(const m of clean.matchAll(/第\s*(\d+)\s*步[^。；]{0,15}(?:达到|分离|阈值)/g))if(Number(m[1])!==Number(first.value))issues.push('contradicts-run-metric');
 }
 return {ok:issues.length===0,issues:[...new Set(issues)],text:clean.length>620?clean.slice(0,600)+'…（回答过长，请结合真实数据继续追问）':text.trim(),scope:'bounded rule checks; model interpretation still requires student/scientific review'};
}
