import test from 'node:test';
import assert from 'node:assert/strict';
import {compareImageSnapshot, resolvePackage} from '../src/doc/model.ts';
import {matchesPackageChange, matchesComponentChange} from '../src/doc/change-filters.ts';

// Synthetic fixtures only; these are never included in published snapshots.
const rpm = (evr, source='fixture-source', arch='x86_64') => ({evr, source, arch, epochKnown:true});
const record = (candidates, complete=true) => ({candidates, complete, source:'fixture:lookup', evidence:Object.fromEntries(candidates.map(name=>[name,'fixture:exact-rpm']))});
const definitions = {revision:'fixture',tag:'fixture',source:'fixture',categories:{},components:{a:{name:'a',title:'Fixture',packages:{alias:{}}}},editions:{edition_server:{name:'edition_server',title:'Fixture',arches:['x86_64'],sections:{main:{title:'Main',components:['a']}}}}};
const snapshot = (packages, providers={}, image=false) => ({schema:1,id:'fixture',arch:'x86_64',source:'fixture',definitions,packages,providers,...(image?{release:'11.1',inventoryKind:'image'}:{branch:'p11',missingExplicit:[]})});
const compare = (before,after) => compareImageSnapshot(before,after,'edition_server')[0];

test('exact binary name takes precedence over Provides; no source-package inference',()=>{
  const data=snapshot({alias:rpm('1.0-alt1'),provider:rpm('2.0-alt1')},{alias:record(['provider'])});
  assert.equal(resolvePackage(data,'alias').kind,'direct');
  assert.equal(resolvePackage(data,'alias').package.evr,'1.0-alt1');
  assert.equal(resolvePackage(data,'another-binary-from-the-same-source').kind,'missing');
});

test('historical and branch Provides resolve independently and compare real RPM EVR',()=>{
  const before=snapshot({provider:rpm('1:2.0-alt1')},{alias:record(['provider'],false)},true);
  const after=snapshot({provider:rpm('1:2.0-alt2')},{alias:record(['provider'])});
  const row=compare(before,after), pkg=row.rows[0];
  assert.equal(pkg.name,'alias');
  assert.equal(pkg.beforeResolution.name,'provider');
  assert.equal(pkg.afterResolution.name,'provider');
  assert.equal(pkg.change,'обновлён');
  assert.equal(pkg.composition,undefined);
  assert.equal(row.reason,'Обновились пакеты');
  assert.equal(matchesPackageChange(pkg,'updated'),true);
  assert.equal(matchesPackageChange(pkg,'missing-both'),false);
});

test('multiple providers remain ambiguous, without arbitrary version or removal',()=>{
  const before=snapshot({one:rpm('1.0-alt1'),two:rpm('2.0-alt1')},{alias:record(['one','two'])},true);
  const after=snapshot({one:rpm('1.1-alt1')},{alias:record(['one'])});
  const row=compare(before,after),pkg=row.rows[0];
  assert.equal(pkg.beforeResolution.kind,'ambiguous');
  assert.equal(pkg.before,undefined);
  assert.equal(pkg.change,'неоднозначный поставщик RPM');
  assert.equal(matchesPackageChange(pkg,'uncertain'),true);
  assert.equal(matchesPackageChange(pkg,'no-image'),false);
  assert.equal(matchesComponentChange(row,'unchanged'),false);
});

test('missing candidate data or wrong architecture is unknown, not deletion',()=>{
  for(const packages of [{},{provider:rpm('1.0-alt1','fixture','aarch64')}]){
    const before=snapshot({provider:rpm('1.0-alt1')},{alias:record(['provider'])},true);
    const after=snapshot(packages,{alias:record(['provider'])});
    after.missingExplicit=['alias'];
    const pkg=compare(before,after).rows[0];
    assert.equal(pkg.afterResolution.kind,'unknown');
    assert.equal(pkg.change,'нет данных');
    assert.equal(pkg.availability,undefined);
    assert.equal(matchesPackageChange(pkg,'missing-p11'),false);
  }
});

test('negative targeted ISO lookup is incomplete and is not proof of absence',()=>{
  const before=snapshot({},{alias:record([],false)},true);
  const after=snapshot({provider:rpm('1.0-alt1')},{alias:record(['provider'])});
  const pkg=compare(before,after).rows[0];
  assert.equal(pkg.beforeResolution.kind,'unknown');
  assert.equal(pkg.change,'нет данных');
  assert.equal(matchesPackageChange(pkg,'no-image'),false);
});

test('a changed real provider is separate from update and definition composition',()=>{
  const before=snapshot({old:rpm('1.0-alt1')},{alias:record(['old'])},true);
  const after=snapshot({next:rpm('1.0-alt1')},{alias:record(['next'])});
  const row=compare(before,after),pkg=row.rows[0];
  assert.equal(pkg.change,'изменился поставщик RPM');
  assert.equal(pkg.providerChanged,true);
  assert.equal(pkg.composition,undefined);
  assert.equal(matchesComponentChange(row,'changed'),true);
  assert.equal(matchesPackageChange(pkg,'provider-changed'),true);
  assert.equal(matchesPackageChange(pkg,'updated'),false);
});

test('confirmed removal of a provider differs from missing provider metadata',()=>{
  const before=snapshot({provider:rpm('1.0-alt1')},{alias:record(['provider'])},true);
  const after=snapshot({},{alias:record([])});
  after.missingExplicit=['alias'];
  assert.equal(compare(before,after).rows[0].change,'отсутствует в p11');
  const unchanged=snapshot({provider:rpm('1.0-alt1')},{alias:record(['provider'])});
  assert.equal(compare(before,unchanged).rows[0].change,'без изменений');
});
