import test from 'node:test';
import assert from 'node:assert/strict';
import { compareEVR, compareSnapshots, compareDefinitionsOnly, compareImageSnapshot, changelogRange, included, kernelModules, verifiedImageEVR, validP11Definitions } from '../src/doc/model.ts';

const component = (name, packages, category = 'infra') => ({ name, title: name, category, packages: Object.fromEntries(packages.map(p => [p, {}])) });
const defs = (components, sections = { base: ['a'], main: ['b'] }) => ({ revision: 'fixture', tag: 'fixture', source: 'fixture', categories: {}, components, editions: { edition_server: { name: 'edition_server', title: 'Server', arches: ['x86_64'], sections: Object.fromEntries(Object.entries(sections).map(([name, list]) => [name, { title: name, components: list }])) } } });
const pkg = (evr, source) => ({ evr, source, arch: 'x86_64' });
const old = { schema: 1, id: 'fixture-11.1', release: '11.1', arch: 'x86_64', source: 'fixture', frozenAt: '2026-03-29', inventoryComplete: true, definitions: defs({ a: component('a', ['one','two']), b: component('b', ['shared']) }), packages: { one: pkg('1.0-alt1','src-one'), two: pkg('1.0-alt1','src-two'), shared: pkg('1.0-alt1','src-common') }, repositoryAbsent: ['three','shared-extra'] };
const next = { schema: 1, id: 'fixture-p11', branch: 'p11', arch: 'x86_64', source: 'fixture', definitions: defs({ a: component('a', ['one','three']), b: component('b', ['shared','shared-extra']), c: component('c', ['shared']) }, { base: ['a'], main: ['b','c'] }), packages: { one: pkg('1.1-alt1','src-one'), two: pkg('1.0-alt1','src-two'), three: pkg('1.0-alt1','src-three'), shared: pkg('1.1-alt1','src-common'), 'shared-extra': pkg('1.1-alt1','src-common') }, missingExplicit: [] };

test('the catalogue accepts future p11 versions and rejects an unrelated tag or branch',()=>{
  const snapshot=structuredClone(next);
  snapshot.packages['alt-components-base']={evr:'1:0.10.9-alt1',source:'alt-components-base',arch:'noarch'};
  snapshot.definitions.tag='0.10.9-alt1';
  snapshot.definitions.editions.edition_domain=snapshot.definitions.editions.edition_server;
  assert.equal(validP11Definitions(snapshot),true);
  snapshot.definitions.package={name:'alt-components-base',evr:'1:0.10.9-alt1',branch:'p11',sourceHash:'fixture',metadataSource:'fixture:API'};
  assert.equal(validP11Definitions(snapshot),true);
  snapshot.definitions.tag='0.10.12-alt1';
  assert.equal(validP11Definitions(snapshot),false);
  snapshot.definitions.tag='0.10.9-alt1';
  snapshot.definitions.package.branch='sisyphus';
  assert.equal(validP11Definitions(snapshot),false);
  delete snapshot.definitions.package;
  delete snapshot.packages['alt-components-base'];
  assert.equal(validP11Definitions(snapshot),false);
});

test('epoch confirmation requires an exact version-release match and valid EVR',()=>{
  assert.equal(verifiedImageEVR('1.5-alt2','1:1.5-alt2'),'1:1.5-alt2');
  assert.equal(verifiedImageEVR('1.5-alt2','1.5-alt2'),'1.5-alt2');
  assert.equal(verifiedImageEVR('1.5-alt2','1:1.5-alt3'),undefined);
  assert.equal(verifiedImageEVR('1.5-alt2','- 1:1.5-alt2'),undefined);
  assert.equal(verifiedImageEVR('1.5-alt2',undefined),undefined);
});

test('RPM EVR order handles epoch, release, numeric, tilde, caret and downgrade', () => {
  const vectors = [
    ['1:1.0-alt1','0:99.0-alt99',1], ['1.0-alt2','1.0-alt10',-1],
    ['1.0~rc1-alt1','1.0-alt1',-1], ['1.0^git1-alt1','1.0-alt1',1],
    ['1.001-alt1','1.1-alt1',0], ['2.0-alt1','2.1-alt1',-1],
    ['1.0a-alt1','1.0-alt1',1], ['1.0-alt1','1.0-alt1',0],
  ];
  for (const [a,b,expected] of vectors) assert.equal(compareEVR(a,b), expected, `${a} vs ${b}`);
});

