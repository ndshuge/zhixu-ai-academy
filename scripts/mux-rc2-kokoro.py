from pathlib import Path
import json,subprocess,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'submission/rc2-20261012';EV=ROOT/'evidence/rc2-20261012'
cues=json.loads((OUT/'demo-narration.json').read_text(encoding='utf-8'))
duration=json.loads((EV/'demo-recording.json').read_text(encoding='utf-8'))['duration']
args=['ffmpeg','-y','-loglevel','error','-i',str(OUT/'rc2-screen.mp4')];filters=[];tracks=[];voice_index=1
def ass_time(t):
 c=round(t*100);return f'{c//360000}:{c//6000%60:02}:{c//100%60:02}.{c%100:02}'
def srt_time(t):
 c=round(t*1000);return f'{c//3600000:02}:{c//60000%60:02}:{c//1000%60:02},{c%1000:03}'
ass='''[Script Info]
ScriptType: v4.00+
PlayResX: 1600
PlayResY: 1000
WrapStyle: 2
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Narration,Microsoft YaHei,28,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,2,32,32,16,1
Style: Label,Microsoft YaHei,18,&H00FFFFFF,&H00FFFFFF,&H00223731,&H00223731,0,0,0,0,100,100,0,0,3,1,0,8,20,20,10,1
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
'''
ass+=f'Dialogue: 1,0:00:00.00,{ass_time(duration)},Label,,0,0,0,,自动化产品演示 · 模型反馈为本机模拟 · 真实DeepSeek为历史截图证据\n'
srt=[];voices=[]
for c in cues:
 if c['voiceIndex'] is None:
  c['text']='既有真实DeepSeek网页截图，不是实时回答录像。43步属于Float64初值差，原回答的Float32归因有误；RC2已补检查。'
  speech_time=c['end']-c['start']
 else:
  file=ROOT/f"submission/rc-20261012/kokoro-voice-{c['voiceIndex']:02}.wav"
  speech_time=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(file)]))['format']['duration'])
  assert speech_time<c['end']-c['start']-.2
  args+=['-i',str(file)]
  filters.append(f'[{voice_index}:a]highpass=f=65,volume=1.1,adelay={round(c["start"]*1000)}:all=1[a{voice_index}]');tracks.append(f'[a{voice_index}]');voice_index+=1
  voices.append({'voiceIndex':c['voiceIndex'],'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'duration':speech_time,'start':c['start'],'end':c['start']+speech_time})
 text=c['text'];chunks=[]
 while len(text)>56:
  cuts=[text.rfind(p,28,56) for p in '，。；？'];cut=max(cuts);cut=cut+1 if cut>=28 else 56;chunks.append(text[:cut]);text=text[cut:]
 chunks.append(text);at=c['start']
 for chunk in chunks:
  end=at+speech_time*len(chunk)/len(c['text']);wrapped='\n'.join(chunk[i:i+28] for i in range(0,len(chunk),28));caption=wrapped.replace('\n',r'\N')
  ass+=f'Dialogue: 0,{ass_time(at)},{ass_time(end)},Narration,,0,0,0,,{caption}\n'
  srt.append(f'{len(srt)+1}\n{srt_time(at)} --> {srt_time(end)}\n{wrapped}\n');at=end
(OUT/'AI学院-RC2字幕.ass').write_text(ass,encoding='utf-8-sig');(OUT/'AI学院-RC2字幕.srt').write_text('\n'.join(srt),encoding='utf-8')
filters.append(''.join(tracks)+f'amix=inputs={len(tracks)}:normalize=0,apad,alimiter=limit=0.9[audio]')
filters.append('[0:v]crop=1600:880:0:0,pad=1600:1000:0:0:black,ass=submission/rc2-20261012/AI学院-RC2字幕.ass[video]')
movie=OUT/'AI学院-RC2-Kokoro讲解与完整操作-审核候选.mp4'
args+=['-filter_complex',';'.join(filters),'-map','[video]','-map','[audio]','-t',str(duration),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',str(movie)]
subprocess.run(args,check=True)
(EV/'video-edit.json').write_text(json.dumps({'status':'passed','voices':voices,'voice':'inherited Kokoro-82M-v1.1-zh zf_094','newNeuralRenders':0,'newRealModelCalls':0,'realModelProof':'labeled historical screenshot; scientific caveat included','cues':cues,'duration':duration,'video':movie.name},ensure_ascii=False,indent=2),encoding='utf-8')
print('RC2_KOKORO_VIDEO_OK',duration,movie.stat().st_size)
