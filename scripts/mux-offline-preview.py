import json,subprocess,pathlib
r=pathlib.Path(__file__).resolve().parent.parent
d=r/'submission'/'rc-20261012'
cues=json.loads((d/'natural-narration.json').read_text(encoding='utf8'))
args=['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(d/'rc-screen-30fps.mp4')]
filters=[]
probes=[]
for i,c in enumerate(cues):
 f=d/f'offline-voice-{i}.wav'
 duration=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(f)]))['format']['duration'])
 slot=c['end']-c['start']
 if duration>slot-0.2: print('AUDIO_OVERLAP',i,round(duration,1),round(slot,1))
 args+=['-i',str(f)]
 filters.append(f'[{i+1}:a]adelay={int(c["start"]*1000)}:all=1[a{i}]')
 probes.append({'scene':i,'duration':duration,'slot':slot})
filters.append(''.join(f'[a{i}]' for i in range(len(cues)))+f'amix=inputs={len(cues)}:normalize=0,alimiter=limit=0.9[aout]')
dest=d/'AI学院-紧凑中文配音-离线候选.mp4'
args+=['-filter_complex',';'.join(filters),'-map','0:v:0','-map','[aout]','-c:v','copy','-c:a','aac','-b:a','160k','-t','158','-movflags','+faststart',str(dest)]
subprocess.run(args,check=True)
print(json.dumps({'output':str(dest),'scenes':len(cues),'segments':probes},ensure_ascii=False))
