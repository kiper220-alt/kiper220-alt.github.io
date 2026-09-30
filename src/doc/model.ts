// The release baseline is prepared once; moving branch snapshots are acquired
// in the browser. Comparison is independent of both acquisition mechanisms.
// Version comparison follows rpm/rpmio/rpmvercmp.cc; vectors live in tests/.
export type Package = { evr: string; source: string; arch: string; epochKnown?: boolean; hash?: string; epochSource?: string; epochStatus?: 'pending' | 'verified' | 'failed' };
export type Component = { name: string; title: string; category?: string; path?: string; packages: Record<string, { arch?: string[]; exclude_arch?: string[]; kernel_module?: boolean }> };
export type Definitions = { revision: string; tag: string; source: string; package?: { name: string; evr: string; branch: string; sourceHash: string; metadataSource: string }; categories: Record<string, { name: string; parent?: string; title: string }>; components: Record<string, Component>; editions: Record<string, { name: string; title: string; arches: string[]; sections: Record<string, { title: string; components: string[] }> }> };
export type ProviderRecord = { candidates: string[]; source: string; evidence?: Record<string, string>; complete: boolean; scope?: string; status?: 'pending' | 'complete' | 'failed' };
export type Snapshot = { schema: number; id: string; arch: string; release?: string; branch?: string; obtainedAt?: string; frozenAt?: string; source: string; definitions: Definitions; packages: Record<string, Package>; providers?: Record<string, ProviderRecord>; providerCheckedNames?: string[]; repositoryAbsent?: string[]; missingExplicit?: string[]; inventoryComplete?: boolean; inventoryKind?: 'image' };
export type PackageResolution = { kind: 'direct' | 'provided' | 'ambiguous' | 'missing' | 'unknown' | 'pending'; name?: string; package?: Package; candidates: string[]; source?: string };
export type Change = 'обновлён' | 'понижен' | 'без изменений' | 'включён в компонент' | 'исключён из компонента' | 'появился в p11' | 'отсутствует в p11' | 'нет в образе 11.1' | 'нет в образе и p11' | 'изменился version-release; epoch образа неизвестен' | 'epoch образа неизвестен' | 'неоднозначный поставщик RPM' | 'изменился поставщик RPM' | 'нет данных' | 'проверяется';
export type PackageRow = { name: string; before?: Package; after?: Package; beforeResolution?: PackageResolution; afterResolution?: PackageResolution; providerChanged?: boolean; change: Change; composition?: Change; availability?: Change; source?: string; pending?: boolean };
export type ComponentRow = { name: string; title: string; section: string; category?: string; path?: string; isNew: boolean; removed: boolean; moved: boolean; rows: PackageRow[]; kernelModules: string[]; kernelModulesChanged: boolean; reason: string };

const digit = (c: string) => /^[0-9]$/.test(c);
const alpha = (c: string) => /^[A-Za-z]$/.test(c);
const alnum = (c: string) => digit(c) || alpha(c);

export function rpmvercmp(a: string, b: string): number {
  if (a === b) return 0;
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    while (i < a.length && !alnum(a[i]) && a[i] !== '~' && a[i] !== '^') i++;
    while (j < b.length && !alnum(b[j]) && b[j] !== '~' && b[j] !== '^') j++;
    if (a[i] === '~' || b[j] === '~') {
      if (a[i] !== '~') return 1;
      if (b[j] !== '~') return -1;
      i++; j++; continue;
    }
    if (a[i] === '^' || b[j] === '^') {
      if (i >= a.length) return -1;
      if (j >= b.length) return 1;
      if (a[i] !== '^') return 1;
      if (b[j] !== '^') return -1;
      i++; j++; continue;
    }
    if (i >= a.length || j >= b.length) break;
    const numeric = digit(a[i]);
    let e1 = i, e2 = j;
    while (e1 < a.length && (numeric ? digit(a[e1]) : alpha(a[e1]))) e1++;
    while (e2 < b.length && (numeric ? digit(b[e2]) : alpha(b[e2]))) e2++;
    if (e1 === i) return -1;
    if (e2 === j) return numeric ? 1 : -1;
    let s1 = a.slice(i, e1), s2 = b.slice(j, e2);
    if (numeric) {
      s1 = s1.replace(/^0+/, ''); s2 = s2.replace(/^0+/, '');
      if (s1.length !== s2.length) return Math.sign(s1.length - s2.length);
    }
    if (s1 !== s2) return s1 < s2 ? -1 : 1;
    i = e1; j = e2;
  }
  return Math.sign((i < a.length ? 1 : 0) - (j < b.length ? 1 : 0));
}

