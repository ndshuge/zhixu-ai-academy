import pathlib,subprocess,json,hashlib
root=pathlib.Path(__file__).resolve().parent.parent
d=root/'submission'/'rc-20261012'
ev=root/'evidence'/'rc-20261012'
src=d/'AI学院-自然神经配音-Kokoro候选.mp4'
img=ev/'live-deepseek-teaching-20261012.png'
out=d/'AI学院-神经配音与真实DeepSeek演示-审核候选.mp4'
# Inset verified real-browser capture only in scene 3; original rules-only shot remains elsewhere.
vf="[0:v]split=2[base][temp];[temp]trim=start=37:end=53,setpts=PTS-STARTPTS[clip];[1:v]scale=1340:-1:flags=lanczos,format=rgba[proof];[clip][proof]overlay=(W-w)/2:(H-h)/2:shortest=1[insert];[base][insert]overlay=0:0:enable='between(t,37,53)'[v]"
# The live screenshot is an authentic browser capture but not a video recording of the generation itself.
args=['ffmpeg','-y','-loglevel','error','-i',str(src),'-loop','1','-framerate','30','-i',str(img),'-filter_complex',vf,'-map','[v]','-map','0:a','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','copy','-t','157.333','-movflags','+faststart',str(out)]
subprocess.run(args,check=True)
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size','-of','json',str(out)]))
print(json.dumps({'file':out.name,'bytes':out.stat().st_size,'duration':meta['format']['duration'],'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'real_llm_browser_screenshot':True,'real_llm_live_video':False},ensure_ascii=False))
