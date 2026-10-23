// Copy the canonical doctor widget into the existing app.js bundle.
// RC4 serves /app.js without a service restart, preserving in-memory BYOK sessions.
import {readFile,writeFile} from 'node:fs/promises';
const root=process.cwd();
const path=root+'/public/app.js';
const widgetPath=root+'/public/mentor-ui.js';
const marker='\n// ZHIXU_DOCTOR_WIDGET_HOT_RC4\n';
const app=await readFile(path,'utf8'),widget=await readFile(widgetPath,'utf8');
const start=app.indexOf(marker);
if(start<0||app.indexOf(marker,start+marker.length)!==-1)throw Error('Missing or repeated hot-widget boundary');
const tail=app.slice(start+marker.length);
if(!tail.startsWith('(()=>{')||!tail.trimEnd().endsWith('})();'))throw Error('Unexpected hot-widget suffix, refusing unsafe replacement');
const packed=app.slice(0,start)+marker+'(()=>{\n'+widget.trimEnd()+'\n})();\n';
await writeFile(path,packed,'utf8');
console.log('RC4_DOCTOR_HOT_SYNC_OK',packed.length);
