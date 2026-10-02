import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpClient,readResponse} from '../src/doc/http.ts';
import {fetchSourceChangelog} from '../src/doc/changelog.ts';

test('timeouts bound response headers and body, including transports that ignore cancellation', async () => {
  for(const request of [()=>new Promise(()=>{}),async()=>({ok:true,arrayBuffer:()=>new Promise(()=>{})})]) {
    const client=createHttpClient({signal:new AbortController().signal,request,timeoutMs:10});
    await assert.rejects(client.bytes('https://fixture.invalid'),{name:'TimeoutError'});
  }
});

test('caller cancellation aborts the transport and preserves its reason', async () => {
  const controller=new AbortController();
  let started,requestSignal;
  const ready=new Promise(resolve=>{started=resolve;});
  const pending=readResponse('https://fixture.invalid',{signal:controller.signal},async(_,options)=>{
    requestSignal=options.signal;
    started();
    return new Promise(()=>{});
  },response=>response.json());
  await ready;
  const reason=new Error('selection changed');
  controller.abort(reason);
  await assert.rejects(pending,error=>error===reason);
  assert.equal(requestSignal.aborted,true);
});

test('HTTP 429 retries are bounded and waiting can be cancelled', async () => {
  const controller=new AbortController();
  let calls=0;
  const client=createHttpClient({signal:controller.signal,request:async()=>{
    calls++;return new Response('',{status:429,headers:{'Retry-After':'30'}});
  },onRetry:()=>controller.abort()});
  await assert.rejects(client.json('https://fixture.invalid'),{name:'AbortError'});
  assert.equal(calls,1);
});

test('changelog requests also time out', async () => {
  await assert.rejects(fetchSourceChangelog('p11',{source:'fixture',evr:'1-alt1',arch:'noarch'},undefined,
    ()=>new Promise(()=>{}),10),{name:'TimeoutError'});
});