function splitEVR(evr: string): [bigint, string, string] {
  const colon = evr.indexOf(':');
  const epoch = colon < 0 ? 0n : BigInt(evr.slice(0, colon));
  const rest = evr.slice(colon + 1);
  const dash = rest.indexOf('-');
  return [epoch, dash < 0 ? rest : rest.slice(0, dash), dash < 0 ? '' : rest.slice(dash + 1)];
}

export function compareEVR(a: string, b: string): number {
  const x = splitEVR(a), y = splitEVR(b);
  if (x[0] !== y[0]) return x[0] > y[0] ? 1 : -1;
  return rpmvercmp(x[1], y[1]) || rpmvercmp(x[2], y[2]);
}

export function validP11Definitions(snapshot: Snapshot): boolean {
  const definitions = snapshot.definitions;
  const catalogue = snapshot.packages?.['alt-components-base'];
  if (snapshot.branch !== 'p11' || !catalogue || catalogue.source !== 'alt-components-base' ||
      catalogue.arch !== 'noarch' || !/^(?:[0-9]+:)?[^\s:-]+-[^\s:]+$/.test(catalogue.evr) ||
      !definitions?.revision || !definitions.source ||
      definitions.tag !== catalogue.evr.replace(/^[0-9]+:/, '') ||
      !definitions.editions?.edition_server || !definitions.editions?.edition_domain ||
      !definitions.components || !definitions.categories) return false;
  const proof = definitions.package;
  return !proof || (proof.name === 'alt-components-base' && proof.branch === 'p11' &&
    proof.evr === catalogue.evr && !!proof.sourceHash && !!proof.metadataSource);
}

export function resolvePackage(snapshot: Snapshot | null | undefined, name: string): PackageResolution {
  if (!snapshot) return { kind: 'pending', candidates: [] };
  const usable = (pkg: Package | undefined) => !!pkg && (pkg.arch === snapshot.arch || pkg.arch === 'noarch');
  const direct = snapshot.packages[name];
  if (usable(direct)) return { kind: 'direct', name, package: direct, candidates: [name] };
  const record = snapshot.providers?.[name];
  if (record) {
    if (record.status === 'pending') return { kind: 'pending', candidates: [], source: record.source };
    if (record.status === 'failed') return { kind: 'unknown', candidates: [], source: record.source };
    const candidates = [...new Set(record.candidates)].sort();
    if (candidates.some(actual => !usable(snapshot.packages[actual]))) {
      return { kind: 'unknown', candidates, source: record.source };
    }
    if (candidates.length > 1) return { kind: 'ambiguous', candidates, source: record.source };
    if (candidates.length === 1) {
      const actual = candidates[0];
      return { kind: 'provided', name: actual, package: snapshot.packages[actual], candidates,
        source: record.evidence?.[actual] || record.source };
    }
    return { kind: record.complete ? 'missing' : 'unknown', candidates, source: record.source };
  }
  // The frozen targeted Provides index cannot prove absence for an alias that
  // first appears in future component definitions.
  if (snapshot.frozenAt && snapshot.providerCheckedNames && !snapshot.providerCheckedNames.includes(name)) {
    return { kind: 'unknown', candidates: [] };
  }
  return { kind: 'missing', candidates: [] };
}

export function resolutionLabel(resolution: PackageResolution | undefined): string {
  if (resolution?.kind === 'pending') return 'проверяется RPM-поставщик';
  if (resolution?.kind === 'ambiguous') return 'несколько RPM-поставщиков';
  if (resolution?.kind === 'unknown') return 'RPM-поставщик не определён';
  return '';
}

