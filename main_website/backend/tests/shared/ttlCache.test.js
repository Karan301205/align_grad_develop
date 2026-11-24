// The short in-process cache behind the job list, the shared job page and the recruiter count.
const test = require('node:test');
const assert = require('node:assert');
const { cached, invalidate } = require('../../src/shared/cache/ttlCache');

test('a cached value is reused until it expires', async () => {
  let loads = 0;
  const load = async () => ++loads;
  assert.strictEqual(await cached('t:a', 50, load), 1);
  assert.strictEqual(await cached('t:a', 50, load), 1, 'still cached');
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.strictEqual(await cached('t:a', 50, load), 2, 'reloaded after expiry');
});

test('requests that miss at the same moment share one load', async () => {
  let loads = 0;
  const load = () => new Promise((resolve) => setTimeout(() => resolve(++loads), 20));
  const results = await Promise.all([1, 2, 3, 4, 5].map(() => cached('t:burst', 1000, load)));
  assert.deepStrictEqual(results, [1, 1, 1, 1, 1]);
  assert.strictEqual(loads, 1);
});

test('invalidate drops matching keys, and a load that started before it is not kept', async () => {
  let loads = 0;
  await cached('t:jobs:open', 1000, async () => ++loads);
  await cached('t:other', 1000, async () => 'kept');
  invalidate('t:jobs:');
  assert.strictEqual(await cached('t:jobs:open', 1000, async () => ++loads), 2);
  assert.strictEqual(await cached('t:other', 1000, async () => 'reloaded'), 'kept');

  let finish;
  const slow = cached('t:slow', 1000, () => new Promise((resolve) => { finish = resolve; }));
  invalidate('t:slow');
  finish('old');
  assert.strictEqual(await slow, 'old', 'the waiting caller still gets its answer');
  assert.strictEqual(await cached('t:slow', 1000, async () => 'new'), 'new', 'but it was not stored');
});

test('a failed load is not cached', async () => {
  await assert.rejects(cached('t:fail', 1000, async () => { throw new Error('db down'); }), /db down/);
  assert.strictEqual(await cached('t:fail', 1000, async () => 'ok'), 'ok');
});
