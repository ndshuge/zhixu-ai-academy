import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const dir='submission/rc-20261012',cues=JSON.parse(await readFile(dir+'/demo-narration.json','utf8'));
// The edit intentionally slows the captured sequence for readable Chinese narration.
const editScale=1.6;for(const c of cues){c.start*=editScale;c.end*=editScale;}
const args=['-y','-loglevel','error','-i',dir+'/rc-screen-30fps.mp4'],filters=[];
for(const [i,c]of cues.entries()){
 const file=dir+'/voice-'+i+'.wav';const probe=JSON.parse(spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',file],{encoding:'utf8'}).stdout);const duration=Number(probe.format.duration);
 if(duration>c.end-c.start-.3)throw Error('Narration longer than scene '+i+': '+duration);
 args.push('-i',file);filters.push(`[${i+1}:a]adelay=${Math.round(c.start*1000)}:all=1[a${i}]`);
 c.voiceDuration=duration;
}
filters.push(cues.map((_,i)=>`[a${i}]`).join('')+`amix=inputs=${cues.length}:normalize=0,apad,alimiter=limit=0.9[audio]`);
const duration=JSON.parse(await readFile('evidence/rc-20261012/demo-recording.json','utf8')).duration*editScale;
const stamp=s=>new Date(Math.round(s*1000)).toISOString().slice(11,23).replace('.',',');
const subtitles=[];
for(const c of cues){const chunks=c.text.match(/.{1,56}/gu);let t=c.start;for(const chunk of chunks){const dt=c.voiceDuration*chunk.length/c.text.length;subtitles.push(`${subtitles.length+1}\n${stamp(t)} --> ${stamp(t+dt)}\n${chunk.match(/.{1,28}/gu).join('\n')}\n`);t+=dt;}}
await writeFile(dir+'/AI学院-RC演示字幕.srt',subtitles.join('\n'));
filters.push('[0:v]setpts=1.6*PTS,fps=30,crop=1600:890:0:0,pad=1600:1000:0:0:black,subtitles=submission/rc-20261012/AI学院-RC演示字幕.srt:force_style=\'FontName=Microsoft YaHei,FontSize=9,MarginV=8,Outline=1,Shadow=0\'[video]');
args.push('-filter_complex',filters.join(';'),'-map','[video]','-map','[audio]','-t',String(duration),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',dir+'/AI学院-正式演示-RC候选.mp4');
const result=spawnSync('ffmpeg',args,{encoding:'utf8'});if(result.status)throw Error(result.stderr);
await writeFile('evidence/rc-20261012/narration-mix.json',JSON.stringify({voice:'Windows Microsoft Huihui Desktop',offline:true,editScale,scope:'edited real product capture; output 30fps CFR, not native animation or physical-display FPS',cues},null,2));console.log('RC_NARRATED_VIDEO_OK',duration);