function uncertainResolution(resolution: PackageResolution | undefined): boolean {
  return resolution?.kind === 'ambiguous' || resolution?.kind === 'unknown' || resolution?.kind === 'pending';
}

// The caller must fetch this entry by the exact ISO binary hash, not by source
// package name or date. Match version-release before accepting its epoch.
export function verifiedImageEVR(imageEVR: string, entryEVR: string | undefined): string | undefined {
  return entryEVR && /^(?:[0-9]+:)?[^\s:-]+-[^\s:]+$/.test(entryEVR) &&
    entryEVR.replace(/^[0-9]+:/, '') === imageEVR.replace(/^[0-9]+:/, '') ? entryEVR : undefined;
}

function allowed(options: Component['packages'][string], arch: string): boolean {
  return (!options.arch || options.arch.includes(arch)) && !options.exclude_arch?.includes(arch);
}

export function included(component: Component | undefined, arch: string): string[] {
  return component ? Object.entries(component.packages).filter(([, options]) => allowed(options, arch) && !options.kernel_module).map(([name]) => name) : [];
}

export function kernelModules(component: Component | undefined, arch: string): string[] {
  return component ? Object.entries(component.packages).filter(([, options]) => allowed(options, arch) && !!options.kernel_module).map(([name]) => name) : [];
}

function membership(defs: Definitions, edition: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const [section, value] of Object.entries(defs.editions[edition]?.sections || {})) {
    for (const component of value.components) result.set(component, section);
  }
  return result;
}

export function compareSnapshots(before: Snapshot, after: Snapshot, edition: string): ComponentRow[] {
  if (before.arch !== after.arch || !before.inventoryComplete || !before.release || after.branch !== 'p11') throw new Error('Несовместимые или неполные снимки');
  return compareInternal(before, after, edition, true);
}

export function compareDefinitionsOnly(definitions: Definitions, after: Snapshot, edition: string, release = '11.1'): ComponentRow[] {
  const partial: Snapshot = { schema: 1, id: 'definitions-only', arch: after.arch, release, source: definitions.source,
    definitions, packages: {}, inventoryComplete: false };
  return compareInternal(partial, after, edition, false);
}

export function compareImageSnapshot(image: Snapshot, after: Snapshot, edition: string): ComponentRow[] {
  if (image.arch !== after.arch || image.inventoryKind !== 'image' || image.release !== '11.1' || after.branch !== 'p11') {
    throw new Error('Несовместимые снимки образа и p11');
  }
  const rows = compareInternal(image, after, edition, true);
  for (const component of rows) {
    for (const pkg of component.rows) {
      if (uncertainResolution(pkg.beforeResolution) || uncertainResolution(pkg.afterResolution)) continue;
      if (!pkg.before && !pkg.after) {
        pkg.change = pkg.composition || 'нет в образе и p11';
        pkg.availability = 'нет в образе и p11';
      }
      if (!pkg.before && pkg.after) {
        if (pkg.composition) {
          pkg.change = pkg.composition;
          pkg.availability = 'нет в образе 11.1';
        } else {
          pkg.change = 'нет в образе 11.1';
        }
      }
      if (pkg.before && pkg.after && !pkg.providerChanged && !pkg.composition && pkg.before.epochKnown === false &&
          (image.frozenAt || pkg.before.epochStatus === 'failed' || pkg.after.evr.includes(':'))) {
        const oldVR = pkg.before.evr.replace(/^[0-9]+:/, '');
        const newVR = pkg.after.evr.replace(/^[0-9]+:/, '');
        pkg.change = compareEVR(newVR, oldVR) === 0 ? 'epoch образа неизвестен' : 'изменился version-release; epoch образа неизвестен';
      }
      if (pkg.pending && !pkg.composition && !pkg.providerChanged) pkg.change = 'проверяется';
    }
    if (!component.isNew && !component.removed && !component.moved) {
      component.reason = component.kernelModulesChanged || component.rows.some(pkg => pkg.composition) ? 'Изменился состав' :
        component.rows.some(pkg => pkg.providerChanged) ? 'Изменился поставщик RPM' :
        component.rows.some(pkg => pkg.change === 'неоднозначный поставщик RPM') ? 'Несколько RPM-поставщиков' :
        component.rows.some(pkg => pkg.change === 'отсутствует в p11' || pkg.availability === 'отсутствует в p11') ? 'Пакет отсутствует в p11' :
        component.rows.some(pkg => pkg.change === 'обновлён' || pkg.change === 'понижен') ? 'Обновились пакеты' :
        component.rows.some(pkg => pkg.change === 'изменился version-release; epoch образа неизвестен') ? 'Изменился version-release; epoch неизвестен' :
        component.rows.some(pkg => pkg.change === 'epoch образа неизвестен') ? 'Epoch образа неизвестен' :
        component.rows.some(pkg => pkg.change === 'нет в образе и p11') ? 'Пакеты не найдены в снимках' :
        component.rows.some(pkg => pkg.change === 'нет в образе 11.1') ? 'Часть пакетов не входит в образ' :
        component.rows.some(pkg => pkg.pending) ? 'Проверяются данные' :
        component.rows.some(pkg => pkg.change === 'нет данных') ? 'Нет данных' :
        component.rows.length === 0 && component.kernelModules.length ? 'Шаблоны модулей ядра' :
        component.kernelModules.length ? 'Модули ядра не сравнивались' : 'Без изменений';
    }
    if (component.rows.some(pkg => pkg.pending) && component.reason !== 'Проверяются данные') component.reason += ' · проверка продолжается';
  }
  return rows;
}

