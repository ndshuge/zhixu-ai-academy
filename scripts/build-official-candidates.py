from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree
import json,hashlib
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'evidence/rc-20261012/forms-reference'
OUT=ROOT/'submission/rc-20261012';OUT.mkdir(parents=True,exist_ok=True)
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W='{'+NS['w']+'}'
INTRO='关键词：科学探究、证据学习、概念迁移、规则导师。AI学院面向高校抽象科学概念学习，将未预选前测、事前预测、真实PFL/EvoWorld计算、学生批准的单变量对照、客观错题、可否认误区及新变式复习连接成证据链。新版V0.4主舞台与生命生态箱同源加载，观测可回到个人学习记录。现已通过本机科学与教学软件回归，适用于课堂演示和经同意的匿名试测。当前为规则模式，未接真实LLM，真人样本0，不宣称提分或现实因果结论。'
assert len(INTRO)<=300
def put(cell,text):
 p=cell.find(W+'p');r=etree.SubElement(p,W+'r');t=etree.SubElement(r,W+'t');t.text=text
def replace(doc,old,new):
 for p in doc.xpath('//w:p',namespaces=NS):
  ts=p.xpath('.//w:t',namespaces=NS);joined=''.join(t.text or '' for t in ts);pos=joined.find(old)
  if pos<0:continue
  cursor=0;end=pos+len(old);inserted=False
  for t in ts:
   raw=t.text or '';a,b=cursor,cursor+len(raw)
   if b>pos and a<end:
    keep=raw[:max(0,pos-a)]+(new if not inserted else '')+raw[max(0,end-a):]
    t.text=keep;inserted=True
   cursor=b
  return
 raise ValueError('Template slot missing: '+old)
records=[]
for src,name in [('简介原件.docx','官方简介-待实名签署.docx'),('承诺书原件.docx','官方承诺书-待本人审核签署.docx')]:
 with ZipFile(BASE/src) as z:
  original=z.read('word/document.xml');doc=etree.fromstring(original)
  if src.startswith('简介'):
   rows=doc.xpath('//w:tr',namespaces=NS)
   put(rows[0].xpath('./w:tc',namespaces=NS)[1],'AI学院')
   put(rows[1].xpath('./w:tc',namespaces=NS)[1],'AI+高等教育（AI+教学）')
   put(rows[11].xpath('./w:tc',namespaces=NS)[1],INTRO)
  else:
   replace(doc,'《____________》','《AI学院》')
   replace(doc,'参赛赛道：____________________________________','参赛赛道：AI+高等教育（AI+教学）')
  changed=etree.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
  with ZipFile(OUT/name,'w',ZIP_DEFLATED) as dest:
   for entry in z.infolist():dest.writestr(entry,changed if entry.filename=='word/document.xml' else z.read(entry.filename))
 with ZipFile(BASE/src) as a,ZipFile(OUT/name) as b:
  assert set(a.namelist())==set(b.namelist());assert all(a.read(x)==b.read(x) for x in a.namelist() if x!='word/document.xml')
 records.append({'source':src,'candidate':name,'sourceSHA256':hashlib.sha256((BASE/src).read_bytes()).hexdigest(),'preservedParts':len(a.namelist())-1,'onlyChangedPart':'word/document.xml','signed':False})
(OUT/'作品简介-300字候选.txt').write_text(INTRO,encoding='utf-8')
(BASE/'artifact.md').write_text('官方模板为唯一排版权威。仅替换作品名、赛道、300字简介；身份、所在单位、联系信息、日期、签字均保留空白。承诺书原文完整保留，参赛者需亲自审核其知识产权和真实性措辞后签署。所有其它OOXML部件逐字节保留。参考与候选PDF由本机隐藏Word导出，因默认LibreOffice不可用。\n'+json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'evidence/rc-20261012/forms-fidelity.json').write_text(json.dumps({'records':records,'introCharacters':len(INTRO),'identityFilled':False,'signatureAdded':False},ensure_ascii=False,indent=2),encoding='utf-8')
print('OFFICIAL_UNSIGNED_CANDIDATES_OK',len(INTRO))
