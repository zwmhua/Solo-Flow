import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
export function redact(text) {
  return String(text).replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, '[REDACTED KEY]')
    .replace(/\bBearer\s+[^\s"',;]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_-]+/g, '[REDACTED TOKEN]')
    .replace(/((?:password|passwd|secret|token|api[_-]?key)\s*["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1[REDACTED]');
}
export async function changed(previous, current, launch) {
  if (typeof previous !== 'string' || !current || typeof current !== 'string') throw Error('invalid state fingerprint');
  if (previous === current) return false;
  await launch();
  return true;
}
export async function accept(pr, sha, io) {
  if (!/^[1-9]\d*$/.test(pr) || !/^[0-9a-f]{40}$/.test(sha)) throw Error('invalid PR/SHA');
  const meta = await io.meta();
  if (meta.head !== sha || meta.fork) throw Error('head mismatch or fork');
  const state = { pr, sha, base: meta.base, status: 'RUNNING' };
  try {
    await io.step('checkout');
    await io.step('install');
    const before = await io.snapshot();
    for (const name of ['independent', 'full', 'docs', 'preserve']) await io.step(name);
    if (before !== await io.snapshot()) throw Error('preservation mismatch');
    if ((await io.meta()).head !== sha) throw Error('head changed');
    state.status = 'CHECKS_COMPLETED';
    const body = redact(await io.bundle(state));
    await io.save(body);
    const posted = await io.publish(body);
    if (await io.read(posted) !== body) throw Error('publication readback mismatch');
    return state;
  } catch (error) {
    state.status = 'BLOCKED';
    await io.save(redact(await io.bundle({ ...state, error: String(error) })));
    throw error;
  }
}
export function localAdapter(pr, sha, root) {
  const repo = 'zwmhua/Solo-Flow-Workbench';
  const caseFile = path.join(root, 'cases', pr + '-' + sha + '.test.mjs');
  if (!fs.existsSync(caseFile)) throw Error('missing independent case: ' + caseFile);
  fs.mkdirSync(path.join(root, 'runs'), { recursive: true });
  const output = fs.mkdtempSync(path.join(root, 'runs', pr + '-'));
  const work = path.join(output, 'candidate');
  const records = [];
  const hash = x => createHash('sha256').update(x).digest('hex');
  const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) =>
    /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|TEMP|TMP|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|COMSPEC)$/i.test(k)));
  function run(exe, args, cwd = output, auth = false) {
    const start = new Date().toISOString();
    const result = spawnSync(exe, args, { cwd, encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024,
      windowsHide: true, shell: false, env: auth ? process.env : { ...cleanEnv, CANDIDATE_DIR: work } });
    const log = { exe, args, start, end: new Date().toISOString(), exit: result.status,
      stdout: redact(result.stdout || ''), stderr: redact(result.stderr || ''), error: redact(result.error?.message || '') };
    records.push(redact(JSON.stringify(log)));
    fs.writeFileSync(path.join(output, 'commands.jsonl'), records.join('\n'), 'utf8');
    if (result.status !== 0 || result.error) throw Error('command failed: ' + exe + ' exit=' + result.status);
    return result.stdout;
  }
  const api = (route, args = []) => JSON.parse(run('gh', ['api', route, ...args], output, true));
  const git = args => run('git', args, work);
  const meta = () => {
    const value = api('repos/' + repo + '/pulls/' + pr);
    return { head: value.head.sha, base: value.base.sha, fork: value.head.repo?.full_name !== repo };
  };
  const io = {
    meta,
    step(name) {
      if (name === 'checkout') {
        run('git', ['clone', '--no-checkout', 'https://github.com/' + repo + '.git', work], output, true);
        git(['fetch', 'origin', 'refs/pull/' + pr + '/head']);
        if (git(['rev-parse', 'FETCH_HEAD']).trim() !== sha) throw Error('fetched head mismatch');
        git(['checkout', '--detach', sha]);
        if (git(['status', '--porcelain']).trim()) throw Error('dirty checkout');
      } else if (name === 'install') {
        const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
        run(process.execPath, [npm, 'ci', '--no-audit', '--no-fund'], work);
        git(['diff', '--exit-code', 'HEAD']);
      } else if (name === 'independent') {
        const log = run(process.execPath, ['--test', caseFile], work);
        if (!/\btests\s+[1-9]\d*/.test(log)) throw Error('no independent test evidence');
      } else if (name === 'full') {
        const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
        const log = run(process.execPath, [npm, 'test'], work);
        if (!/\btests\s+[1-9]\d*/.test(log)) throw Error('no full test evidence');
      } else if (name === 'docs') run(process.execPath, ['scripts/check-docs.mjs'], work);
      else if (name === 'preserve') git(['diff', '--exit-code', 'HEAD']);
    },
    snapshot() {
      const names = [...new Set(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean))].sort();
      return JSON.stringify(names.map(name => {
        const file = path.join(work, name);
        return [name, hash(fs.lstatSync(file).isSymbolicLink() ? fs.readlinkSync(file) : fs.readFileSync(file))];
      }));
    },
    bundle: state => JSON.stringify({ state, runner: redact(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')),
      independent: redact(fs.readFileSync(caseFile, 'utf8')), commands: records }, null, 2),
    save: body => fs.writeFileSync(path.join(output, 'evidence-' + hash(body) + '.txt'), body, 'utf8'),
    publish(body) {
      if (Buffer.byteLength(body) > 1000000) throw Error('evidence exceeds publication budget; local bundle retained');
      const parts = Array.from(body).join('').match(/[\s\S]{1,10000}/gu) || [];
      return parts.map((part, index) => {
        if (meta().head !== sha) throw Error('head changed before publication');
        const payload = { body: '验收固定脚本证据 ' + sha + ' ' + (index + 1) + '/' + parts.length + '\n\n' + part };
        const file = path.join(output, 'publish-' + index + '.json');
        fs.writeFileSync(file, JSON.stringify(payload), 'utf8');
        const posted = api('repos/' + repo + '/issues/' + pr + '/comments', ['--method', 'POST', '--input', file]);
        return { id: posted.id, expected: payload.body, part };
      });
    },
    read: posted => posted.map(item => {
      if (api('repos/' + repo + '/issues/comments/' + item.id).body !== item.expected) throw Error('publication readback mismatch');
      return item.part;
    }).join(''),
  };
  return io;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [pr, sha, ...extra] = process.argv.slice(2);
  if (extra.length || !/^[1-9]\d*$/.test(pr || '') || !/^[0-9a-f]{40}$/.test(sha || '')) throw Error('usage: node acceptance-runner.mjs PR SHA');
  await accept(pr, sha, localAdapter(pr, sha, path.dirname(fileURLToPath(import.meta.url))));
}
