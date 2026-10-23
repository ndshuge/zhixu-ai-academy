from pathlib import Path
from pypdf import PdfReader
import json,hashlib,subprocess,re
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'submission/rc2-20261012';EV=ROOT/'evidence/rc2-20261012'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pdfs=[]
for p in OUT.glob('*.pdf'):
 d=PdfReader(str(p));texts=[page.extract_text() for page in d.pages];assert all(len(t)>100 and '\ufffd' not in t for t in texts)
 assert len(d.pages)==(8 if '作品介绍' in p.name else 1)
 pdfs.append({'path':str(p.relative_to(ROOT)),'pages':len(d.pages),'bytes':p.stat().st_size,'sha256':sha(p)})
movie=OUT/'AI学院-RC2-Kokoro讲解与完整操作-审核候选.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate','-of','json',str(movie)]))
duration=float(probe['format']['duration']);assert 180<duration<600 and movie.stat().st_size<500_000_000
assert any(s['codec_name']=='h264' and s['r_frame_rate']=='30/1' and s['width']==1600 for s in probe['streams']);assert any(s['codec_name']=='aac' for s in probe['streams'])
r=subprocess.run(['ffmpeg','-v','error','-i',str(movie),'-f','null','NUL'],capture_output=True);assert r.returncode==0 and not r.stderr
edit=json.loads((EV/'video-edit.json').read_text(encoding='utf-8'));assert len(edit['voices'])==13
for i,c in enumerate(edit['cues']):
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(c['start']+min(3,(c['end']-c['start'])/2)),'-i',str(movie),'-frames:v','1',str(EV/f'video-scene-{i+1:02d}.jpg')],check=True)
old=json.loads((EV/'inherited-manifest.json').read_text(encoding='utf-8'));protected=[x for x in old if x['path'].startswith('submission')]
assert all(sha(ROOT/x['path'])==x['sha256'] for x in protected),'old submission changed'
scan=[];matches=[]
for folder in ['public','adapters']:
 for p in (ROOT/folder).rglob('*'):
  if p.is_file() and p.suffix in ['.mjs','.js','.html','.json','.css','.txt']:
   scan.append(str(p.relative_to(ROOT)));text=p.read_text(encoding='utf-8',errors='replace')
   if re.search(r'\bsk-[A-Za-z0-9_-]{24,}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text):matches.append(str(p.relative_to(ROOT)))
assert not matches
record={'status':'passed','pdfs':pdfs,'video':{'path':str(movie.relative_to(ROOT)),'bytes':movie.stat().st_size,'sha256':sha(movie),'duration':duration,'probe':probe,'fullDecode':'passed','inheritedKokoroSegments':13,'extraRealModelCalls':0,'realModelEvidence':'historical screenshot, explicitly labeled, not live-generation recording'},'protectedOldSubmissionFiles':len(protected),'contentScan':{'files':len(scan),'matches':0,'scope':'Common private-key patterns only; release whitelist and visual QA are separate checks'},'humanSamples':0,'signed':False,'uploaded':False}
(EV/'preflight.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
print('RC2_PREFLIGHT_OK',duration,movie.stat().st_size,'protected old artifacts',len(protected))
