import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryCache } from '../src/doc/cache.ts';
import { RuntimePriority, VerificationQueue } from '../src/doc/queue.ts';

test('comparison cache is isolated from local settings and can be cleared', async () => {
  const cache = memoryCache();
  await cache.put('image:uuid:x86_64', { uuid: 'fixed', packages: { p: 1 } });
  await cache.put('config', { groups: ['manual'] });
  assert.deepEqual(await cache.get('image:uuid:x86_64'), { uuid: 'fixed', packages: { p: 1 } });
  await cache.clear();
  assert.equal(await cache.get('image:uuid:x86_64'), undefined);
  assert.equal(await cache.get('config'), undefined);
});

test('verification queue prioritizes selected package and component', async () => {
  const priority = new RuntimePriority();
  priority.setComponent(['component-package']);
  priority.setPackage('selected-package');
  const order = [], controller = new AbortController();
  const queue = new VerificationQueue(priority, controller.signal, () => {});
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  for (const key of ['ordinary', 'ordinary-2', 'ordinary-3']) queue.add({ key, names: [key], weight: 0, run: async () => { order.push(key); await blocked; } });
  for (const key of ['ordinary-4', 'component-package', 'selected-package']) queue.add({
    key, names: [key], weight: 0, run: async () => { order.push(key); },
  });
  release();
  queue.seal();
  await queue.done;
  assert.ok(order.indexOf('selected-package') < order.indexOf('ordinary-4'));
  assert.ok(order.indexOf('component-package') < order.indexOf('ordinary-4'));
  // Three workers may start in parallel; priority is guaranteed for queued
  // work once a slot opens, not by pretending parallel requests are ordered.
  assert.equal(new Set(order).size, 6);
});
