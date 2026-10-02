import { RELEASE, ARCHITECTURES } from './config.ts';
import { createHttpClient } from './http.ts';
import { API, providerURL, resolveBranchProvider } from './provides.ts';
export { API } from './provides.ts';
import { validP11Definitions, type Definitions, type Package, type ProviderRecord, type Snapshot, type Branch, type BranchSnapshot, type FrozenReleaseSnapshot } from './model.ts';
import { binaryIndex, imageIndex, definitionsFromArchive, type Row } from './acquisition.ts';
import { browserCache, type RuntimeCache } from './cache.ts';
import { RuntimePriority, VerificationQueue } from './queue.ts';
import { releaseEntry, validateRelease, sha256, type ReleaseManifest } from './release.ts';
export { binaryIndex, imageIndex, definitionsFromArchive } from './acquisition.ts';
export { RuntimePriority } from './queue.ts';

export const GIT_API = 'https://altlinux.space/api/v1/repos/alterator/alt-components-base';
export type RuntimeProgress = { phase: string; requests: number; bytes: number; elapsedMs: number; cacheHits: number; firstTableMs?: number; pending: number; failed: number };
export type RuntimeResult = { current: BranchSnapshot; image: FrozenReleaseSnapshot; sisyphus: BranchSnapshot | null; metrics: RuntimeProgress; warnings: string[]; stage: 'base' | 'checking' | 'complete'; sisyphusError?: string };
export const lastResultKey = (arch: string) => `last-result:static-${RELEASE}-v1:` + arch;
const vr = (evr: string) => evr.replace(/^[0-9]+:/, '');

export function usableResult(value: RuntimeResult | undefined, arch: string): value is RuntimeResult {
  return !!value && value.stage === 'complete' && value.metrics?.failed === 0 && value.current?.arch === arch && value.image?.arch === arch &&
    value.image.release === RELEASE && !!value.image.frozenAt && value.image.inventoryKind === 'image' && validP11Definitions(value.current) &&
    (!value.sisyphus || value.sisyphus.branch === 'sisyphus' && value.sisyphus.arch === arch);
}

export type RuntimeOptions = {
  signal?: AbortSignal; progress?: (progress: RuntimeProgress) => void; update?: (result: RuntimeResult) => void;
  request?: typeof fetch; detailIntervalMs?: number; requestTimeoutMs?: number;
  cache?: RuntimeCache; priority?: RuntimePriority; assetBaseURL?: string;
};
export type RuntimeSession = {
  initial: Promise<RuntimeResult>;
  done: Promise<RuntimeResult>;
  cancel: () => void;
};

export function startRuntime(arch: string, options: RuntimeOptions = {}): RuntimeSession {
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  let resolveInitial!: (result: RuntimeResult) => void;
  let rejectInitial!: (error: unknown) => void;
  const initial = new Promise<RuntimeResult>((resolve, reject) => { resolveInitial = resolve; rejectInitial = reject; });
  const done = runRuntime(arch, { ...options, signal }, resolveInitial).catch(error => {
    controller.abort(error);
    rejectInitial(error);
    throw error;
  });
  // A consumer can await initial before attaching to done without an unhandled
  // rejection. Both original promises retain their failure for their callers.
  void initial.catch(() => {});
  void done.catch(() => {});
  return { initial, done, cancel: () => controller.abort() };
}

