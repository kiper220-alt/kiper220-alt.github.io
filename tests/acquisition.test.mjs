import test from 'node:test';
import {execFileSync} from 'node:child_process';

test('offline Provides acquisition, historical verification, cache and failure handling',()=>{
  execFileSync('python3',['tests/provides_reader_test.py'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
});

test('automatic p11 catalogue selection, source verification and safe updates',()=>{
  execFileSync('python3',['tests/catalogue_reader_test.py'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
});
