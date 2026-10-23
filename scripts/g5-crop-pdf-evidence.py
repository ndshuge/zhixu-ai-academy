from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'evidence'/'browser'
OUT=ROOT/'evidence'/'g5'/'pdf-crops'
OUT.mkdir(parents=True,exist_ok=True)
crops=[
 ('13-learning-pretest-unanswered.png','pretest-crop.png',(280,700,1340,1100)),
 ('02-real-pfl-results.png','science-crop.png',(280,1970,1400,2390)),
 ('10-approved-real-comparison.png','approval-crop.png',(270,2680,1350,3090)),
 ('16-personal-evidence-dashboard.png','learning-crop.png',(200,980,1350,1410)),
 ('17-review-and-progress.png','review-crop.png',(250,720,1350,1130)),
 ('18-g4-real-study-consent-and-empty.png','study-crop.png',(180,1510,1320,1900)),
]
for file,out,(x0,y0,x1,y1) in crops:
 assert (SOURCE/file).exists()
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(SOURCE/file),'-vf',f'crop={x1-x0}:{y1-y0}:{x0}:{y0}','-frames:v','1',str(OUT/out)],check=True,timeout=30)
 print('CROP_OK',out,(x0,y0,x1,y1))