test('package additions, exclusions, versions, shared source and new components', () => {
  const rows = compareSnapshots(old, next, 'edition_server');
  const a = rows.find(r => r.name === 'a');
  assert.equal(a.rows.find(p => p.name === 'one').change, 'обновлён');
  assert.equal(a.rows.find(p => p.name === 'two').change, 'исключён из компонента');
  assert.equal(a.rows.find(p => p.name === 'three').change, 'появился в p11');
  assert.equal(a.rows.find(p => p.name === 'three').composition, 'включён в компонент');
  assert.equal(rows.find(r => r.name === 'c').isNew, true);
  assert.equal(rows.find(r => r.name === 'b').rows.find(p => p.name === 'shared').change, 'обновлён');
  assert.equal(rows.filter(r => r.rows.some(p => p.source === 'src-common')).length, 2);
});

test('definitions can be compared while release versions are unavailable', () => {
  const rows = compareDefinitionsOnly(old.definitions, next, 'edition_server');
  assert.equal(rows.find(r => r.name === 'a').rows.find(p => p.name === 'one').change, 'нет данных');
  assert.equal(rows.find(r => r.name === 'a').rows.find(p => p.name === 'three').change, 'включён в компонент');
  assert.equal(rows.find(r => r.name === 'c').isNew, true);
});

test('composition changes without version change and version changes without definition change', () => {
  const moved = structuredClone(next);
  moved.definitions.editions.edition_server.sections.base.components = [];
  moved.definitions.editions.edition_server.sections.main.components.push('a');
  moved.packages.one.evr = '1.0-alt1';
  const rows = compareSnapshots(old, moved, 'edition_server');
  assert.equal(rows.find(r => r.name === 'a').moved, true);
  const versionsOnly = structuredClone(old);
  versionsOnly.id = 'p11'; versionsOnly.branch = 'p11'; delete versionsOnly.release; versionsOnly.packages.one.evr = '1.1-alt1';
  const versionRows = compareSnapshots(old, versionsOnly, 'edition_server');
  assert.equal(versionRows.find(r => r.name === 'a').rows.find(p => p.name === 'one').change, 'обновлён');
  assert.equal(versionRows.find(r => r.name === 'a').moved, false);
});

test('partial data stays explicit and changelog range is bounded by versions', () => {
  assert.throws(() => compareSnapshots({ ...old, inventoryComplete: false }, next, 'edition_server'));
  const range = changelogRange([{evr:'1.2-alt1',message:'update'}], '1.0-alt1', '1.2-alt1');
  assert.equal(range.complete, false); assert.equal(range.entries.length, 1);
  assert.equal(changelogRange([], '2.0-alt1','1.0-alt1').complete, false);
  const malformed = changelogRange([{evr:'1.2-alt1'}, {evr:'- 0:4.0.0-0.5.alpha5.fc10'}], '1.0-alt1', '1.2-alt1');
  assert.equal(malformed.entries.length, 1);
  assert.match(malformed.reason, /Не удалось определить версии/);
});

test('old changelog records without versions do not make the release interval incomplete', () => {
  const entries = [
    {evr:'2.4.19-alt2',message:'current update'},
    {evr:'2.4.17-alt1',message:'another update'},
    {evr:'2.4.16-alt2',message:'ISO baseline'},
    ...Array.from({length:8}, () => ({evr:'',message:'historical record without a version'})),
  ];
  const range = changelogRange(entries,'2.4.16-alt2','2.4.19-alt2');
  assert.deepEqual(range.entries,entries.slice(0,2));
  assert.equal(range.complete,true);
  assert.equal(range.reason,'');
});

test('unversioned records inside the interval still disclose incomplete changelog', () => {
  const range = changelogRange([
    {evr:'1:2.0-alt2'}, {evr:'',message:'unclassified change'}, {evr:'1:2.0-alt1'},
    {evr:'',message:'unrelated old record'},
  ],'1:2.0-alt1','1:2.0-alt2');
  assert.equal(range.entries.length,1);
  assert.equal(range.complete,false);
  assert.match(range.reason,/Не удалось определить версии.*в сравниваемом диапазоне/);
});

test('records beyond the current snapshot version do not trigger interval warnings', () => {
  const entries = [
    {evr:'3.0-alt1'}, {evr:'',message:'later change'},
    {evr:'2.0-alt1'}, {evr:'1.0-alt1'}, {evr:''},
  ];
  const range = changelogRange(entries,'1.0-alt1','2.0-alt1');
  assert.deepEqual(range.entries,[entries[2]]);
  assert.equal(range.complete,true);
  assert.equal(range.reason,'');
});

