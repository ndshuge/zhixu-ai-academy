import json,pathlib,subprocess,hashlib
root=pathlib.Path(__file__).resolve().parent.parent
d=root/'submission'/'rc-20261012'
cues=json.loads((d/'natural-narration.json').read_text(encoding='utf8'))
source=d/'AI学院-紧凑演示-新解说字幕候选.mp4'
out=d/'AI学院-自然神经配音-Kokoro候选.mp4'
args=['ffmpeg','-y','-loglevel','error','-i',str(source)]
filters=[]; durations=[]
for i,c in enumerate(cues):
 file=d/f'kokoro-voice-{i:02}.wav'
 duration=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(file)]))['format']['duration'])
 scene=c['end']-c['start']
 if duration>scene-0.25:raise ValueError(f'audio too long for scene {i}: {duration} > {scene}')
 args+=['-i',str(file)]
 # delay starts relative to the original 157-second film timeline; no double speed-up
 filters.append(f'[{i+1}:a]highpass=f=65,lowpass=f=11000,volume=1.2,adelay={int(c["start"]*1000)}:all=1[seg{i}]')
 durations.append({'index':i,'duration':round(duration,3),'slot':round(scene,3)})
filters.append(''.join(f'[seg{i}]' for i in range(len(cues)))+f'amix=inputs={len(cues)}:normalize=0,alimiter=limit=0.9[aout]')
args+=['-filter_complex',';'.join(filters),'-map','0:v:0','-map','[aout]','-c:v','copy','-c:a','aac','-b:a','160k','-t','157.333','-movflags','+faststart',str(out)]
subprocess.run(args,check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name','-of','json',str(out)]))
report={'source':'Kokoro-82M-v1.1-zh','voice':'zf_094','provider':'local-neural','model_license':'Apache-2.0','scenes':len(cues),'duration_sec':probe['format']['duration'],'size_bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'segments':durations,'video':out.name,'llm_live_recorded':False}
(root/'evidence'/'rc-20261012'/'neural-voice-acceptance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if k!='segments'},ensure_ascii=False))
