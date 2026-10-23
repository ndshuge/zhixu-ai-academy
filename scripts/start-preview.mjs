import {createAcademyServer} from '../server.mjs';
const port=Number(process.argv[2]||4387);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid port');
const server=createAcademyServer();
server.listen(port,'127.0.0.1',()=>console.log('AI_ACADEMY_PREVIEW_READY 127.0.0.1:'+port));