test('a non-monotonic history cannot hide unversioned entries after the first baseline', () => {
  const range = changelogRange([
    {evr:'3.0-alt1'}, {evr:'1.0-alt1'}, {evr:''}, {evr:'2.0-alt1'}, {evr:'0.9-alt1'},
  ],'1.0-alt1','3.0-alt1');
  assert.equal(range.entries.length,2);
  assert.equal(range.complete,false);
  assert.match(range.reason,/Не удалось определить версии/);
  assert.deepEqual(changelogRange([{evr:''}], '1.0-alt1', '0:1.0-alt1'),{entries:[],complete:true,reason:''});
});

test('ISO absence is not repository absence; versions and composition still compare', () => {
  const image = structuredClone(old);
  image.inventoryKind = 'image';
  image.inventoryComplete = false;
  delete image.packages.two;
  image.packages.one.epochKnown = true;
  const rows = compareImageSnapshot(image, next, 'edition_server');
  const a = rows.find(r => r.name === 'a');
  assert.equal(a.rows.find(p => p.name === 'one').change, 'обновлён');
  assert.equal(a.rows.find(p => p.name === 'two').change, 'исключён из компонента');
  assert.equal(a.rows.find(p => p.name === 'three').change, 'включён в компонент');
  const sameDefinitions = structuredClone(next);
  sameDefinitions.packages.one.evr = '1.2-alt1';
  assert.equal(compareImageSnapshot(image, sameDefinitions, 'edition_server').find(r => r.name === 'a').rows.find(p => p.name === 'one').change, 'обновлён');
  const noImagePackage = structuredClone(image);
  delete noImagePackage.packages.one;
  assert.equal(compareImageSnapshot(noImagePackage, next, 'edition_server').find(r => r.name === 'a').rows.find(p => p.name === 'one').change, 'нет в образе 11.1');
  const epoch = structuredClone(next);
  epoch.packages.one.evr = '1:1.1-alt1';
  image.packages.one.epochKnown = false;
  assert.equal(compareImageSnapshot(image, epoch, 'edition_server').find(r => r.name === 'a').rows.find(p => p.name === 'one').change, 'изменился version-release; epoch образа неизвестен');
});

test('repository disappearance changes the component summary, not its definition composition', () => {
  const image = {...structuredClone(old), inventoryKind:'image'};
  const p11 = {...structuredClone(old), branch:'p11', release:undefined, missingExplicit:['one']};
  delete p11.packages.one;
  const row = compareImageSnapshot(image, p11, 'edition_server').find(r => r.name === 'a');
  assert.equal(row.rows.find(p => p.name === 'one').change, 'отсутствует в p11');
  assert.equal(row.rows.find(p => p.name === 'one').composition, undefined);
  assert.equal(row.reason, 'Пакет отсутствует в p11');
});

test('verified ISO epoch participates in RPM comparison; unknown data is not unchanged', () => {
  const image = {...structuredClone(old), inventoryKind:'image'};
  image.packages.one = {...pkg('1:1.0-alt1','src-one'), epochKnown:true};
  const p11 = {...structuredClone(old), branch:'p11', release:undefined};
  p11.packages.one.evr = '1:1.1-alt1';
  assert.equal(compareImageSnapshot(image,p11,'edition_server').find(r=>r.name==='a').rows.find(p=>p.name==='one').change,'обновлён');
  delete image.packages.two;
  delete p11.packages.two;
  p11.missingExplicit=['two'];
  const missing = compareImageSnapshot(image,p11,'edition_server').find(r=>r.name==='a').rows.find(p=>p.name==='two');
  assert.equal(missing.change,'нет в образе и p11');
});

test('kernel_module entries are selectors, not missing literal RPMs; architecture exclusions apply', () => {
  const definition = component('a', ['normal','kernel-modules-tripso','excluded']);
  definition.packages['kernel-modules-tripso']={kernel_module:true};
  definition.packages.excluded={exclude_arch:['x86_64']};
  assert.deepEqual(included(definition,'x86_64'),['normal']);
  assert.deepEqual(kernelModules(definition,'x86_64'),['kernel-modules-tripso']);
  const image={...structuredClone(old),inventoryKind:'image',definitions:defs({a:definition},{base:['a']})};
  const p11={...structuredClone(next),definitions:defs({a:definition},{base:['a']})};
  const row=compareImageSnapshot(image,p11,'edition_server')[0];
  assert.equal(row.rows.some(p=>p.name==='kernel-modules-tripso'),false);
  assert.deepEqual(row.kernelModules,['kernel-modules-tripso']);
});
