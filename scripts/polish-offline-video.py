import json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parent.parent
d=root/'submission'/'rc-20261012'
cues=json.loads((d/'natural-narration.json').read_text(encoding='utf-8'))
def tm(s):
 h=int(s//3600);m=int(s%3600//60);q=s%60
 return f'{h}:{m:02d}:{q:05.2f}'
lines=['[Script Info]','ScriptType: v4.00+','PlayResX: 1600','PlayResY: 1000','','[V4+ Styles]','Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding','Style: Subtitle,Microsoft YaHei,24,&H00FFFFFF,&H000000FF,&H00102020,&H00102020,0,0,0,0,100,100,0,0,1,1,0,2,60,60,45,1','','[Events]','Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
for c in cues:
 text=c['text']
 parts=[]
 while text:
  cut=min(36,len(text))
  if cut<len(text):
   for j in range(cut,max(14,cut-9),-1):
    if text[j-1] in '，。！？；：':cut=j;break
  parts.append(text[:cut]);text=text[cut:]
 lines.append(f"Dialogue: 0,{tm(c['start'])},{tm(c['end'])},Subtitle,,0,0,0,,{r'\N'.join(parts)}")
ass=d/'AI学院-紧凑版字幕.ass'
ass.write_text('\n'.join(lines),encoding='utf-8-sig')
video=d/'AI学院-紧凑中文配音-离线候选.mp4'
final=d/'AI学院-紧凑演示-新解说字幕候选.mp4'
flt="drawbox=x=0:y=817:w=iw:h=183:color=0x102d2b@0.98:t=fill,subtitles='"+ass.name+"'"
cmd=['ffmpeg','-y','-loglevel','error','-i',str(video),'-vf',flt,'-c:v','libx264','-preset','veryfast','-crf','21','-c:a','copy','-movflags','+faststart',str(final)]
subprocess.run(cmd,check=True,cwd=str(d))
print('CANDIDATE_OK',str(final),final.stat().st_size)
