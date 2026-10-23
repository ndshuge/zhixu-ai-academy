import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=process.cwd(),pub=join(root,'public');
const file=join(pub,'app.js'),cssFile=join(pub,'style.css'),htmlFile=join(pub,'index.html');
let app=await readFile(file,'utf8'),css=await readFile(cssFile,'utf8'),html=await readFile(htmlFile,'utf8');
const widget=await readFile(join(pub,'mentor-ui.js'),'utf8');
const decoration=await readFile(join(pub,'mentor-ui.css'),'utf8');
if(!app.includes('ZHIXU_DOCTOR_WIDGET_HOT_RC4')){
 app+='\n// ZHIXU_DOCTOR_WIDGET_HOT_RC4\n(()=>{\n'+widget+'\n})();\n';
 await writeFile(file,app,'utf8');
}
if(!css.includes('ZHIXU_DOCTOR_STYLE_HOT_RC4')){
 css+='\n/* ZHIXU_DOCTOR_STYLE_HOT_RC4 */\n'+decoration+'\n';
 await writeFile(cssFile,css,'utf8');
}
html=html.replace('  <link rel="stylesheet" href="/mentor-ui.css"/>\n','');
html=html.replace('<script type="module" src="/mentor-ui.js"></script>','');
await writeFile(htmlFile,html,'utf8');
console.log('ZHIXU_DOCTOR_HOT_INSTALL_OK; refresh browser, no server restart');
