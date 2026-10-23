import asyncio,json,subprocess,pathlib,datetime
import edge_tts
root=pathlib.Path(__file__).resolve().parent.parent
folder=root/'submission'/'rc-20261012'
cues=json.loads((folder/'demo-narration.json').read_text(encoding='utf-8'))
texts=[
'为什么做过实验，学生还是可能不理解？AI学院把猜想、实验、追问和复习连成一条完整的学习路径。',
'先不看答案，自己作答。系统会把真正的概念错误留下来，作为后续教学的起点。',
'现在运行真实科学计算。两条轨道逐渐分离，我们可以点选曲线，直接读取真实数值。',
'看到了现象，就一定理解了吗？导师围绕刚才的观测发问，帮助学生解释原因，而不是只背结论。',
'再来做一次对照。只改变一个条件，先写预测，经过本人确认后才能执行。',
'对照结果出来了。每一次运行、参数和观测都有来源，方便回来核对。',
'接下来换一道新题，而不是重复刚才的答案，看看概念能不能迁移。',
'系统同时保留客观错题和可能的误区。误区只是建议，学生可以提出不同意见。',
'即使这次答对，也不代表彻底掌握。新的变式和延迟复习会继续追踪学习过程。',
'想探索更多？直接进入物理实验室，拖动参数，观察真实计算生成的轨道和图表。',
'另一个实验室里，数字生命正在消耗能量、探索环境。我们可以跟踪其中一个个体。',
'关键不只是看动画，而是把实验前的猜想、实际观测和自己的反思保存为证据。',
'这就是AI学院：把主动探索转化为可复核的学习过程。目前展示的是软件演示，并不代表已经证明教学效果。'
]
assert len(texts)==len(cues)
(folder/'natural-narration.json').write_text(json.dumps([{**c,'text':t} for c,t in zip(cues,texts)],ensure_ascii=False,indent=2),encoding='utf-8')
async def main():
 for i,t in enumerate(texts):
  await edge_tts.Communicate(t,voice='zh-CN-YunxiNeural',rate='+18%').save(str(folder/f'natural-voice-{i:02d}.mp3'))
  print('VOICE_OK',i,flush=True)
asyncio.run(main())
(folder/'natural-narration.json').write_text(json.dumps([{**c,'text':t} for c,t in zip(cues,texts)],ensure_ascii=False,indent=2),encoding='utf-8')
