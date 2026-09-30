import { unzipSync, strFromU8 } from 'fflate';
import { parse } from 'smol-toml';
import type { Definitions, Package } from './model.ts';

const UPSTREAM = 'https://altlinux.space/alterator/alt-components-base.git';
export type Row = { name: string; version: string; release: string; epoch?: number; arch: string; source?: string; hash?: string; branch?: string; pkghash?: string; type?: string };
type RawDefinition = {
  name: string; category?: string; display_name?: Record<string, string>; arches?: string[];
  packages?: Definitions['components'][string]['packages'];
  sections?: Record<string, { display_name?: Record<string, string>; components?: string[] }>;
};

// Parse the actual TOML definitions, not a guessed schema or a generated JSON.
export function definitionsFromArchive(bytes: Uint8Array, tag: string, revision: string): Definitions {
  const files = unzipSync(bytes, { filter: file => /\.(edition|component|category)$/.test(file.name) });
  const result: Definitions = { tag, revision, source: UPSTREAM, categories: {}, components: {}, editions: {} };
  for (const [archivePath, contents] of Object.entries(files)) {
    const path = archivePath.substring(archivePath.indexOf('/') + 1);
    if (!/^(categories|components|editions)\//.test(path)) continue;
    const raw = parse(strFromU8(contents), { unsafeKeyBehaviour: 'throw' }) as unknown as RawDefinition;
    if (!raw.name) throw new Error(`Нет имени определения: ${path}`);
    const title = raw.display_name?.ru || raw.name;
    if (path.endsWith('.category')) {
      if (result.categories[raw.name]) throw new Error(`Повторная категория: ${raw.name}`);
      result.categories[raw.name] = { name: raw.name, parent: raw.category, title };
    } else if (path.endsWith('.component')) {
      if (result.components[raw.name]) throw new Error(`Повторный компонент: ${raw.name}`);
      result.components[raw.name] = { name: raw.name, title, category: raw.category, path, packages: raw.packages || {} };
    } else if (['edition_server', 'edition_domain'].includes(raw.name)) {
      if (result.editions[raw.name]) throw new Error(`Повторная редакция: ${raw.name}`);
      result.editions[raw.name] = { name: raw.name, title, arches: raw.arches || [], sections: Object.fromEntries(
        Object.entries(raw.sections || {}).map(([name, section]) => [name, {
          title: section.display_name?.ru || name, components: section.components || [],
        }])) };
    }
  }
  for (const name of ['edition_server', 'edition_domain']) {
    const edition = result.editions[name];
    if (!edition || !Object.keys(edition.sections).length) throw new Error(`Неполные определения редакции: ${name}`);
    for (const section of Object.values(edition.sections)) for (const component of section.components) {
      if (!result.components[component]) throw new Error(`Нет определения компонента: ${component}`);
    }
  }
  if (!Object.keys(result.categories).length) throw new Error('Нет категорий в архиве определений');
  return result;
}

export function binaryIndex(data: { request_args?: { branch?: string; arch?: string }; length?: number; packages?: Row[] }, branch: string, arch: string): Record<string, Package> {
  if (data.request_args?.branch !== branch || data.request_args.arch !== arch ||
      !data.packages?.length || data.length !== data.packages.length) throw new Error(`Неполный экспорт ${branch}/${arch}`);
  const result: Record<string, Package> = {};
  for (const row of data.packages) {
    if (row.arch !== arch || !row.name || !row.source || !row.version || !row.release ||
        (row.epoch !== undefined && (!Number.isSafeInteger(row.epoch) || row.epoch < 0))) {
      throw new Error(`Некорректный RPM в экспорте ${branch}/${arch}`);
    }
    if (result[row.name]) throw new Error(`Несколько версий RPM ${row.name} в ${branch}/${arch}`);
    result[row.name] = { evr: `${row.epoch ? row.epoch + ':' : ''}${row.version}-${row.release}`, source: row.source, arch };
  }
  return result;
}

export function imageIndex(data: { request_args?: { uuid?: string }; length?: number; packages?: Row[] }, uuid: string, index: Record<string, Package>): Record<string, Package> {
  if (data.request_args?.uuid !== uuid || !data.packages?.length || data.length !== data.packages.length) {
    throw new Error('Неполный список RPM образа 11.1');
  }
  const result: Record<string, Package> = {};
  for (const row of data.packages) {
    if (!row.name || !row.version || !row.release || !row.hash || !row.arch) throw new Error('Неполные сведения о RPM образа');
    const pkg = { evr: `${row.version}-${row.release}`, arch: row.arch, source: index[row.name]?.source || row.name,
      hash: String(row.hash), epochKnown: false };
    if (result[row.name] && (result[row.name].evr !== pkg.evr || result[row.name].hash !== pkg.hash)) {
      throw new Error(`Несколько RPM с именем ${row.name} в образе`);
    }
    result[row.name] = pkg;
  }
  return result;
}
