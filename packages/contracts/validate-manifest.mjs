#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node validate-manifest.mjs <manifest.json>');
  process.exit(2);
}
const data = JSON.parse(readFileSync(resolve(file), 'utf8'));
const required = ['version', 'channel', 'publishedAt', 'artifacts'];
for (const key of required) {
  if (!(key in data)) throw new Error(`missing ${key}`);
}
if (!['stable', 'preview'].includes(data.channel)) throw new Error('bad channel');
if (!Array.isArray(data.artifacts) || data.artifacts.length < 1) throw new Error('artifacts');
for (const [i, a] of data.artifacts.entries()) {
  for (const key of ['os', 'arch', 'name', 'url', 'sha512']) {
    if (!a[key]) throw new Error(`artifact[${i}] missing ${key}`);
  }
  if (String(a.sha512).length !== 128) throw new Error(`artifact[${i}] sha512 length`);
}
console.log(`OK ${file} version=${data.version} artifacts=${data.artifacts.length}`);