async function runRuntime(arch: string, options: RuntimeOptions & { signal: AbortSignal }, initial: (result: RuntimeResult) => void): Promise<RuntimeResult> {
  if (!ARCHITECTURES.includes(arch)) throw new Error('Неподдерживаемая архитектура');
  const { signal } = options;
  signal.throwIfAborted();
  const cache = options.cache || browserCache(), request = options.request || fetch;
  const priority = options.priority || new RuntimePriority();
  const started = performance.now();
  const metrics: RuntimeProgress = { phase: `Загрузка фиксированной базы ${RELEASE} и актуального p11`, requests: 0, bytes: 0, elapsedMs: 0, cacheHits: 0, pending: 0, failed: 0 };
  const warnings: string[] = [];
  let result: RuntimeResult | undefined, queue: VerificationQueue | undefined;
  let changedAt = 0;
  const report = (phase?: string) => {
    if (phase) metrics.phase = phase;
    metrics.elapsedMs = performance.now() - started;
    if (queue) metrics.pending = queue.pending;
    options.progress?.({ ...metrics });
  };
  const publish = (force = false) => {
    if (!result || signal.aborted) return;
    report();
    // Batch UI updates during fast cached verification; never mutate snapshots
    // previously handed to the view, so each published state is coherent.
    if (!force && performance.now() - changedAt < 80) return;
    changedAt = performance.now();
    result.metrics = { ...metrics };
    options.update?.(structuredClone(result));
  };
  async function cached<T>(key: string, validate: (value: T) => boolean): Promise<T | undefined> {
    const value = await cache.get<T>(key); signal.throwIfAborted();
    if (value !== undefined && validate(value)) { metrics.cacheHits++; report(); return value; }
    return undefined;
  }
  async function save<T>(key: string, value: T) { signal.throwIfAborted(); await cache.put(key, value); signal.throwIfAborted(); }
  const { bytes, json } = createHttpClient({
    signal, request, timeoutMs: options.requestTimeoutMs, detailIntervalMs: options.detailIntervalMs,
    onRequest: () => { metrics.requests++; report(); },
    onBytes: count => { metrics.bytes += count; report(); },
    onRetry: () => report('API ограничил частоту запросов; ожидание и повтор'),
  });
  async function branchIndex(branch: string) {
    const [noarch, native] = await Promise.all(['noarch', arch].map(async machine =>
      binaryIndex(await json(`${API}/export/branch_binary_packages/${branch}?arch=${machine}`), branch, machine)));
    return { ...noarch, ...native };
  }
  async function definitions(tag: string): Promise<Definitions> {
    // Tags can be moved, so resolve the active tag on every update; only the
    // immutable commit's contents are reused from cache.
    const info = await json(`${GIT_API}/tags/${encodeURIComponent(tag)}`), revision = info.commit?.sha;
    if (info.name !== tag || !/^[a-f0-9]{40}$/.test(revision || '')) throw new Error(`Не подтверждён Git-тег ${tag}`);
    const key = `definitions:${revision}`;
    const previous = await cached<Definitions>(key, d => d?.revision === revision && !!d.components && !!d.categories && !!d.editions?.edition_server && !!d.editions?.edition_domain);
    if (previous) return { ...previous, tag };
    const defs = definitionsFromArchive((await bytes(`${GIT_API}/archive/${revision}.zip`))!, tag, revision);
    await save(key, defs); return defs;
  }
  const imageTask = (async () => {
    const base = options.assetBaseURL ?? import.meta.env?.BASE_URL ?? '/';
    const directory = `${base.replace(/\/?$/, '/')}releases/${RELEASE}/`;
    try {
      const manifest = await json(`${directory}manifest.json`) as ReleaseManifest;
      const entry = releaseEntry(manifest, RELEASE, arch);
      const content = (await bytes(`${directory}${entry.file}`))!;
      if (await sha256(content) !== entry.sha256) throw new Error('Контрольная сумма снимка не совпала');
      const snapshot = JSON.parse(new TextDecoder().decode(content)) as Snapshot;
      validateRelease(snapshot, RELEASE, arch, entry);
      return snapshot;
    } catch (error) {
      signal.throwIfAborted();
      throw new Error(`База сравнения ${RELEASE}/${arch} не загружена: ${String(error)}`);
    }
  })();
  // Sisyphus is supplementary: neither slow requests nor failure block the
  // first usable ISO→p11 comparison. Catch immediately to avoid unhandled errors.
  const sisyTask = branchIndex('sisyphus').then(index => ({ index, error: '' }), error => ({ index: null, error: String(error) }));
  const [image, p11, sourceInfo] = await Promise.all([
    imageTask, branchIndex('p11'), json(`${API}/site/source_package_versions?name=alt-components-base`),
  ]);
  const catalogue = p11['alt-components-base'];
  if (!catalogue || catalogue.arch !== 'noarch' || catalogue.source !== 'alt-components-base' ||
      p11['alt-editions-server']?.evr !== catalogue.evr || p11['alt-editions-server']?.source !== 'alt-components-base') throw new Error('Пакет alt-components-base в p11 не подтверждён');
  const currentTag = vr(catalogue.evr);
  const matching: Row[] = sourceInfo.versions?.filter((row: Row) => row.branch === 'p11' && `${row.version}-${row.release}` === currentTag) || [];
  const hashes = new Set(matching.map(row => String(row.pkghash || '')));
  if (sourceInfo.request_args?.name !== 'alt-components-base' || hashes.size !== 1 || hashes.has('')) throw new Error('Исходный пакет alt-components-base не соответствует активному пакету p11');
  report('Получение актуальных определений p11');
  const releaseDefs = image.definitions;
  const currentDefs = await definitions(currentTag);
  currentDefs.package = { name: 'alt-components-base', evr: catalogue.evr, branch: 'p11', sourceHash: String([...hashes][0]), metadataSource: `${API}/site/source_package_versions?name=alt-components-base` };
  const names = new Set<string>();
  for (const defs of [releaseDefs, currentDefs]) for (const edition of Object.values(defs.editions)) for (const section of Object.values(edition.sections)) {
    for (const component of section.components) for (const [name, opts] of Object.entries(defs.components[component].packages)) {
      if (!opts.kernel_module && (!opts.arch || opts.arch.includes(arch)) && !opts.exclude_arch?.includes(arch)) names.add(name);
    }
  }
  const providers: Record<string, Record<string, ProviderRecord>> = { p11: {}, sisyphus: {} };
  function pendingProviders(index: Record<string, Package>, branch: string) {
    for (const name of names) if (!index[name]) providers[branch][name] = { candidates: [], complete: false, status: 'pending', source: `${API}/dependencies/packages_by_dependency` };
  }
  pendingProviders(p11, 'p11');
  async function snapshot(branch: Branch, index: Record<string, Package>): Promise<BranchSnapshot> {
    const encoded = new TextEncoder().encode(JSON.stringify({ arch, revision: currentDefs.revision, index }));
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoded))].map(n => n.toString(16).padStart(2,'0')).join('').slice(0,16);
    return { schema: 1, id: `${branch}-${arch}-${digest}`, branch, arch, obtainedAt: new Date().toISOString(), definitions: currentDefs,
      packages: Object.fromEntries([...new Set([...names, 'alt-components-base'])].filter(name => index[name]).map(name => [name, { ...index[name] }])),
      providers: providers[branch], source: `${API}/export/branch_binary_packages/${branch}?arch=${arch}` };
  }
  const current = await snapshot('p11', p11);
  if (!validP11Definitions(current)) throw new Error('Определения не соответствуют пакету alt-components-base в p11');
  result = { current, image, sisyphus: null, stage: 'base', warnings, metrics: { ...metrics } };
  metrics.firstTableMs = performance.now() - started;
  report('Таблица готова; дополнительные проверки продолжаются'); publish(true);
  initial(structuredClone(result));

  const finishChecks = async () => {
    const metadata = new Map<string, Promise<{ source: string; provides: string[] }>>();
    function rpmMetadata(hash: string) {
      if (!metadata.has(hash)) metadata.set(hash, (async () => {
        const key = `provides:${hash}`, url = `${API}/dependencies/binary_package_dependencies/${encodeURIComponent(hash)}`;
        const previous = await cached<{ hash: string; source: string; provides: string[] }>(key, value => value.hash === hash && value.source === url && Array.isArray(value.provides));
        if (previous) return previous;
        const data = await json(url, true);
        if (String(data.request_args?.pkghash) !== hash || !Array.isArray(data.dependencies) || data.length !== data.dependencies.length) throw new Error('Неполные сведения Provides для RPM');
        const value = { hash, source: url, provides: data.dependencies.filter((row: Row) => row.type === 'provide').map((row: Row) => row.name) as string[] };
        await save(key, value); return value;
      })());
      return metadata.get(hash)!;
    }
    queue = new VerificationQueue(priority, signal, () => { report(); publish(); });
    const failures = new Set<string>();
    const fail = (key: string, error: unknown) => { signal.throwIfAborted(); failures.add(key); metrics.failed = failures.size; warnings.push(String(error)); };
    function enqueueBranch(branch: string, index: Record<string, Package>, state: Snapshot) {
      for (const name of names) {
        if (index[name]) continue;
        queue!.add({ key: `${branch}:${name}`, names: [name], weight: branch === 'p11' ? 20 : 0, run: async () => {
          const url = providerURL(branch, name);
          try {
            // Branch lookups (including negative answers) are NEVER reused from
            // an old branch snapshot; only exact RPM metadata is immutable.
            const resolved = await resolveBranchProvider(branch, name, arch, index, await json(url, true, true), rpmMetadata);
            Object.assign(state.packages, resolved.packages);
            providers[branch][name] = resolved.record;
          } catch (error) { fail(`${branch}:${name}`, error); providers[branch][name] = { candidates: [], complete: false, status: 'failed', source: url }; }
          publish();
        } });
      }
    }
    enqueueBranch('p11', p11, current);
    const sisy = await sisyTask; signal.throwIfAborted();
    result.stage = 'checking';
    if (sisy.index) {
      pendingProviders(sisy.index, 'sisyphus'); result.sisyphus = await snapshot('sisyphus', sisy.index);
      enqueueBranch('sisyphus', sisy.index, result.sisyphus);
    } else {
      result.sisyphusError = `Sisyphus недоступен: ${sisy.error}`; fail('sisyphus', result.sisyphusError);
    }
    publish(true); queue.seal();
    await queue.done; signal.throwIfAborted();
    result.stage = 'complete';
    report(metrics.failed ? 'Проверка завершена; часть данных не подтверждена' : 'Данные получены в браузере; проверка завершена');
    // A supplementary failure must not replace the last fully successful result.
    if (!metrics.failed) { result.metrics = { ...metrics }; await save(lastResultKey(arch), result); }
    publish(true);
  };
  await finishChecks();
  return structuredClone(result);
}
