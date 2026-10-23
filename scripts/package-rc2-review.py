from pathlib import Path
import hashlib,json,re,zipfile
root=Path(r'E:\CHATGPT\projects\ai-academy')
src=root/'submission/rc2-20261012';out=src/'AI-Academy-RC2-Review-NOT-SUBMIT.zip'
base_names=['server.mjs','model-provider.mjs','agent-planner.mjs','quiz-bank.mjs','teaching-quality.mjs','package.json','project.manifest.json','README.md','START_HERE.md']
files=[root/p for p in base_names]
files += [p for d in ['public','adapters'] for p in (root/d).rglob('*') if p.is_file() and '__pycache__' not in p.parts]
media=[p for p in src.iterdir() if p.is_file() and p.suffix.lower() in ('.pdf','.docx','.mp4','.srt','.ass','.txt') and p.name != out.name and ('rc2-screen' not in p.name)]
assert any(p.suffix.lower()=='.mp4' for p in media)
assert any(p.suffix.lower()=='.pdf' for p in media)
patterns=[re.compile(rb'sk-[A-Za-z0-9_-]{24,}'),re.compile(rb'Bearer\\s+[A-Za-z0-9._~-]{32,}',re.I),re.compile(rb'AIza[0-9A-Za-z_-]{35}')]
suspect=[]
for p in files:
 if p.suffix.lower() in ('.mjs','.js','.ts','.json','.md','.html','.css','.txt'):
  data=p.read_bytes()
  if any(rx.search(data) for rx in patterns):suspect.append(str(p.relative_to(root)))
assert not suspect,('private token patterns',suspect)
notes='AI学院 RC2 审核候选，不可直接当正式投稿回执。使用 Node.js 运行 app/server.mjs；默认规则导师，远程真实模型需管理员自行BYOK配置和合法使用授权，包中无凭据。演示数据为合成，学生真人样本为0；两份官方附件尚未本人签名，提交前必须逐份人工核对。Kokoro配音、真实浏览器体验、历史DeepSeek截图已注明来源。正式报名/平台上传与回执均未在本包完成。\\r\\n'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for p in files:z.write(p,'app/'+p.relative_to(root).as_posix())
 z.writestr('app/START_LOCAL.cmd','@echo off\\r\\ncd /d "%~dp0"\\r\\nnode server.mjs\\r\\n')
 for p in media:z.write(p,'materials/'+p.name)
 z.writestr('REVIEW_NOT_SUBMIT.txt',notes)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 names=z.namelist()
 assert 'app/server.mjs' in names and 'app/public/index.html' in names
 assert not any('log.json' in x.lower() for x in names)
 audit={'candidateOnly':True,'notOfficiallySubmitted':True,'signed':False,'realStudents':0,'zip':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'memberCount':len(names),'materialFiles':[p.name for p in media],'appFiles':len(files),'contentScan':'only common high-confidence token formats, not comprehensive'}
 (src/'RC2_PACKAGE_AUDIT.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print('AI_RC2_REVIEW_ZIP_OK',out.name,audit['bytes'],len(names))