function compareInternal(before: Snapshot, after: Snapshot, edition: string, complete: boolean): ComponentRow[] {
  const first = membership(before.definitions, edition), last = membership(after.definitions, edition);
  const all = new Set([...first.keys(), ...last.keys()]);
  const output: ComponentRow[] = [];
  for (const name of all) {
    const oldDef = before.definitions.components[name], newDef = after.definitions.components[name];
    const oldNames = new Set(included(oldDef, after.arch)), newNames = new Set(included(newDef, after.arch));
    const oldKernel = kernelModules(oldDef, after.arch), newKernel = kernelModules(newDef, after.arch);
    const kernelModulesChanged = oldKernel.join('\0') !== newKernel.join('\0');
    const rows: PackageRow[] = [];
    for (const pkg of new Set([...oldNames, ...newNames])) {
      const beforeResolution = resolvePackage(before, pkg), afterResolution = resolvePackage(after, pkg);
      const oldPkg = beforeResolution.package, newPkg = afterResolution.package;
      const providerChanged = !!oldPkg && !!newPkg && beforeResolution.name !== afterResolution.name;
      const pending = beforeResolution.kind === 'pending' || afterResolution.kind === 'pending' ||
        !!oldPkg && !!newPkg && !providerChanged && oldPkg.epochStatus === 'pending';
      let change: Change = 'без изменений';
      const composition: Change | undefined = !oldNames.has(pkg) ? 'включён в компонент' : !newNames.has(pkg) ? 'исключён из компонента' : undefined;
      const availability: Change | undefined = !newPkg && afterResolution.kind === 'missing' && after.missingExplicit?.includes(pkg) ? 'отсутствует в p11' : undefined;
      if (!oldNames.has(pkg)) change = !complete || oldPkg ? 'включён в компонент' : before.repositoryAbsent?.includes(pkg) ? 'появился в p11' : 'нет данных';
      else if (!newNames.has(pkg)) change = 'исключён из компонента';
      else if (!complete) change = 'нет данных';
      else if (!oldPkg && !before.repositoryAbsent?.includes(pkg)) change = 'нет данных';
      else if (!newPkg && !after.missingExplicit?.includes(pkg)) change = 'нет данных';
      else if (!oldPkg && newPkg) change = 'появился в p11';
      else if (oldPkg && !newPkg) change = 'отсутствует в p11';
      else if (oldPkg && newPkg) {
        const order = compareEVR(newPkg.evr, oldPkg.evr);
        change = order > 0 ? 'обновлён' : order < 0 ? 'понижен' : 'без изменений';
      }
      if (complete && (beforeResolution.kind === 'ambiguous' || afterResolution.kind === 'ambiguous')) change = 'неоднозначный поставщик RPM';
      else if (complete && (beforeResolution.kind === 'unknown' || afterResolution.kind === 'unknown')) change = 'нет данных';
      else if (complete && pending && !composition) change = 'проверяется';
      else if (providerChanged && !composition) change = 'изменился поставщик RPM';
      rows.push({ name: pkg, before: oldPkg, after: newPkg, beforeResolution, afterResolution, providerChanged, change, composition, availability, source: newPkg?.source || oldPkg?.source, pending });
    }
    const isNew = !first.has(name), removed = !last.has(name), moved = first.has(name) && last.has(name) && (first.get(name) !== last.get(name) || oldDef?.category !== newDef?.category);
    const composition = kernelModulesChanged || rows.some(row => row.composition);
    const unavailable = rows.some(row => row.availability === 'отсутствует в p11' || row.change === 'отсутствует в p11');
    const changed = rows.some(row => row.change === 'обновлён' || row.change === 'понижен');
    const reason = isNew ? 'Новый компонент' : removed ? 'Компонент удалён' : moved ? 'Изменён раздел или категория' : composition ? 'Изменился состав' : rows.some(row => row.providerChanged) ? 'Изменился поставщик RPM' : rows.some(row => row.change === 'неоднозначный поставщик RPM') ? 'Несколько RPM-поставщиков' : unavailable ? 'Пакет отсутствует в p11' : changed ? 'Обновились пакеты' : rows.some(row => row.change === 'нет данных') ? 'Нет данных' : 'Без изменений';
    output.push({ name, title: newDef?.title || oldDef?.title || name, section: last.get(name) || first.get(name) || '', category: newDef?.category || oldDef?.category, path: newDef?.path || oldDef?.path, isNew, removed, moved, rows: rows.sort((a,b) => a.name.localeCompare(b.name)), kernelModules: newKernel.length ? newKernel : oldKernel, kernelModulesChanged, reason });
  }
  return output.sort((a,b) => a.title.localeCompare(b.title, 'ru'));
}

