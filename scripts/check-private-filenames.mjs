/**
 * Filename-only release safety preflight.
 * Deliberately does NOT open or inspect authentication files, env files, or secrets.
 * PASS is only a filename hygiene check, not a complete credential audit.
 */
import { readdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

const ROOT=resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const SKIP=new Set(['node_modules','.git','.next','dist','build','coverage']);
const isSensitiveName=name=>{
  const n=name.toLowerCase();
  return n==='.env' || (n.startsWith('.env.') && n!=='.env.example') ||
    n==='auth.json' || n==='credentials.json' || n==='.npmrc' ||
    n==='.netrc' || n==='id_rsa' || n==='id_ed25519' ||
    n.endsWith('.pem') || n.endsWith('.pfx') || n.endsWith('.p12') ||
    n.endsWith('.key') || n.endsWith('.secret.json') ||
    n.endsWith('.secrets.json') || n.endsWith('_token.txt') || n.endsWith('_key.txt');
};
const isSensitiveDir=name=>['.opencode','.secrets','.credentials','secrets','credentials'].includes(name.toLowerCase());
let inspectedFiles=0,blocked=0,dirWarnings=0;
async function visit(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.isSymbolicLink())continue; // do not follow symlinks beyond the project
    if(entry.isDirectory()){
      if(SKIP.has(entry.name))continue;
      if(isSensitiveDir(entry.name)){dirWarnings++;continue}
      await visit(resolve(dir,entry.name));
    }else if(entry.isFile()){
      inspectedFiles++;
      if(isSensitiveName(entry.name))blocked++;
    }
  }
}
await visit(ROOT);
console.log('SAFE_RELEASE_FILENAME_CHECK file_count='+inspectedFiles+
  ' sensitive_filename_count='+blocked+' sensitive_directory_count='+dirWarnings);
if(blocked||dirWarnings){
  console.error('BLOCK: credential-like filenames detected. No filenames or file contents were printed.');
  process.exitCode=1;
}else{
  console.log('PASS filename-only check. Not a content/history/screenshot secret scan.');
}
