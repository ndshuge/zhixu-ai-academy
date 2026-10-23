from pathlib import Path
import hashlib,json
from PIL import Image
root=Path(r'E:\CHATGPT\projects\ai-academy')
source=root/'assets-inbox'
dest=root/'public/assets/zhixu-doctor'
records=[]
for f in sorted(dest.glob('*.webp')):
    with Image.open(f) as im:
        records.append({'state':f.stem,'file':f.name,'width':im.width,'height':im.height,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
(dest/'manifest.json').write_text(json.dumps({'project':'Zhixu AI Academy','assetCount':len(records),'source':'11 images received through local QQ cache; copied to assets-inbox','items':records},ensure_ascii=False,indent=2),encoding='utf-8')
print('ART_MANIFEST_OK',len(records))