export function changelogRange(entries: { evr?: string; message?: string; date?: string }[], before: string, after: string) {
  if (compareEVR(after, before) < 0) return { entries: [], complete: false, reason: 'Понижение версии: прямой диапазон changelog не применим.' };
  if (compareEVR(after, before) === 0) return { entries: [], complete: true, reason: '' };
  const comparable = entries.map((entry, index) => ({entry, index})).filter(({entry}) =>
    entry.evr && /^(?:[0-9]+:)?[^\s:-]+-[^\s:]+$/.test(entry.evr));
  const selected = comparable.filter(({entry}) => compareEVR(entry.evr!, before) > 0 && compareEVR(entry.evr!, after) <= 0);

  // ALTRepo returns changelog in history order, newest first. Bound the
  // uncertainty check by known RPM versions, not by the age of an entry.
  // Do not stop at an early baseline if later entries have newer versions:
  // changelog EVRs can be non-monotonic after backports or epoch changes.
  const lastNewer = comparable.filter(({entry}) => compareEVR(entry.evr!, before) > 0).at(-1)?.index ?? -1;
  const lower = comparable.find(({entry, index}) => index > lastNewer && compareEVR(entry.evr!, before) <= 0)?.index;
  const upper = comparable.find(({entry}) => compareEVR(entry.evr!, after) === 0)?.index;
  const start = upper === undefined ? 0 : Math.min(upper, selected[0]?.index ?? upper);
  const end = lower ?? entries.length;
  const skipped = entries.slice(start, end).length - comparable.filter(({index}) => index >= start && index < end).length;
  const complete = lower !== undefined;
  const reasons = [
    complete ? '' : 'Диапазон неполон: changelog не достигает версии выпуска.',
    skipped ? 'Не удалось определить версии некоторых записей changelog в сравниваемом диапазоне. Список изменений может быть неполным; проверьте полный источник.' : '',
  ];
  return { entries: selected.map(({entry}) => entry), complete: complete && !skipped, reason: reasons.filter(Boolean).join(' ') };
}
