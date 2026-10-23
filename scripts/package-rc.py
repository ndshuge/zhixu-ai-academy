from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import hashlib,json,datetime
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'submission/rc-20261012';EV=ROOT/'evidence/rc-20261012'
files=[]
for folder in ['public','adapters','tests','scripts','docs']:
 files.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
files.extend(p for p in ROOT.iterdir() if p.is_file() and p.suffix in ['.mjs','.json','.md','.cmd'])
files.extend(p for p in EV.iterdir() if p.is_file() and ((p.suffix in ['.png','.jpg','.json']) or p.name.startswith('final-')) and 'server' not in p.name and 'failure' not in p.name)
for path in ['evidence/browser/acceptance.json','evidence/browser/learning-acceptance.json']:
 if (ROOT/path).is_file():files.append(ROOT/path)
files=sorted(set(files));manifest=[{'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
arc=OUT/'AI学院-0.4.1-RC1-本机运行与技术证据.zip'
with ZipFile(arc,'w',ZIP_DEFLATED) as z:
 for p,m in zip(files,manifest):z.write(p,m['path'])
 z.writestr('SHA256_MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with ZipFile(arc) as z:
 for m in manifest:assert hashlib.sha256(z.read(m['path'])).hexdigest()==m['sha256']
 dest=(EV/'package-extracted').resolve();assert dest.is_relative_to(ROOT.resolve());dest.mkdir(parents=True,exist_ok=True)
 for item in z.infolist():assert (dest/item.filename).resolve().is_relative_to(dest)
 z.extractall(dest)
receipt={'archive':str(arc.relative_to(ROOT)),'bytes':arc.stat().st_size,'sha256':hashlib.sha256(arc.read_bytes()).hexdigest(),'verifiedFiles':len(manifest),'extracted':str(dest.relative_to(ROOT)),'noRuntimeInstallRequired':True,'minimumRuntime':'Node 22+','excluded':'All browser personal storage, provider/server logs, identity data, raw audio/recording and historical submission artifacts'}
(EV/'package-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
print('RC_ZIP_OK',receipt['verifiedFiles'],receipt['bytes'],receipt['sha256'])
