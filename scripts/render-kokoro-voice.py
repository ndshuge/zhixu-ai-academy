# Local-only render: Kokoro open-weights (Apache-2.0), no external account credentials.
import os,sys,pathlib,json
root=pathlib.Path(__file__).resolve().parent.parent
os.environ.setdefault('HF_HOME',r'E:\CHATGPT\_tools\hf-kokoro-cache')
os.environ.setdefault('HF_HUB_DISABLE_XET','1')
sys.path.insert(0,r'E:\CHATGPT\_tools\kokoro-zh')
import torch,numpy as np,soundfile as sf
from kokoro import KPipeline
d=root/'submission'/'rc-20261012'
cues=json.loads((d/'natural-narration.json').read_text(encoding='utf8'))
voice=os.getenv('KOKORO_VOICE','zf_094')
device='cuda' if torch.cuda.is_available() else 'cpu'
print('KOKORO_INIT',device,voice,flush=True)
pipeline=KPipeline(lang_code='z',repo_id='hexgrad/Kokoro-82M-v1.1-zh',device=device)
for i,c in enumerate(cues):
 chunks=[audio.detach().cpu().numpy() if hasattr(audio,'detach') else np.asarray(audio) for _,_,audio in pipeline(c['text'],voice=voice,speed=1.1)]
 if not chunks:raise RuntimeError(f'no audio for scene {i}')
 signal=np.concatenate(chunks)
 sf.write(str(d/f'kokoro-voice-{i:02}.wav'),signal,24000)
 print('KOKORO_SCENE_OK',i,round(len(signal)/24000,2),flush=True)
print('KOKORO_COMPLETE',len(cues),flush=True)
