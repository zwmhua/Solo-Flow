import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/check-docs.mjs', import.meta.url));
const required = ['README.md', 'WORKFLOW.md', 'MODEL_ROUTING.md', 'QA-HANDOFF.md', 'docs/workbench/data-contract-v0.md'];

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'solo-docs-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (name, text = 'document\n') => {
    const file = path.join(root, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text, 'utf8');
  };
  for (const name of required) put(name);
  const run = () => spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  return { root, put, run };
}

function fails(result, ...parts) {
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  for (const part of parts) assert.ok((result.stderr + result.stdout).includes(part), `missing ${part} in output`);
}

test('existing links, references, fenced examples and non-source templates', t => {
  const { put, run } = fixture(t);
  put('target space.md');
  put('templates/example.md', '[ignored](missing.md)');
  put('project-skeleton/example.md', '[ignored](missing.md)');
  put('README.md', [
    '[file](target%20space.md?x=1#part) ![image](target%20space.md)',
    '[reference][ok] [shortcut] [https](https://example.invalid) [mail](mailto:a@b)',
    '[protocol](//example.invalid/a) [anchor](#part) `inline [no](missing.md)`',
    '[ok]: target%20space.md', '[shortcut]: /target%20space.md',
    '```js', '[ignored](missing.md)', '```', '~~~markdown', '[ignored](missing.md)', '~~~',
    '[template](templates/example.md) [skeleton](project-skeleton/example.md)',
  ].join('\n'));
  put('docs/workbench/nested.md', '[root](../../README.md)');
  const result = run();
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});

for (const name of required) {
  test(`missing required document: ${name}`, t => {
    const { root, run } = fixture(t);
    rmSync(path.join(root, name));
    fails(run(), name);
  });
  test(`empty required document: ${name}`, t => {
    const { put, run } = fixture(t);
    put(name, '  \n');
    fails(run(), name);
  });
}

test('missing docs directory and directory used as required file fail', t => {
  const { root, run } = fixture(t);
  rmSync(path.join(root, 'docs'), { recursive: true });
  fails(run(), 'docs');
  mkdirSync(path.join(root, 'README.md.dir'));
  rmSync(path.join(root, 'README.md'));
  mkdirSync(path.join(root, 'README.md'));
  fails(run(), 'README.md');
});

for (const [name, body, target] of [
  ['README.md', '[bad](missing.md)', 'missing.md'],
  ['docs/workbench/nested.md', '[bad](missing.md)', 'missing.md'],
  ['README.md', '![bad](missing.png)', 'missing.png'],
  ['README.md', '[bad][ref]\n[ref]: missing.md', 'missing.md'],
  ['README.md', '```\n[ignored](x)\n```\n[bad](after.md)', 'after.md'],
  ['WORKFLOW.md', '[template](templates/missing.md)', 'templates/missing.md'],
  ['README.md', '[bad](../outside.md)', '../outside.md'],
  ['README.md', '[bad](%2e%2e/outside.md)', '%2e%2e/outside.md'],
  ['README.md', '[bad](%ZZ)', '%ZZ'],
]) {
  test(`reject ${name}: ${target}`, t => {
    const { put, run } = fixture(t);
    put(name, body);
    fails(run(), name, target);
  });
}

test('unreadable document is reported as failure', t => {
  const { root, run } = fixture(t);
  rmSync(path.join(root, 'docs/workbench/data-contract-v0.md'));
  mkdirSync(path.join(root, 'docs/workbench/data-contract-v0.md'));
  fails(run(), 'docs/workbench/data-contract-v0.md');
});

test('document read permission failure is reported', t => {
  if (process.platform === 'win32' || process.getuid?.() === 0) return t.skip('permission semantics unavailable');
  const { root, run } = fixture(t);
  const file = path.join(root, 'docs/workbench/data-contract-v0.md');
  const mode = statSync(file).mode & 0o777;
  try {
    chmodSync(file, 0);
    fails(run(), 'docs/workbench/data-contract-v0.md', 'EACCES');
  } finally {
    chmodSync(file, mode);
  }
});

test('symlink outside repository is rejected when symlinks are available', t => {
  const { root, put, run } = fixture(t);
  try { symlinkSync(tmpdir(), path.join(root, 'outside'), 'dir'); }
  catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) return t.skip(`symlink unavailable: ${error.code}`);
    throw error;
  }
  put('README.md', '[outside](outside)');
  fails(run(), 'README.md', 'outside');
});
