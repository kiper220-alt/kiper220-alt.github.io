import test from 'node:test';
import assert from 'node:assert/strict';
import { changeFilters, matchesFilters, matchesComponentChange, matchesPackageChange, packagesForChangeFilter } from '../src/doc/change-filters.ts';

const version = evr => ({evr, source:'fixture', arch:'x86_64'});
const component = rows => ({name:'fixture', title:'fixture', section:'base', isNew:false, removed:false, moved:false, rows, kernelModules:[], kernelModulesChanged:false, reason:''});
const updated = {name:'updated',before:version('1-alt1'),after:version('2-alt1'),change:'updated'};
const unchanged = {name:'same',before:version('1-alt1'),after:version('1-alt1'),change:'unchanged'};

test('version filters select only matching package rows within a component', () => {
  const down = {...updated,name:'down',change:'downgraded'};
  const row = component([updated,down,unchanged]);
  assert.equal(matchesComponentChange(row,'updated'),true);
  assert.deepEqual(packagesForChangeFilter(row,'updated'),[updated]);
  assert.deepEqual(packagesForChangeFilter(row,'downgraded'),[down]);
  assert.equal(matchesComponentChange(row,'unchanged'),false);
  assert.deepEqual(packagesForChangeFilter(row,''),row.rows);
});

test('disappearance from p11 is separate from ISO absence and missing data', () => {
  const removed = {name:'removed',before:version('1-alt1'),change:'missing-p11',availability:'missing-p11'};
  const noImage = {name:'optional',after:version('1-alt1'),change:'missing-image'};
  const noData = {name:'unresolved',change:'missing-both',availability:'missing-both'};
  assert.equal(matchesPackageChange(removed,'missing-p11'),true);
  assert.equal(matchesPackageChange(noImage,'missing-p11'),false);
  assert.equal(matchesPackageChange(noData,'missing-p11'),false);
  assert.equal(matchesPackageChange(noImage,'no-image'),true);
  assert.equal(matchesPackageChange(noData,'missing-both'),true);
  assert.equal(matchesComponentChange(component([noImage]),'changed'),false);
  assert.equal(matchesComponentChange(component([removed]),'changed'),true);
});

test('composition filters include secondary changes and component membership changes', () => {
  const added = {...updated,composition:'included'};
  const excluded = {...unchanged,composition:'excluded'};
  assert.equal(matchesPackageChange(added,'included'),true);
  assert.equal(matchesPackageChange(excluded,'excluded'),true);
  assert.equal(matchesComponentChange(component([added]),'composition'),true);
  for(const [flag,filter] of [['isNew','new-component'],['removed','removed-component'],['moved','moved']]) {
    const row={...component([unchanged]),[flag]:true};
    assert.equal(matchesComponentChange(row,filter),true);
    assert.equal(matchesComponentChange(row,'changed'),true);
    assert.equal(matchesComponentChange(row,'unchanged'),false);
  }
});

test('uncertain data and kernel selectors are not reported as unchanged', () => {
  const uncertain={...updated,change:'version-changed-epoch-unknown'};
  assert.equal(matchesComponentChange(component([uncertain]),'uncertain'),true);
  assert.equal(matchesComponentChange(component([uncertain]),'unchanged'),false);
  const kernel={...component([unchanged]),kernelModules:['kernel-modules-fixture']};
  assert.equal(matchesComponentChange(kernel,'kernel-modules'),true);
  assert.equal(matchesComponentChange(kernel,'unchanged'),false);
  assert.equal(matchesComponentChange(component([unchanged]),'unchanged'),true);
  assert.equal(new Set(changeFilters.map(filter=>filter.value)).size,changeFilters.length);
});

test('main list is compact and contains no component or data states',()=>{
  assert.equal(changeFilters.length,6);
  assert.deepEqual(changeFilters.map(f=>f.value),['','updated','included','excluded','provider-changed','unchanged']);
});

test('the unchanged option selects unchanged packages, not only unchanged components',()=>{
  const added={name:'optional',after:version('2-alt1'),change:'included',composition:'included',availability:'missing-image'};
  const row=component([updated,added,unchanged]);
  assert.equal(matchesFilters(row,'updated'),true);
  assert.deepEqual(packagesForChangeFilter(row,'included'),[added]);
  assert.deepEqual(packagesForChangeFilter(row,'unchanged'),[unchanged]);
  assert.equal(matchesFilters(row,'unchanged'),true);
  assert.equal(matchesComponentChange(row,'unchanged'),false);
});

test('all packages retains components without literal RPM rows; version filters do not',()=>{
  const row={...component([]),kernelModules:['kernel-modules-fixture']};
  assert.equal(matchesFilters(row,''),true);
  assert.equal(matchesFilters(row,'updated'),false);
});
