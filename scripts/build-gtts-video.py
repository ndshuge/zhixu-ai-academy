import json,pathlib,concurrent.futures,subprocess,hashlib
from gtts import gTTS
root=pathlib.Path(__file__).resolve().parent.parent
d=root/'submission'/'rc-20261012'
cues=json.loads((d/'natural-narration.json').read_text(encoding='utf8'))
def synth(pair):
 i,c=pair
 p=d/f'gtts-voice-{i:02d}.mp3'
 gTTS(text=c['text'],lang='zh-CN',slow=False).save(str(p))
 return i,p.stat().st_size
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for i,size in pool.map(synth,enumerate(cues)):print('VOICE',i,size,flush=True)
args=['ffmpeg','-y','-loglevel','error','-i',str(d/'AI学院-紧凑演示-新解说字幕候选.mp4')]
filters=[]
for i,c in enumerate(cues):
 p=d/f'gtts-voice-{i:02d}.mp3'
 dur=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(p)]))['format']['duration'])
 slot=c['end']-c['start']
 speed=max(1,dur/(slot-0.35))
 if speed>1.6:raise RuntimeError(f'Scene {i} much too long: {dur:.1f} vs {slot:.1f}')
 args+=['-i',str(p)]
 filters.append(f'[{i+1}:a]atempo={speed:.4f},adelay={int(c["start"]*1000)}:all=1,volume=1.25[a{i}]')
 print('SEGMENT',i,'dur',round(dur,2),'slot',round(slot,2),'speed',round(speed,2),flush=True)
filters.append(''.join(f'[a{i}]' for i in range(len(cues)))+f'amix=inputs={len(cues)}:normalize=0,alimiter=limit=0.92[aout]')
out=d/'AI学院-新版中文语音演示-候选.mp4'
args+=['-filter_complex',';'.join(filters),'-map','0:v:0','-map','[aout]','-c:v','copy','-c:a','aac','-b:a','160k','-t','157.333','-movflags','+faststart',str(out)]
subprocess.run(args,check=True)
print('OUTPUT',out,'SIZE',out.stat().st_size,'SHA256',hashlib.sha256(out.read_bytes()).hexdigest(),flush=True)
