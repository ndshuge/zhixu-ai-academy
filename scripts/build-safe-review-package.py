import pathlib,hashlib,json,re,zipfile,subprocess
import fitz
root=pathlib.Path(__file__).resolve().parent.parent
folder=root/'submission'/'rc-20261012'
names=['AI学院-自然神经配音-Kokoro候选.mp4','AI学院-作品介绍-正式RC候选.pdf']
paths=[folder/name for name in names]
assert all(p.exists() and p.stat().st_size for p in paths)
patterns=[r'(?i)bearer\s+[a-z0-9_\-]{15,}',r'(?i)(?:api[_-]?key|secret|access[_-]?token)\s*[:=]\s*[\x22\x27]?[a-z0-9_\-]{20,}',r'sk-[a-zA-Z0-9]{20,}']
doc=fitz.open(paths[1]);alltext='\n'.join(page.get_text() for page in doc)
assert len(doc)==7
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(paths[0])]))
metadata=json.dumps(probe,ensure_ascii=False)
for field,value in [('PDF content',alltext),('media metadata',metadata)]:
 for pat in patterns:
  if re.search(pat,value):raise RuntimeError(f'Sensitive credential-like pattern in {field}')
assert 120 < float(probe['format']['duration']) < 250
manifest={'package_type':'LOCAL_REVIEW_ONLY_NOT_SUBMITTED','date':'2026-10-12','student_study_count':0,'live_llm_recorded':False,'narration':'Kokoro-82M-v1.1-zh zf_094 neural TTS, Apache-2.0 weights','source':'edited real browser automation, not human study','files':[{'name':p.name,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths],'safety':'Whitelist package only; PDF searchable text and media metadata scanned for common token patterns. Not exhaustive video frame secret audit.'}
dest=root/'submission'/'AI学院-本机审核候选-不含凭据-NOT_SUBMIT.zip'
with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in paths:z.write(p,arcname=p.name)
 z.writestr('REVIEW_MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(dest) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(names+['REVIEW_MANIFEST.json'])
(root/'evidence'/'rc-20261012'/'safe-review-package-audit.json').write_text(json.dumps({'zip':dest.name,'zip_size':dest.stat().st_size,**manifest},ensure_ascii=False,indent=2),encoding='utf8')
print('SAFE_REVIEW_ZIP_OK',dest.name,dest.stat().st_size,'pdf_pages',len(doc),'video_sec',probe['format']['duration'],'entries',len(names)+1)
