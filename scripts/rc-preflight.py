from pathlib import Path
import json,hashlib,subprocess,re
import pymupdf
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'submission/rc-20261012';EV=ROOT/'evidence/rc-20261012'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pdfs=[]
for p in sorted(OUT.glob('*.pdf')):
 d=pymupdf.open(p);texts=[page.get_text() for page in d]
 assert all(len(t)>100 for t in texts) and all('\ufffd' not in t for t in texts)
 for page in d:
  for block in page.get_text('dict')['blocks']:
   for line in block.get('lines',[]):
    for s in line['spans']:
     b=s['bbox'];assert b[0]>=-1 and b[2]<=page.rect.width+1 and b[1]>=-1 and b[3]<=page.rect.height+1
 pdfs.append({'path':str(p.relative_to(ROOT)),'pages':len(d),'bytes':p.stat().st_size,'sha256':sha(p),'textCharacters':[len(t) for t in texts]})
video=OUT/'AI学院-正式演示-RC候选.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate,channels','-of','json',str(video)],text=True))
duration=float(probe['format']['duration']);assert 180<=duration<=600 and video.stat().st_size<500_000_000
assert any(s['codec_name']=='h264' and s['r_frame_rate']=='30/1' and s['width']==1600 for s in probe['streams'])
assert any(s['codec_name']=='aac' for s in probe['streams'])
decoded=subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','NUL'],capture_output=True,text=True);assert decoded.returncode==0 and not decoded.stderr
mix=json.loads((EV/'narration-mix.json').read_text(encoding='utf-8'));assert all(c['voiceDuration']<c['end']-c['start'] for c in mix['cues'])
for i,cue in enumerate(mix['cues']):
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(cue['start']+min(3,cue['voiceDuration']/2)),'-i',str(video),'-frames:v','1',str(EV/f'video-scene-{i+1:02d}.jpg')],check=True)
assert len(re.findall(r' --> ',(OUT/'AI学院-RC演示字幕.srt').read_text(encoding='utf-8')))>=len(mix['cues'])
# A narrowly defined content scan; no matches are printed and no external files read.
scan=[];matches=[]
for folder in ['public','adapters','docs']:
 for p in (ROOT/folder).rglob('*'):
  if p.is_file() and p.suffix.lower() in ['.js','.mjs','.html','.json','.md','.css','.txt']:
   text=p.read_text(encoding='utf-8',errors='replace');scan.append(str(p.relative_to(ROOT)))
   if re.search(r'\bsk-[A-Za-z0-9_-]{24,}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text):matches.append(str(p.relative_to(ROOT)))
assert not matches
record={'status':'passed','scope':'Local RC file integrity, decode, document bounds and limited content audit; visual review recorded separately','pdfs':pdfs,'video':{'path':str(video.relative_to(ROOT)),'sha256':sha(video),'bytes':video.stat().st_size,'durationSeconds':duration,'probe':probe,'fullDecode':'passed','narration':'offline Windows Huihui, 13 scenes','source':'edited automated real browser capture','notHumanStudy':True},'textScan':{'files':len(scan),'commonPrivateKeyPatterns':len(matches),'limits':'Not exhaustive secret/history audit; server logs excluded from release'},'humanParticipants':0,'realModelCalls':False,'signedForms':False,'officialUpload':False}
(EV/'rc-preflight.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('RC_PREFLIGHT_OK',len(pdfs),'PDFs',duration,'seconds',video.stat().st_size,'bytes',len(scan),'text files')
