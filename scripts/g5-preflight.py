from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,hashlib
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'submission'
EVIDENCE=ROOT/'evidence'/'g5'
EVIDENCE.mkdir(parents=True,exist_ok=True)
pdf=OUT/'AI学院-作品介绍-参赛草案-v2.pdf'
video=OUT/'g5-demo'/'AI学院-真实浏览器自动化演示-候选.mp4'
assert pdf.is_file() and video.is_file(), 'missing G5 deliverables'
d=pymupdf.open(pdf)
assert len(d)==7, f'page count: {len(d)}'
texts=[p.get_text() for p in d]
assert all(len(t)>100 for t in texts), 'empty/short page'
assert sum(t.count('\uFFFD') for t in texts)==0,'replacement glyph found in PDF text'
assert all('规则' in t or '导师' in t or '学习' in t for t in texts)
for i in [0,2,3,4,6]:
 p=d[i]
 pix=p.get_pixmap(matrix=pymupdf.Matrix(1.25,1.25),alpha=False)
 pix.save(EVIDENCE/f'pdf-page-{i+1:02d}.png')
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate','-of','json',str(video)],text=True))
f=float(probe['format']['duration'])
size=video.stat().st_size
assert f>20 and f<=600,f'video duration={f}'
assert size>10000 and size<=500_000_000
vstream=next(s for s in probe['streams'] if s.get('codec_name')=='h264')
assert vstream['width']>=1280 and vstream['height']>=720
for n,seconds in enumerate([6,22,39,53],start=1):
 dest=EVIDENCE/f'video-frame-{n:02d}.jpg'
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(seconds),'-i',str(video),'-frames:v','1',str(dest)],check=True)
 assert dest.stat().st_size>1000
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rec={
 'timestampUTC':datetime.now(timezone.utc).isoformat(),
 'scope':'G5 local files only, NOT contest submission, NOT a human study',
 'introPDF':{'path':str(pdf),'pages':len(d),'bytes':pdf.stat().st_size,'sha256':sha(pdf),'textLengths':[len(t) for t in texts]},
 'demoVideo':{'path':str(video),'durationSeconds':f,'bytes':size,'sha256':sha(video),'videoStream':vstream},
 'screenshots':{'pdf':[f'pdf-page-{i+1:02d}.png' for i in [0,2,3,4,6]],'video':[f'video-frame-{i:02d}.jpg' for i in range(1,5)]},
 'realVolunteerParticipants':0,'realModelAPIUsed':False,'signedOfficialForms':False,'contestUploadReceipt':False
}
(EVIDENCE/'g5-preflight.json').write_text(json.dumps(rec,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('G5_PREFLIGHT_OK', 'pdfPages=',len(d),'videoDuration=',f,'videoBytes=',size,'pdfSha256=',rec['introPDF']['sha256'],'videoSha256=',rec['demoVideo']['sha256'])
