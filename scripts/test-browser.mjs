import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/';
const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,
  ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'inherit'});
function run(file) {
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[file],{stdio:'inherit',env:{...process.env,TEST_BASE_URL:base}});
    const timer=setTimeout(()=>{child.kill('SIGTERM');reject(new Error(`Browser test timed out: ${file}`));},180000);
    child.on('error',error=>{clearTimeout(timer);reject(error);});
    child.on('exit',(code,signal)=>{
      clearTimeout(timer);
      if(code===0)resolve();else reject(new Error(`${file}: exit ${code}, signal ${signal}`));
    });
  });
}
try {
  if(server) {
    let ready=false;
    for(let attempt=0;attempt<80;attempt++) {
      if(server.exitCode!==null)throw new Error('Preview server failed to start');
      try {ready=(await fetch(base,{signal:AbortSignal.timeout(1000)})).ok;} catch {}
      if(ready)break;
      await delay(250);
    }
    if(!ready)throw new Error('Preview server did not become ready');
  }
  for(const name of ['runtime','provides','changelog','pending'])await run(`tests/browser-${name}.mjs`);
} finally {server?.kill('SIGTERM');}
