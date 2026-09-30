// Test-only network fixtures. No loader hooks or fixture URLs in production.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {zipSync,strToU8} from 'fflate';
import {stringify} from 'smol-toml';
export const readSnapshot=name=>{
  if(name.startsWith('image-11.1-')) {
    const arch=name.slice('image-11.1-'.length),base=new URL('../public/releases/11.1/',import.meta.url);
    const manifest=JSON.parse(readFileSync(new URL('manifest.json',base)));
    return JSON.parse(readFileSync(new URL(manifest.architectures[arch].file,base)));
  }
  return JSON.parse(readFileSync(new URL(`../public/doc-data/${name}.json`,import.meta.url)));
};
export function archiveFor(defs) {
  const files={};
  const put=(path,raw)=>files[`fixture-root/${path}`]=strToU8(stringify(raw));
  for(const value of Object.values(defs.categories))put(`categories/${value.name}.category`,{name:value.name,category:value.parent,display_name:{ru:value.title}});
  for(const value of Object.values(defs.components))put(value.path||`components/${value.name}/${value.name}.component`,{name:value.name,category:value.category,display_name:{ru:value.title},packages:value.packages});
  for(const value of Object.values(defs.editions))put(`editions/${value.name}/${value.name}.edition`,{name:value.name,display_name:{ru:value.title},arches:value.arches,sections:Object.fromEntries(Object.entries(value.sections).map(([name,sec])=>[name,{display_name:{ru:sec.title},components:sec.components}]))});
  return zipSync(files);
}
const split=pkg=>{
  const [version,release]=pkg.evr.replace(/^\d+:/,'').split('-');
  return{version,release,epoch:pkg.evr.includes(':')?Number(pkg.evr.split(':')[0]):0};
};
export async function fixtureRuntime(page, overrides={}) {
  const snapshots=Object.fromEntries(['x86_64','aarch64'].map(arch=>[arch,{
    p11:overrides.arch===arch&&overrides.p11||readSnapshot(`p11-${arch}`),
    sisyphus:overrides.arch===arch&&overrides.sisyphus||readSnapshot(`sisyphus-${arch}`),
    image:overrides.arch===arch&&overrides.image||readSnapshot(`image-11.1-${arch}`),
  }]));
  const observed=[];
  const releaseFiles = new Map();
  const manifest = {schema:1,release:'11.1',preparedAt:'2026-09-30T09:00:00Z',architectures:{}};
  for(const [arch,{image,p11}]of Object.entries(snapshots)) {
    image.frozenAt = manifest.preparedAt;
    image.providerCheckedNames = [...new Set([image,p11].flatMap(s=>Object.values(s.definitions.components).flatMap(c=>Object.keys(c.packages))))];
    for(const pkg of Object.values(image.packages)) if(pkg.epochKnown) pkg.epochSource = `https://rdb.altlinux.org/api/site/package_changelog/${pkg.hash}?changelog_last=1`;
    for(const record of Object.values(image.providers || {})) for(const actual of record.candidates) {
      if(image.packages[actual]) record.evidence={...record.evidence,[actual]:`https://rdb.altlinux.org/api/dependencies/binary_package_dependencies/${image.packages[actual].hash}`};
    }
    const bytes = Buffer.from(JSON.stringify(image));
    const digest = createHash('sha256').update(bytes).digest('hex'),file=`${arch}-${digest}.json`;
    releaseFiles.set(file,bytes);
    manifest.architectures[arch] = {file,sha256:digest,uuid:image.id,arch,packageCount:Object.keys(image.packages).length,
      definitionTag:image.definitions.tag,definitionRevision:image.definitions.revision};
  }
  await page.route('**/releases/11.1/**',route=>{
    const file=new URL(route.request().url()).pathname.split('/').at(-1);
    observed.push(route.request().url());
    if(file==='manifest.json')return route.fulfill({json:manifest});
    return releaseFiles.has(file)?route.fulfill({contentType:'application/json',body:releaseFiles.get(file)}):route.fulfill({status:404});
  });
  await page.route('https://rdb.altlinux.org/api/**',async route=>{
    const url=new URL(route.request().url()),path=url.pathname,params=url.searchParams;
    observed.push(url.href);
    const json=data=>route.fulfill({json:data});
    if(path.includes('/export/branch_binary_packages/')){
      const branch=path.split('/').at(-1),arch=params.get('arch');
      const selectedArch=arch==='noarch'?'x86_64':arch;
      const data=snapshots[selectedArch][branch];
      const packages=Object.entries(data.packages).filter(([,pkg])=>pkg.arch===arch).map(([name,pkg])=>({name,...split(pkg),source:pkg.source,arch}));
      // The edition RPM is bundled with the catalogue source package.
      if(branch==='p11'&&arch==='noarch'){
        const edition=packages.find(pkg=>pkg.name==='alt-editions-server');
        const value={name:'alt-editions-server',...split(data.packages['alt-components-base']),arch:'noarch',source:'alt-components-base'};
        if(edition)Object.assign(edition,value);else packages.push(value);
      }
      return json({request_args:{branch,arch},length:packages.length,packages});
    }
    if(path.endsWith('/image_uuid_by_tag')){
      const tag=params.get('tag'),arch=tag.includes(':aarch64:')?'aarch64':'x86_64';
      return json({request_args:{tag},uuid:snapshots[arch].image.id});
    }
    if(path.endsWith('/image_packages')){
      const uuid=params.get('uuid'),image=Object.values(snapshots).find(s=>s.image.id===uuid).image;
      const packages=Object.entries(image.packages).map(([name,pkg])=>({name,...split(pkg),arch:pkg.arch,hash:pkg.hash}));
      return json({request_args:{uuid},length:packages.length,packages});
    }
    if(path.endsWith('/source_package_versions')&&params.get('name')==='alt-components-base'){
      const data=snapshots.x86_64.p11;
      return json({request_args:{name:'alt-components-base'},versions:[{branch:'p11',...split(data.packages['alt-components-base']),pkghash:data.definitions.package?.sourceHash||'fixture-source'}]});
    }
    if(path.endsWith('/packages_by_dependency')){
      const branch=params.get('branch'),dp_name=params.get('dp_name');
      const rows=new Map();
      for(const { [branch]:data }of Object.values(snapshots))for(const actual of data.providers?.[dp_name]?.candidates||[]){
        const pkg=data.packages[actual];
        rows.set(`${actual}/${pkg.arch}`,{name:actual,...split(pkg),arch:pkg.arch,hash:pkg.hash||`fixture-${branch}-${actual}`});
      }
      const packages=[...rows.values()];
      return json({request_args:{branch,dp_name,dp_type:'provide'},length:packages.length,packages});
    }
    if(path.includes('/binary_package_dependencies/')){
      const hash=decodeURIComponent(path.split('/').at(-1)),provided=new Set();
      for(const group of Object.values(snapshots))for(const [branch,data]of Object.entries(group)){
        for(const [alias,record]of Object.entries(data.providers||{}))for(const actual of record.candidates){
          if((data.packages[actual]?.hash||`fixture-${branch}-${actual}`)===hash)provided.add(alias);
        }
      }
      const dependencies=[...provided].map(name=>({name,type:'provide'}));
      return json({request_args:{pkghash:hash},length:dependencies.length,dependencies});
    }
    if(path.includes('/package_changelog/')&&params.get('changelog_last')==='1'){
      const pkghash=decodeURIComponent(path.split('/').at(-1));
      const pkg=Object.values(snapshots).flatMap(s=>Object.values(s.image.packages)).find(p=>p.hash===pkghash);
      if(pkg)return json({pkghash,changelog:[{evr:pkg.evr}]});
    }
    return route.fallback();
  });
  await page.route('https://altlinux.space/api/v1/repos/alterator/alt-components-base/**',route=>{
    const path=new URL(route.request().url()).pathname;
    const defs=[snapshots.x86_64.image.definitions,snapshots.x86_64.p11.definitions];
    if(path.includes('/tags/')){
      const requested=decodeURIComponent(path.split('/').at(-1));
      const found=requested===snapshots.x86_64.p11.packages['alt-components-base'].evr.replace(/^\d+:/,'')?defs[1]:defs[0];
      return route.fulfill({json:{name:found.tag,commit:{sha:found.revision}}});
    }
    const found=defs.find(d=>path.endsWith(`/${d.revision}.zip`));
    return found?route.fulfill({contentType:'application/zip',body:Buffer.from(archiveFor(found))}):route.fulfill({status:404});
  });
  // Advance only fixture-time pacing; live timing tests never install this.
  await page.clock.install();
  let running=true;
  page.on('close',()=>{running=false;});
  void(async()=>{while(running){try{await page.clock.runFor(1000);}catch{break;}await new Promise(resolve=>setTimeout(resolve,20));}})();
  return {snapshots,observed};
}
