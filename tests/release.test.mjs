import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareRelease } from '../scripts/prepare-release.mjs';
import { releaseEntry, validateRelease, sha256 } from '../src/doc/release.ts';
import { resolvePackage, compareImageSnapshot } from '../src/doc/model.ts';

const date='2026-09-30T08:00:00Z';
function image(arch) {
  const definitions={tag:'1.0-alt1',revision:'a'.repeat(40),source:'fixture:git',
    categories:{tools:{name:'tools',title:'Tools'}},components:{tool:{name:'tool',title:'Tool',packages:{tool:{},alias:{}}}},
    editions:Object.fromEntries(['edition_server','edition_domain'].map(name=>[name,{name,title:name,arches:['x86_64','aarch64'],sections:{base:{title:'Base',components:['tool']}}}]))};
  return {schema:1,id:`fixture-${arch}`,release:'11.1',inventoryKind:'image',arch,source:'fixture:ISO',obtainedAt:date,definitions,
    packages:{'alt-editions-server':{evr:'1.0-alt1',source:'alt-components-base',arch:'noarch',hash:'edition-hash',epochKnown:false},
      tool:{evr:'1.0-alt1',source:'tool',arch,hash:`tool-${arch}`,epochKnown:false}},providers:{}};
}
async function preparationFixture() {
  const directory=await mkdtemp(join(tmpdir(),'release-fixture-')),inputDir=join(directory,'input'),outputDir=join(directory,'release');
  await mkdir(inputDir);
  for(const arch of ['x86_64','aarch64']) {
    const value=image(arch);
    await writeFile(join(inputDir,`image-11.1-${arch}.json`),JSON.stringify(value));
    await writeFile(join(inputDir,`p11-${arch}.json`),JSON.stringify({definitions:value.definitions}));
  }
  return {release:'11.1',inputDir,outputDir,verify:false,intervalMs:0,log:()=>{}};
}

test('release preparation confirms historical epoch by hash and publishes both architectures atomically',async()=>{
  const options=await preparationFixture(),calls=[];
  const request=async url=>{
    calls.push(url); const hash=url.split('/').at(-1).split('?')[0];
    return Response.json({pkghash:hash,changelog:[{evr:'1:1.0-alt1'}]});
  };
  const manifest=await prepareRelease({...options,request});
  const before=[];
  for(const arch of ['x86_64','aarch64']) {
    const entry=releaseEntry(manifest,'11.1',arch),bytes=new Uint8Array(await readFile(join(options.outputDir,entry.file)));
    assert.equal(await sha256(bytes),entry.sha256);
    const fixed=JSON.parse(new TextDecoder().decode(bytes));
    validateRelease(fixed,'11.1',arch,entry);
    assert.equal(fixed.packages.tool.evr,'1:1.0-alt1');
    assert.equal(fixed.packages.tool.epochKnown,true);
    assert.equal(resolvePackage(fixed,'future-alias').kind,'unknown');
    assert.equal(resolvePackage(fixed,'alias').kind,'missing');
    before.push(bytes);
  }
  const callCount=calls.length;
  assert.deepEqual(await prepareRelease({...options,request}),manifest);
  assert.equal(calls.length,callCount,'repeated preparation must not refresh a frozen release');
  for(const [i,arch]of ['x86_64','aarch64'].entries()) assert.deepEqual(new Uint8Array(await readFile(join(options.outputDir,manifest.architectures[arch].file))),before[i]);
});

test('wrong hash, wrong version and unavailable metadata never publish a partial release',async()=>{
  for(const mode of ['hash','version','HTTP','second-architecture']) {
    const options=await preparationFixture();
    const request=async url=>{
      const hash=url.split('/').at(-1).split('?')[0];
      if(mode==='HTTP'||mode==='second-architecture'&&hash.includes('aarch64'))return new Response('',{status:503});
      return Response.json({pkghash:mode==='hash'?'wrong':hash,changelog:[{evr:mode==='version'?'1:9.0-alt1':'1:1.0-alt1'}]});
    };
    await assert.rejects(prepareRelease({...options,request}));
    await assert.rejects(access(options.outputDir));
  }
});

test('release validators reject identity, historical definitions and unproven Provides',()=>{
  const valid={...image('x86_64'),frozenAt:date,providerCheckedNames:['tool','alias']};
  validateRelease(valid,'11.1','x86_64');
  assert.throws(()=>validateRelease(valid,'11.1','aarch64'));
  assert.throws(()=>validateRelease({...valid,definitions:{...valid.definitions,tag:'2.0-alt1'}},'11.1','x86_64'));
  assert.throws(()=>validateRelease({...valid,providers:{alias:{candidates:['tool'],source:'fixture:unproven',complete:false}}},'11.1','x86_64'));
  assert.throws(()=>releaseEntry({schema:1,release:'11.1',preparedAt:date,architectures:{x86_64:{file:'../../anything.json'}}},'11.1','x86_64'));
  const after={...valid,branch:'p11',definitions:valid.definitions,packages:{...valid.packages,tool:{...valid.packages.tool,evr:'2.0-alt1'}}};
  assert.match(compareImageSnapshot(valid,after,'edition_server')[0].rows.find(row=>row.name==='tool').change,/epoch образа неизвестен/);
});

for(const arch of ['x86_64','aarch64']) test(`published fixed 11.1 baseline is valid and independent of p11 for ${arch}`,async()=>{
  const base=new URL('../public/releases/11.1/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
  const entry=releaseEntry(manifest,'11.1',arch),bytes=new Uint8Array(await readFile(new URL(entry.file,base)));
  assert.equal(await sha256(bytes),entry.sha256);
  const fixed=JSON.parse(new TextDecoder().decode(bytes)); validateRelease(fixed,'11.1',arch,entry);
  assert.ok(Object.keys(fixed.packages).length>3000);
  const incomplete=fixed.providerCheckedNames.filter(name=>fixed.packages[name]&&!fixed.packages[name].epochKnown);
  assert.deepEqual(incomplete,[],'all tracked literal ISO RPMs must have confirmed epoch');
  assert.equal(fixed.packages['hplip-gui'].evr,'1:3.25.8-alt3');
  assert.equal(resolvePackage(fixed,'gvfs-utils').name,'libgio');
});
