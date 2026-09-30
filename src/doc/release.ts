import type { Snapshot } from './model.ts';

export type ReleaseEntry = {
  file: string; sha256: string; uuid: string; arch: string; packageCount: number;
  definitionTag: string; definitionRevision: string;
};
export type ReleaseManifest = {
  schema: 1; release: string; preparedAt: string; architectures: Record<string, ReleaseEntry>;
};

const evr = /^(?:[0-9]+:)?[^\s:-]+-[^\s:]+$/;
const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function releaseEntry(value: unknown, release: string, arch: string): ReleaseEntry {
  const manifest = value as ReleaseManifest;
  const entry = manifest?.architectures?.[arch];
  if (manifest?.schema !== 1 || manifest.release !== release || !date(manifest.preparedAt) ||
      !entry || entry.arch !== arch || !entry.uuid || !Number.isSafeInteger(entry.packageCount) || entry.packageCount < 1 ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) || !/^[a-f0-9]{40}$/.test(entry.definitionRevision) ||
      !evr.test(entry.definitionTag) || entry.file !== `${arch}-${entry.sha256}.json`) {
    throw new Error(`База сравнения ${release}/${arch} не загружена: некорректный манифест выпуска`);
  }
  return entry;
}

// Run both during preparation and in the browser. No package/definition from
// a moving branch may stand in for a missing historical field.
export function validateRelease(snapshot: Snapshot, release: string, arch: string, entry?: ReleaseEntry): void {
  const defs = snapshot?.definitions;
  if (snapshot?.schema !== 1 || snapshot.release !== release || snapshot.arch !== arch || snapshot.branch ||
      snapshot.inventoryKind !== 'image' || !snapshot.id || !snapshot.source ||
      !date(snapshot.obtainedAt) || !date(snapshot.frozenAt) || !defs?.source ||
      !/^[a-f0-9]{40}$/.test(defs.revision) || !evr.test(defs.tag) || !defs.categories || !defs.components ||
      !snapshot.packages || !Object.keys(snapshot.packages).length ||
      !Array.isArray(snapshot.providerCheckedNames)) throw new Error(`Некорректная база сравнения ${release}/${arch}`);
  if (entry && (snapshot.id !== entry.uuid || Object.keys(snapshot.packages).length !== entry.packageCount ||
      defs.tag !== entry.definitionTag || defs.revision !== entry.definitionRevision)) {
    throw new Error(`Снимок ${release}/${arch} не соответствует манифесту`);
  }
  for (const edition of ['edition_server', 'edition_domain']) {
    const value = defs.editions?.[edition];
    if (!value?.arches.includes(arch) || !Object.keys(value.sections).length) throw new Error(`Нет редакции ${edition} в базе ${release}/${arch}`);
    for (const section of Object.values(value.sections)) for (const name of section.components) {
      if (!defs.components[name]) throw new Error(`Нет определения компонента ${name} в базе ${release}`);
    }
  }
  if (snapshot.packages['alt-editions-server']?.evr.replace(/^[0-9]+:/, '') !== defs.tag) {
    throw new Error(`Исторические определения не соответствуют RPM образа ${release}`);
  }
  for (const [name, pkg] of Object.entries(snapshot.packages)) {
    if (!name || !evr.test(pkg.evr) || !['noarch', arch].includes(pkg.arch) || !pkg.hash || !pkg.source ||
        typeof pkg.epochKnown !== 'boolean' || pkg.epochStatus === 'pending' ||
        (pkg.epochKnown && !pkg.epochSource?.includes(`/package_changelog/${pkg.hash}?changelog_last=1`))) {
      throw new Error(`Некорректный исторический RPM ${name} в базе ${release}/${arch}`);
    }
  }
  for (const [name, record] of Object.entries(snapshot.providers || {})) {
    if (!Array.isArray(record.candidates) || typeof record.complete !== 'boolean' || !record.source || record.status === 'pending') {
      throw new Error(`Некорректное соответствие Provides ${name} в базе ${release}`);
    }
    for (const actual of record.candidates) {
      const pkg = snapshot.packages[actual];
      if (!pkg || !record.evidence?.[actual]?.endsWith(`/binary_package_dependencies/${pkg.hash}`)) {
        throw new Error(`Не подтверждён исторический Provides ${name} → ${actual}`);
      }
    }
  }
}

export async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer);
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
}
