import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchSourceChangelog} from '../src/doc/changelog.ts';

const pkg={evr:'1:2.0-alt2',source:'fixture-source',arch:'x86_64'};
const response=data=>({ok:true,json:async()=>data});
const versions={request_args:{name:pkg.source},versions:[
  {branch:'sisyphus',version:'2.0',release:'alt2',pkghash:'sisy-log'},
  {branch:'p11',version:'3.0',release:'alt1',pkghash:'newer-history'},
  {branch:'p11',version:'2.0',release:'alt2',pkghash:'p11-log'},
]};

test('changelog follows the selected branch and the exact snapshot version',async()=>{
  for (const branch of ['p11','sisyphus']) {
    const urls=[];
    const hash=branch==='p11'?'p11-log':'sisy-log';
    const entries=[{evr:pkg.evr,message:branch}];
    const log=await fetchSourceChangelog(branch,pkg,undefined,async url=>{
      urls.push(url);
      return response(url.includes('source_package_versions')?versions:{pkghash:hash,changelog:entries});
    });
    assert.deepEqual(log,entries);
    assert.match(urls[1],new RegExp(`/package_changelog/${hash}\\?`));
    assert.ok(!urls.some(url=>url.includes('newer-history')));
  }
});

test('missing or ambiguous builds never borrow another branch or version',async()=>{
  for (const rows of [versions.versions.filter(v=>v.branch==='p11'),
    [{branch:'sisyphus',version:'9.0',release:'alt1',pkghash:'wrong'}],
    [...versions.versions,{branch:'sisyphus',version:'2.0',release:'alt2',pkghash:'ambiguous'}]]) {
    let requests=0;
    await assert.rejects(fetchSourceChangelog('sisyphus',pkg,undefined,async()=>{
      requests++;
      return response({...versions,versions:rows});
    }),/не подтверждена в Sisyphus/);
    assert.equal(requests,1);
  }
});

test('wrong source, wrong changelog hash and HTTP failure stay explicit',async()=>{
  await assert.rejects(fetchSourceChangelog('p11',pkg,undefined,async()=>response({...versions,request_args:{name:'wrong'}})),/несоответствующие данные/);
  await assert.rejects(fetchSourceChangelog('p11',pkg,undefined,async url=>response(
    url.includes('source_package_versions')?versions:{pkghash:'sisy-log',changelog:[]})),/не подтвердил выбранную сборку/);
  await assert.rejects(fetchSourceChangelog('p11',pkg,undefined,async()=>({ok:false,status:503})),/HTTP 503/);
});

test('the caller can cancel obsolete branch requests',async()=>{
  const controller=new AbortController();
  const signals=[];
  await fetchSourceChangelog('p11',pkg,controller.signal,async(url,options)=>{
    signals.push(options.signal);
    return response(url.includes('source_package_versions')?versions:{pkghash:'p11-log',changelog:[]});
  });
  assert.equal(signals.length,2);
  assert.ok(signals.every(signal=>signal instanceof AbortSignal&&!signal.aborted));
});
