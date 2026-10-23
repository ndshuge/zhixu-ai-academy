/** Strict allowlist filename audit for the standalone AI Academy application.
 * Video production, QQ inbox, generated evidence, and local private state are not application delivery inputs.
 * No file contents, credential paths, or secrets are read or copied.
 */
import {readdir} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const directories=['public','adapters'];
const appFiles=['server.mjs','model-provider.mjs','judge-sessions.mjs','agent-planner.mjs','llm-science-planner.mjs','teaching-quality.mjs','package.json','project.manifest.json'];
const skip=new Set(['node_modules','.git','.next','coverage','dist','build']);
let count=0,blocked=0;
const isUnsafe=n=>{n=n.toLowerCase();return n==='.env'||n.startsWith('.env.')&&n!=='.env.example'||['auth.json','credentials.json','.npmrc','.netrc','id_rsa','id_ed25519'].includes(n)||['.pem','.pfx','.p12','.key','.secret.json','.secrets.json','_token.txt','_key.txt'].some(s=>n.endsWith(s))};
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink())continue;if(e.isDirectory()){if(!skip.has(e.name))await walk(resolve(dir,e.name))}else if(e.isFile()){count++;if(isUnsafe(e.name))blocked++}}}
for(const d of directories)await walk(resolve(root,d));
for(const f of appFiles){if(isUnsafe(f))blocked++;count++}
console.log('APP_DELIVERY_FILENAME_AUDIT files='+count+' blocked='+blocked);
console.log('SCOPE application only; does not approve videos, local assets inbox, proofs, Git history, or deployed archive');
if(blocked)process.exitCode=1;
