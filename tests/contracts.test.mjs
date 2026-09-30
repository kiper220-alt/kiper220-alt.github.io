import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {binaryIndex} from '../src/doc/acquisition.ts';
import {resolveBranchProvider} from '../src/doc/provides.ts';
import {resolvePackage} from '../src/doc/model.ts';

const data=JSON.parse(readFileSync(new URL('./fixtures/acquisition-contracts.json',import.meta.url)));
for(const fixture of data.binary)test(`binary contract: ${fixture.name}`,()=>{
  const run=()=>binaryIndex(fixture.data,data.branch,data.arch);
  if(fixture.error)assert.throws(run);else assert.deepEqual(run(),fixture.expected);
});
for(const fixture of data.providers)test(`Provides contract: ${fixture.name}`,async()=>{
  const run=()=>resolveBranchProvider(data.branch,data.alias,data.arch,data.index,fixture.data,async hash=>fixture.metadata[hash]);
  if(fixture.error)await assert.rejects(run);
  else {
    const result=await run();
    assert.deepEqual(result,fixture.expected);
    const resolution=resolvePackage({arch:data.arch,packages:result.packages,providers:{[data.alias]:result.record}},data.alias);
    assert.equal(resolution.kind,result.record.candidates.length>1?'ambiguous':result.record.candidates.length?'provided':'missing');
  }
});
test('Python consumes the identical binary and Provides contract fixtures',()=>{
  execFileSync('python3',['tests/contracts_reader_test.py'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
});
