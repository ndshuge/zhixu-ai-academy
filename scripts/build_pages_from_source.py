from pathlib import Path
import argparse,re,shutil,json,hashlib,posixpath
BASE=Path(__file__).resolve().parents[1]
def patch_html(t,path):
 def repl(m):
  attr,quote,url=m.group(1),m.group(2),m.group(3)
  if url.startswith('//'): return m.group()
  tail=url[1:]
  route=tail.split('?')[0].split('#')[0]
  routes={'':'index.html','connect':'connect.html','learning':'learning.html','study':'study.html','explore':'explore.html','admin':'admin.html'}
  if route in routes:tail=routes[route]+tail[len(route):]
  target=tail.split('?')[0].split('#')[0]
  if not target:target='index.html'
  if target.endswith('/'):target+='index.html'
  rel=posixpath.relpath(target,path.parent.as_posix() or '.')
  if not rel.startswith('.'):rel='./'+rel
  suffix=tail[len(tail.split('?')[0].split('#')[0]):]
  return attr+'='+quote+rel+suffix+quote
 return re.sub(r'(src|href)=(["\x27])(/[^"\x27]*)\2',repl,t)
def assemble(root,out):
 source=root/'public'; overlay=root/'pages-overlay'
 if out.exists():shutil.rmtree(out)
 shutil.copytree(source,out)
 for f in out.rglob('*.html'):
  orig=f.read_text(encoding='utf-8-sig')
  f.write_text(patch_html(orig,f.relative_to(out)),encoding='utf8')
 # CSS /labs/* absolute resource references break under /zhixu-ai-academy/ subpath.
 for css in out.rglob('*.css'):
  text=css.read_text(encoding='utf-8-sig')
  def patch_asset(m):
   target=m.group(2).lstrip('/')
   rel=posixpath.relpath(target,css.relative_to(out).parent.as_posix() or '.')
   if not rel.startswith('.'):rel='./'+rel
   return 'url('+m.group(1)+rel+m.group(1)+')'
  patched=re.sub(r'url\(\s*(["\x27]?)(/[^)"\x27]+)\1\s*\)',patch_asset,text)
  if patched!=text:css.write_text(patched,encoding='utf8')
 # Root-level JavaScript is authored for the original Node server root.
 # Only rewrite static navigation and imports; NEVER rewrite /api/* calls.
 for js in out.glob('*.js'):
  text=js.read_text(encoding='utf-8-sig')
  before=text
  for route in ('connect','admin','learning','study','explore'):
   for quote in ("'",'"'):
    text=text.replace(quote+'/'+route+quote,quote+'./'+route+'.html'+quote)
    text=text.replace(quote+'/'+route+'?',quote+'./'+route+'.html?')
    text=text.replace('href='+quote+'/'+route,'href='+quote+'./'+route+'.html')
  text=text.replace("from '/learning-store.js'","from './learning-store.js'")
  text=text.replace('from "/learning-store.js"','from "./learning-store.js"')
  text=text.replace("='/labs/'","='./labs/'")
  text=text.replace('="/labs/"','="./labs/"')
  text=text.replace("='/?experiment=","='./index.html?experiment=")
  text=text.replace('="/?experiment=','="./index.html?experiment=')
  if text!=before:js.write_text(text,encoding='utf8')
 # Bundled PFL module starts Web Workers using the old root-absolute /labs URL.
 # Its JS is in assets/, so ./simulation.worker-* resolves correctly under Pages.
 for chunk in (out/'labs/pfl/assets').glob('*.js'):
  original=chunk.read_text(encoding='utf8')
  fixed=original.replace('/labs/pfl/assets/simulation.worker-', './simulation.worker-')
  if fixed!=original:chunk.write_text(fixed,encoding='utf8')

 for name in ('index.html','learning.html','study.html','explore.html'):
  p=out/name;s=p.read_text(encoding='utf8')
  if name=='index.html':
   marker='<script type="module" src="./app.js"></script>'
   if marker not in s:raise RuntimeError('Main app script marker missing')
   s=s.replace(marker,'<script src="./pages-api-shim.js"></script>'+marker,1)
   s=s.replace('</body>','<script defer src="./original-pages-byok.js"></script></body>',1)
  else:
   marker='</head>'
   if marker not in s:raise RuntimeError('Head marker missing: '+name)
   s=s.replace(marker,'<script defer src="./pages-api-shim.js"></script></head>',1)
  p.write_text(s,encoding='utf8')
 for name in ('connect.html','admin.html','original-pages-byok.js','pages-api-shim.js','pages-evo-pair.mjs','technical-evidence-summary.json'):
  shutil.copy2(overlay/name,out/name)
 q=(root/'quiz-bank.mjs').read_text(encoding='utf8')
 (out/'pages-quiz-bank.mjs').write_text('// Browser-local grade rubric adapted from original server source; publicly inspectable.\n'+q,encoding='utf8')
 app=out/'app.js';a=app.read_text(encoding='utf8')
 a=a.replace("s.providerSource==='judge-session'","(s.providerSource==='judge-session'||s.providerSource==='browser-BYOK')")
 a=a.replace('Key 仅保存在服务端','Key 仅保存在当前网页会话内存')
 a=a.replace('（Key 仅保留在服务端）','（Key 仅保存在本标签页内存中）')
 app.write_text(a,encoding='utf8')
 (out/'.nojekyll').write_text('',encoding='utf8')
 assert 'pages-api-shim.js' in (out/'index.html').read_text(encoding='utf8')
 assert (out/'assets/zhixu-doctor/welcome.webp').exists()
 assert (out/'labs/evo/src/core/world.mjs').exists()
 return sorted(p.relative_to(out).as_posix() for p in out.rglob('*') if p.is_file())
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--root',default=str(BASE));parser.add_argument('--out',required=True)
 args=parser.parse_args()
 root=Path(args.root).resolve();out=Path(args.out).resolve()
 if out==root or out==root/'public':raise SystemExit('unsafe destination')
 names=assemble(root,out)
 print('BUILT_PUBLIC_PAGES',len(names),'files','bytes',sum((out/p).stat().st_size for p in names))
