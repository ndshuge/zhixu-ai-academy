from pathlib import Path
import json
s=Path('public/app.js').read_text('utf-8')
a=s.index('const artMap=')+len('const artMap=')
b=s.index('};',a)+1
v=json.loads(s[a:b])
print('STATES',sorted(v.keys()))
print('COUNT',len(v))
