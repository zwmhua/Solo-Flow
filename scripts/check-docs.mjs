import fs from 'node:fs';
import path from 'node:path';

const root = fs.realpathSync(process.cwd());
const required = ['README.md', 'WORKFLOW.md', 'MODEL_ROUTING.md', 'QA-HANDOFF.md', 'docs/workbench/data-contract-v0.md'];
let errors = 0;
let targets = 0;
const documents = new Set(required);

function report(source, line, target, reason) {
  console.error(`${source}:${line}: ${target}: ${reason}`);
  errors++;
}

function withinRoot(file) {
  const relative = path.relative(root, file);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function safeReal(file) {
  if (!withinRoot(file)) throw new Error('path escapes repository');
  const resolved = fs.realpathSync(file);
  if (!withinRoot(resolved)) throw new Error('symlink escapes repository');
  return resolved;
}

function scanDirectory(dir) {
  try {
    const resolved = safeReal(dir);
    for (const entry of fs.readdirSync(resolved, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) scanDirectory(file);
      else if (entry.isSymbolicLink()) {
        const real = safeReal(file);
        if (fs.statSync(real).isDirectory()) throw new Error(`symlink directory is not supported: ${entry.name}`);
        if (/\.md$/i.test(entry.name)) documents.add(path.relative(root, file).split(path.sep).join('/'));
      } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
        documents.add(path.relative(root, file).split(path.sep).join('/'));
      }
    }
  } catch (error) { report(path.relative(root, dir).split(path.sep).join('/'), 0, dir, error.message); }
}

function checkTarget(source, line, raw) {
  let target = raw.trim();
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
  if (!target || target.startsWith('#') || target.startsWith('?') || target.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(target)) return;
  targets++;
  try {
    target = decodeURIComponent(target.split(/[?#]/, 1)[0]);
    if (target.includes('\\') || target.includes('\0')) throw new Error('invalid path');
    const file = target.startsWith('/') ? path.resolve(root, `.${target}`) : path.resolve(root, path.dirname(source), target);
    safeReal(file);
  } catch (error) { report(source, line, raw, error.message); }
}

function scanDocument(source) {
  let content;
  try {
    const file = safeReal(path.join(root, source));
    if (!fs.statSync(file).isFile()) throw new Error('not a file');
    content = fs.readFileSync(file, 'utf8');
    if (required.includes(source) && !content.trim()) throw new Error('required document is empty');
  } catch (error) { report(source, 0, source, error.message); return; }

  let fence = null;
  for (const [index, original] of content.split(/\r?\n/).entries()) {
    const marker = original.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      continue;
    }
    if (marker) { fence = { char: marker[1][0], length: marker[1].length }; continue; }
    const line = original.replace(/(`+)([\s\S]*?)\1/g, '');
    const definition = line.match(/^ {0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/);
    if (definition) checkTarget(source, index + 1, definition[1]);
    const links = /!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+['"][^'"]*['"])?\s*\)/g;
    for (const match of line.matchAll(links)) checkTarget(source, index + 1, match[1]);
  }
}

scanDirectory(path.join(root, 'docs'));
for (const source of [...documents].sort()) scanDocument(source);
if (errors) {
  console.error(`Document check failed: ${errors} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`Checked ${documents.size} documents and ${targets} local targets.`);
}
