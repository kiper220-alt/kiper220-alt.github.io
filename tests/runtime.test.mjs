import test from 'node:test';
import assert from 'node:assert/strict';
import {binaryIndex,imageIndex,definitionsFromArchive,loadRuntime,API,GIT_API} from '../src/doc/runtime.ts';
import {archiveFor} from './runtime-fixtures.mjs';
import {compareImageSnapshot} from '../src/doc/model.ts';
import { sha256 } from '../src/doc/release.ts';

const defs=tag=>({tag,revision:(tag==='1.0-alt1'?'a':'b').repeat(40),source:'fixture',
  categories:{tools:{name:'tools',title:'Утилиты'}},components:{tool:{name:'tool',title:'Tool',category:'tools',packages:{tool:{},alias:{},optional:{arch:['aarch64']},kernel:{kernel_module:true}}}},
  editions:Object.fromEntries(['edition_server','edition_domain'].map(name=>[name,{name,title:name,arches:['x86_64','aarch64'],sections:{base:{title:'Базовые',components:['tool']}}}]))});
const row=(name,version,source=name,arch='noarch',extra={})=>({name,version,release:'alt1',source,arch,epoch:0,...extra});
function fixture(options={}){
  const old=defs('1.0-alt1'),current=defs('2.0-alt1');
  if(options.composition)delete current.components.tool.packages.tool;
  const calls=[];
  const imageRows=[row('alt-editions-server','1.0','alt-components-base','noarch',{hash:'iso-edition'}),row('tool','1.0','tool','x86_64',{hash:'iso-tool'}),row('provider','1.0','source','x86_64',{hash:'iso-provider'})];
  const image = {schema:1,id:'iso-11.1',release:'11.1',inventoryKind:'image',arch:'x86_64',
    obtainedAt:'2026-09-30T08:00:00Z',frozenAt:'2026-09-30T09:00:00Z',source:'fixture:ISO',definitions:old,
    packages:imageIndex({request_args:{uuid:'iso-11.1'},length:imageRows.length,packages:imageRows},'iso-11.1',{}),
    providerCheckedNames:['tool','alias'],providers:{alias:{candidates:['provider'],complete:false,
      evidence:{provider:`${API}/dependencies/binary_package_dependencies/iso-provider`},source:'fixture:historical proof'}}};
  if(!options.badEpoch) Object.assign(image.packages.tool,{evr:'1:1.0-alt1',epochKnown:true,epochSource:`${API}/site/package_changelog/iso-tool?changelog_last=1`});
  const releaseBytes = new TextEncoder().encode(JSON.stringify(image));
  const manifest = sha256(releaseBytes).then(digest=>({schema:1,release:'11.1',preparedAt:image.frozenAt,architectures:{x86_64:{
    file:`x86_64-${digest}.json`,sha256:digest,uuid:image.id,arch:'x86_64',packageCount:3,definitionTag:old.tag,definitionRevision:old.revision,
  }}}));
  const request=async(url,config)=>{
    calls.push({url,config});
    const u=new URL(url,'https://fixture.invalid'),path=u.pathname,q=u.searchParams;
    let value;
    if(path.endsWith('/manifest.json')) {
      if(options.httpError)return new Response('unavailable',{status:503});
      value=await manifest;
    } else if(path.startsWith('/releases/')) {
      return new Response(options.badChecksum ? new TextEncoder().encode('{}') : releaseBytes);
    } else if(path.includes('/branch_binary_packages/')){
      const branch=path.split('/').at(-1),arch=q.get('arch');
      const packages=arch==='noarch'?[row('alt-components-base','2.0','alt-components-base'),row('alt-editions-server','2.0','alt-components-base')]:[row('tool',branch==='p11'?'2.0':'3.0','tool',arch,{epoch:1}),row('provider','2.0','source',arch)];
      value={request_args:{branch,arch},length:packages.length,packages};
      if(options.broken===branch)value.length++;
    }else if(path.endsWith('image_uuid_by_tag'))value={request_args:{tag:q.get('tag')},uuid:'iso-11.1'};
    else if(path.endsWith('image_packages'))value={request_args:{uuid:'iso-11.1'},length:imageRows.length,packages:imageRows};
    else if(path.endsWith('source_package_versions'))value={request_args:{name:'alt-components-base'},versions:[
      {branch:'sisyphus',version:'9.0',release:'alt1',pkghash:'wrong'},
      {branch:'p11',version:'2.0',release:'alt1',pkghash:options.badHash?'':'source-hash'},
    ]};
    else if(path.includes('/tags/')){
      const tag=path.split('/').at(-1),d=tag==='1.0-alt1'?old:current;
      value={name:options.wrongTag?'master':tag,commit:{sha:d.revision}};
    }else if(path.includes('/archive/')){
      const d=path.endsWith(`/${old.revision}.zip`)?old:current;
      return new Response(archiveFor(d),{headers:{'Content-Type':'application/zip'}});
    }else if(path.endsWith('packages_by_dependency'))value={request_args:{branch:q.get('branch'),dp_name:'alias',dp_type:'provide'},length:1,packages:[row('provider','2.0','source','x86_64',{hash:'branch-provider'})]};
    else if(path.includes('binary_package_dependencies')){
      const pkghash=path.split('/').at(-1);
      value={request_args:{pkghash},length:1,dependencies:[{name:options.badProvides?'unrelated':'alias',type:'provide'}]};
    }else if(path.includes('package_changelog'))value={pkghash:options.badEpoch?'wrong':'iso-tool',changelog:[{evr:'1:1.0-alt1'}]};
    else throw new Error(`Unexpected fixture request: ${url}`);
    if(options.httpError&&path.includes('image_packages'))return new Response('unavailable',{status:503});
    return Response.json(value);
  };
  return{request,calls,image};
}
test('actual TOML archive preserves package options and edition sections',()=>{
  const d=defs('1.0-alt1'),normalized=definitionsFromArchive(archiveFor(d),d.tag,d.revision);
  assert.deepEqual(JSON.parse(JSON.stringify(normalized.components.tool.packages)),d.components.tool.packages);
  assert.deepEqual(normalized.editions,d.editions);
  assert.throws(()=>definitionsFromArchive(archiveFor({...d,components:{}}),d.tag,d.revision),/Нет определения компонента/);
});
test('repository and ISO inventories reject wrong identity, partial data and invalid RPMs',()=>{
  const packages=[row('tool','1.0')],data={request_args:{branch:'p11',arch:'noarch'},length:1,packages};
  assert.equal(binaryIndex(data,'p11','noarch').tool.evr,'1.0-alt1');
  for(const bad of [{...data,length:2},{...data,packages:[]},{...data,packages:[{...packages[0],epoch:-1}]},{...data,packages:[{...packages[0],source:''}]}])assert.throws(()=>binaryIndex(bad,'p11','noarch'));
  assert.throws(()=>binaryIndex(data,'sisyphus','noarch'));
  const image={request_args:{uuid:'fixed'},length:1,packages:[{...packages[0],hash:'exact-hash'}]};
  assert.equal(imageIndex(image,'fixed',{}).tool.epochKnown,false);
  assert.throws(()=>imageIndex(image,'other',{}));
  assert.throws(()=>imageIndex({...image,length:2},'fixed',{}));
});
test('runtime uses a fixed release and dynamic branches without querying historical endpoints',async()=>{
  const{request,calls,image}=fixture(),controller=new AbortController(),progress=[]; let completed;
  const result=await loadRuntime('x86_64',{request,signal:controller.signal,detailIntervalMs:0,progress:p=>progress.push(p),update:r=>{if(r.stage==='complete')completed=r;}});
  assert.equal(result.stage,'base');
  while(!completed) await new Promise(resolve=>setTimeout(resolve,1));
  const final=completed;
  assert.equal(final.current.definitions.tag,'2.0-alt1');
  assert.equal(final.image.definitions.tag,'1.0-alt1');
  assert.equal(final.image.id,'iso-11.1');
  assert.equal(final.current.packages.tool.evr,'1:2.0-alt1');
  assert.equal(final.sisyphus.packages.tool.evr,'1:3.0-alt1');
  assert.equal(final.image.packages.tool.evr,'1:1.0-alt1');
  assert.deepEqual(final.image.providers.alias.candidates,['provider']);
  assert.equal(final.image.providers.alias.complete,false);
  assert.deepEqual(final.image,image);
  assert.ok(calls.some(c=>c.url.includes('/releases/11.1/')));
  assert.ok(!calls.some(c=>/\/image\/|\/tags\/1\.0-alt1|\/archive\/a{40}|\/iso-provider|\/iso-tool/.test(c.url)));
  assert.ok(calls.every(c=>c.url.startsWith(API)||c.url.startsWith(GIT_API)||c.url.startsWith('/releases/')));
  assert.ok(calls.every(c=>c.config.cache==='no-store'&&c.config.credentials==='omit'&&c.config.signal===controller.signal));
  assert.equal(final.metrics.requests,calls.length);
  assert.ok(final.metrics.bytes>0&&progress.length>0);
  assert.equal(compareImageSnapshot(final.image,final.current,'edition_server')[0].rows.find(r=>r.name==='tool').change,'обновлён');
});
test('composition is computed in runtime independently of version updates',async()=>{
  const{request}=fixture({composition:true});
  const r=await loadRuntime('x86_64',{request,signal:new AbortController().signal,detailIntervalMs:0});
  assert.equal(compareImageSnapshot(r.image,r.current,'edition_server')[0].rows.find(p=>p.name==='tool').composition,'исключён из компонента');
});
test('broken exports, source builds, tags, Provides and HTTP errors never produce a partial comparison',async()=>{
  for(const options of[{broken:'p11'},{badHash:true},{wrongTag:true},{httpError:true},{badChecksum:true}]){
    const{request,calls}=fixture(options);
    await assert.rejects(loadRuntime('x86_64',{request,signal:new AbortController().signal,detailIntervalMs:0}));
    assert.ok(!calls.some(c=>c.url.includes('doc-data')));
  }
  const supplementary=fixture({broken:'sisyphus'}); let final;
  await loadRuntime('x86_64',{request:supplementary.request,signal:new AbortController().signal,detailIntervalMs:0,update:r=>{if(r.stage==='complete')final=r;}});
  while(!final) await new Promise(resolve=>setTimeout(resolve,1));
  assert.match(final.sisyphusError,/Sisyphus/);
  const providers=fixture({badProvides:true}); final=undefined;
  await loadRuntime('x86_64',{request:providers.request,signal:new AbortController().signal,detailIntervalMs:0,update:r=>{if(r.stage==='complete')final=r;}});
  while(!final) await new Promise(resolve=>setTimeout(resolve,1));
  assert.ok(final.metrics.failed>0);
});
test('an incomplete static epoch remains unknown without fetching or modifying the baseline',async()=>{
  const{request}=fixture({badEpoch:true}); let r;
  await loadRuntime('x86_64',{request,signal:new AbortController().signal,detailIntervalMs:0,update:value=>{if(value.stage==='complete')r=value;}});
  while(!r) await new Promise(resolve=>setTimeout(resolve,1));
  assert.equal(r.image.packages.tool.evr,'1.0-alt1');
  assert.equal(r.image.packages.tool.epochKnown,false);
  assert.equal(compareImageSnapshot(r.image,r.current,'edition_server')[0].rows.find(p=>p.name==='tool').change,'изменился version-release; epoch образа неизвестен');
});
test('runtime can be cancelled and each new load requests its sources again',async()=>{
  const{request,calls}=fixture(),controller=new AbortController();
  controller.abort();
  await assert.rejects(loadRuntime('x86_64',{request,signal:controller.signal,detailIntervalMs:0}));
  assert.equal(calls.length,0);
  for(let i=0;i<2;i++)await loadRuntime('x86_64',{request,signal:new AbortController().signal,detailIntervalMs:0});
  assert.equal(calls.filter(c=>c.url.includes('/manifest.json')).length,2);
  assert.equal(calls.filter(c=>c.url.includes('/image_uuid_by_tag')).length,0);
  assert.equal(calls.filter(c=>c.url.includes('/branch_binary_packages/p11?arch=x86_64')).length,2);
});
