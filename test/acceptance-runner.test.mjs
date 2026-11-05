import test from 'node:test';
import assert from 'node:assert/strict';
import { accept, redact, changed } from '../scripts/acceptance-runner.mjs';
const sha = 'a'.repeat(40);
function fixture(overrides = {}) {
  const calls = [];
  const io = {
    meta: () => ({ head: sha, base: 'b'.repeat(40), fork: false }),
    step: (name) => calls.push(name),
    snapshot: () => 'clean',
    bundle: (state) => JSON.stringify(state),
    save: (body) => calls.push(['save', body]),
    publish: (body) => { calls.push('publish'); return { id: 1, body }; },
    read: (posted) => posted.body,
    ...overrides,
  };
  return { io, calls };
}
test('fixed sequence, independent case and exact publication readback', async () => {
  const { io, calls } = fixture();
  const result = await accept('53', sha, io);
  assert.equal(result.status, 'CHECKS_COMPLETED');
  assert.deepEqual(calls.filter(x => typeof x === 'string'),
    ['checkout', 'install', 'independent', 'full', 'docs', 'preserve', 'publish']);
});
test('bad parameters and stale/fork candidate stop before commands', async () => {
  for (const args of [['0', sha], ['1', 'short'], ['1;whoami', sha]]) {
    const { io, calls } = fixture();
    await assert.rejects(accept(...args, io)); assert.equal(calls.length, 0);
  }
  for (const meta of [{ head: 'c'.repeat(40), fork: false }, { head: sha, fork: true }]) {
    const { io, calls } = fixture({ meta: () => meta });
    await assert.rejects(accept('53', sha, io)); assert.equal(calls.length, 0);
  }
});
test('failure is saved, later commands do not run, never publishes PASS', async () => {
  const { io, calls } = fixture({ step: n => { calls.push(n); if (n === 'full') throw Error('exit 1'); } });
  await assert.rejects(accept('53', sha, io), /exit 1/);
  assert.equal(calls.includes('docs'), false);
  assert.match(calls.find(x => Array.isArray(x))[1], /BLOCKED/);
  assert.equal(calls.includes('publish'), false);
});
test('preservation and readback failures remain failures', async () => {
  let count = 0;
  const first = fixture({ snapshot: () => String(count++) });
  await assert.rejects(accept('53', sha, first.io), /preservation/);
  assert.equal(first.calls.includes('publish'), false);
  const second = fixture({ read: () => 'changed' });
  await assert.rejects(accept('53', sha, second.io), /readback/);
});
test('head change during checks prevents publication', async () => {
  let count = 0;
  const { io, calls } = fixture({ meta: () => ({ head: count++ ? 'c'.repeat(40) : sha, fork: false }) });
  await assert.rejects(accept('53', sha, io), /head/);
  assert.equal(calls.includes('publish'), false);
});
test('redaction covers authorization, tokens, assignments and private keys', () => {
  const source = 'bEaReR abcDEF\npassword="secret space"\nghp_1234567890abcdef\n-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----';
  const clean = redact(source);
  for (const secret of ['abcDEF', 'secret space', 'ghp_1234567890abcdef', '\nabc\n']) assert.equal(clean.includes(secret), false);
});
test('unchanged state never launches; failed launch is not acknowledged', async () => {
  let launches = 0;
  await assert.rejects(changed(undefined, undefined, () => launches++), /invalid state/);
  assert.equal(await changed('same', 'same', () => launches++), false);
  assert.equal(launches, 0);
  await assert.rejects(changed('old', 'new', () => { throw Error('unavailable'); }));
  assert.equal(await changed('old', 'new', () => launches++), true);
  assert.equal(launches, 1);
});
