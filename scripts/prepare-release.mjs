#!/usr/bin/env node
// Prepare once, verify the immutable image, then publish content-addressed JSON.
// Moving branch updates never call this script or write to public/releases/.
import { RELEASE, ARCHITECTURES } from '../src/doc/config.ts';
import { readFile, mkdir, mkdtemp, writeFile, rename, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { validateRelease, releaseEntry, sha256 } from '../src/doc/release.ts';
import { verifiedImageEVR } from '../src/doc/model.ts';
import { imageIndex } from '../src/doc/acquisition.ts';

const API = 'https://rdb.altlinux.org/api';
const GIT = 'https://altlinux.space/api/v1/repos/alterator/alt-components-base';
const arches = ARCHITECTURES;
const vr = value => value.replace(/^[0-9]+:/, '');

function trackedNames(definitions, arch) {
  const names = new Set();
  for (const edition of Object.values(definitions.editions)) for (const section of Object.values(edition.sections)) {
    for (const name of section.components) for (const [pkg, opts] of Object.entries(definitions.components[name].packages)) {
      if (!opts.kernel_module && (!opts.arch || opts.arch.includes(arch)) && !opts.exclude_arch?.includes(arch)) names.add(pkg);
    }
  }
  return names;
}

export async function prepareRelease({ release, inputDir, outputDir, request = fetch, verify = true, epochs = true, intervalMs = 250, log = console.log }) {
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(release)) throw new Error('Некорректный номер выпуска');
  let existing;
  try { existing = JSON.parse(await readFile(resolve(outputDir, 'manifest.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing) {
    for (const arch of arches) {
      const entry = releaseEntry(existing, release, arch);
      const bytes = new Uint8Array(await readFile(resolve(outputDir, entry.file)));
      if (await sha256(bytes) !== entry.sha256) throw new Error(`Контрольная сумма существующей базы ${arch} не совпала`);
      validateRelease(JSON.parse(new TextDecoder().decode(bytes)), release, arch, entry);
    }
    log(`Выпуск ${release} уже зафиксирован; файлы не изменены.`);
    return existing;
  }
  // Validate both architectures before any publication. Explicit import files
  // come from update-doc-data.py (or the same documented normalized schema).
  const preparedAt = new Date().toISOString();
  const snapshots = [];
  for (const arch of arches) {
    const image = JSON.parse(await readFile(resolve(inputDir, `image-${release}-${arch}.json`), 'utf8'));
    const current = JSON.parse(await readFile(resolve(inputDir, `p11-${arch}.json`), 'utf8'));
    const checked = new Set([...trackedNames(image.definitions, arch), ...trackedNames(current.definitions, arch), ...Object.keys(image.providers || {})]);
    image.frozenAt = preparedAt;
    image.providerCheckedNames = [...checked].sort();
    image.note = 'Fixed ALT Server ISO inventory for both editions. Historical source names may be inferred from p11. Provides lookup is targeted, not a complete scan of the ISO. Unknown fields remain unknown.';
    validateRelease(image, release, arch);
    snapshots.push(image);
  }
  let lastRequest = 0;
  async function json(url) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const delay = lastRequest + intervalMs - Date.now();
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      lastRequest = Date.now();
      const response = await request(url, { signal: AbortSignal.timeout(90000) });
      if (response.status === 429 && attempt < 4) {
        const retry = Number(response.headers.get('Retry-After')) || 2 ** (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, Math.min(retry, 30) * 1000)); continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return response.json();
    }
  }
  const metadata = new Map(), epochProofs = new Map();
  for (const image of snapshots) {
    const arch = image.arch;
    if (verify) {
      const tag = `p11:alt-server:::release.${release}.0:${arch}:install:iso`;
      const info = await json(`${API}/image/image_uuid_by_tag?tag=${encodeURIComponent(tag)}`);
      if (info.request_args?.tag !== tag || info.uuid !== image.id) throw new Error(`UUID импортированного образа ${arch} не подтверждён`);
      const actual = imageIndex(await json(`${API}/image/image_packages?uuid=${image.id}`), image.id, {});
      if (Object.keys(actual).length !== Object.keys(image.packages).length || Object.entries(actual).some(([name, pkg]) =>
        !image.packages[name] || image.packages[name].hash !== pkg.hash || image.packages[name].arch !== pkg.arch || vr(image.packages[name].evr) !== pkg.evr)) {
        throw new Error(`Импортированный состав ${release}/${arch} не совпадает с образом`);
      }
      const git = await json(`${GIT}/tags/${encodeURIComponent(image.definitions.tag)}`);
      if (git.name !== image.definitions.tag || git.commit?.sha !== image.definitions.revision) throw new Error('Исторический тег/коммит не подтверждён');
      for (const [alias, record] of Object.entries(image.providers || {})) for (const actual of record.candidates) {
        const hash = image.packages[actual].hash;
        if (!metadata.has(hash)) {
          const data = await json(`${API}/dependencies/binary_package_dependencies/${hash}`);
          if (String(data.request_args?.pkghash) !== hash || !Array.isArray(data.dependencies) || data.length !== data.dependencies.length) throw new Error(`Неполные метаданные RPM ${actual}`);
          metadata.set(hash, new Set(data.dependencies.filter(row => row.type === 'provide').map(row => row.name)));
        }
        if (!metadata.get(hash).has(alias)) throw new Error(`Исторический Provides ${alias} → ${actual} не подтверждён`);
      }
      log(`${arch}: UUID, ${Object.keys(actual).length} RPM, исторический коммит и Provides подтверждены`);
    }
    if (epochs) {
      const names = new Set([...image.providerCheckedNames, ...Object.values(image.providers || {}).flatMap(record => record.candidates)]);
      const packages = Object.entries(image.packages).filter(([name]) => names.has(name));
      let count = 0;
      for (const [name, pkg] of packages) {
        // Already verified imports carry the exact immutable hash proof.
        if (pkg.epochKnown && pkg.epochSource) continue;
        const url = `${API}/site/package_changelog/${pkg.hash}?changelog_last=1`;
        if (!epochProofs.has(pkg.hash)) {
          const data = await json(url);
          const evr = String(data.pkghash) === pkg.hash ? verifiedImageEVR(pkg.evr, data.changelog?.[0]?.evr) : undefined;
          if (!evr) throw new Error(`Полная версия исторического RPM ${name} не подтверждена`);
          epochProofs.set(pkg.hash, evr);
        }
        Object.assign(pkg, { evr: epochProofs.get(pkg.hash), epochKnown: true, epochSource: url, epochStatus: 'verified' });
        count++;
        if (count % 50 === 0) log(`${arch}: подтверждено ещё ${count} исторических RPM-версий`);
      }
      log(`${arch}: ${packages.length} наблюдаемых RPM, подтверждено ${count} дополнительных epoch`);
    }
    validateRelease(image, release, arch);
  }
  const manifest = { schema: 1, release, preparedAt, architectures: {} };
  const files = new Map();
  for (const image of snapshots) {
    const bytes = new TextEncoder().encode(JSON.stringify(image) + '\n');
    const digest = await sha256(bytes), file = `${image.arch}-${digest}.json`;
    files.set(file, bytes);
    manifest.architectures[image.arch] = { file, sha256: digest, uuid: image.id, arch: image.arch,
      packageCount: Object.keys(image.packages).length, definitionTag: image.definitions.tag, definitionRevision: image.definitions.revision };
  }
  // A directory rename publishes all files together. Existing release content
  // is never overwritten; an interrupted preparation leaves it untouched.
  await mkdir(dirname(outputDir), { recursive: true });
  try { await readdir(outputDir); throw new Error('Каталог выпуска существует без корректного манифеста; выберите новый каталог'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const staging = await mkdtemp(resolve(dirname(outputDir), '.prepare-release-'));
  for (const [file, bytes] of files) await writeFile(resolve(staging, file), bytes, { flag: 'wx' });
  await writeFile(resolve(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  await rename(staging, outputDir);
  log(`Зафиксирован выпуск ${release}: ${outputDir}`);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: {
    release: { type: 'string', default: RELEASE }, 'input-dir': { type: 'string', default: 'public/doc-data' },
    'output-dir': { type: 'string' }, 'skip-epoch-checks': { type: 'boolean', default: false },
  } });
  await prepareRelease({ release: values.release, inputDir: resolve(values['input-dir']),
    outputDir: resolve(values['output-dir'] || `public/releases/${values.release}`), epochs: !values['skip-epoch-checks'] });
}
