import {copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=join(fileURLToPath(new URL('../',import.meta.url)),'evidence','rc3-20261012','acceptance');
await copyFile(join(base,'browser-classic.log'),join(base,'initial-failed-browser-classic.log'));
await copyFile(join(base,'summary.json'),join(base,'initial-failed-summary.json'));
console.log('RC3_FAILED_FIRST_RUN_ARCHIVED');
