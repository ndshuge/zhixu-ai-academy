import requests,datetime
u="https://speech.platform.bing.com"
print("UTC",datetime.datetime.now(datetime.timezone.utc).isoformat())
for name, opts in [("DIRECT",{"proxies":{"http":None,"https":None}}),("CLASH",{"proxies":{"http":"http://127.0.0.1:7897","https":"http://127.0.0.1:7897"}})]:
 try:
  r=requests.get(u,timeout=7,**opts)
  print(name,r.status_code,r.url.split("/")[2],r.headers.get("server",""))
 except Exception as e:print(name,type(e).__name__,str(e)[:130])
