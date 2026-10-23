from pathlib import Path
import json
r=Path(r'E:\CHATGPT\projects\ai-academy')
out=r/'pages-overlay/technical-evidence-summary.json'
offline=json.loads((r/'evidence/rc3-20261012/g2-benchmark/result-p5-60.json').read_text(encoding='utf8'))
detail=json.loads((r/'evidence/rc3-20261012/g2-benchmark/cases-p5-60.json').read_text(encoding='utf8'))
live=json.loads((r/'evidence/rc3-20261012/g2-live/live-real-vs-rules-results.json').read_text(encoding='utf8'))
assert offline['status']=='PASS' and offline['cases']>=50 and offline['actualPflRecomputations']>=100
assert detail['caseCount']==offline['cases'] and detail['sourceHash']==offline['testSetHash']
assert all(i['scienceVerified'] is True for i in detail['items'])
assert sum(bool(i['ruleGoalAligned']) for i in detail['items'])==offline['ruleTargetAligned']
assert sum(bool(i['localPolicyGoalAligned']) for i in detail['items'])==offline['deterministicPolicyTargetAligned']
assert live['status']=='PASS' and live['realModelCalls']==1 and live['testedCases']==8
safe={'scope':'VERIFIED_SYNTHETIC_TECHNICAL_TESTS_NOT_STUDENT_LEARNING',
'offline':{'situations':offline['cases'],'recomputations':offline['actualPflRecomputations'],
'blockedUnsafeOutputs':offline['blockedMaliciousSelections'],'goalAlignedRule':offline['ruleTargetAligned'],
'goalAlignedDeterministicPolicy':offline['deterministicPolicyTargetAligned'],
'modelCalls':offline['realRemoteLLMCalls'],'hash':offline['testSetHash'],
'noSuitableDirectionCases':len(detail['noSuitableDirectionCases'])},
'remote':{'syntheticSituations':live['testedCases'],'goalAlignedModel':live['modelTargetAlignedCount'],
'goalAlignedRule':live['ruleTargetAlignedCount'],'remoteCalls':live['realModelCalls'],
'modelName':'DeepSeek V4.1 Flash','toolCalls':live['toolCalls']},
'actualStudentParticipants':0,'caution':'仅为本机历史合成技术测试汇总，不是实时 Pages DeepSeek 调用，不是学生学习效果。单次真实模型请求测试与本页用户个人 BYOK 分开统计。',
'source':'LOCAL_VERIFIED_TEST_AGGREGATES_IMPORTED_2026-10-23','liveFeed':False}
out.write_text(json.dumps(safe,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PUBLIC_TECHNICAL_AGGREGATE_VERIFIED',out.name,'bytes',out.stat().st_size,'situations',safe['offline']['situations'],'remoteCalls',safe['remote']['remoteCalls'])
