import { readResponse } from './http.ts';
import type { Package } from './model';

export type ChangelogBranch = 'p11' | 'sisyphus';
export type ChangelogEntry = { evr?: string; message?: string; date?: string };
export const branchLabel = (branch: ChangelogBranch) => branch === 'p11' ? 'p11' : 'Sisyphus';

// The versions endpoint includes history and other branches. Resolve the
// source build matching this branch and snapshot VR, never its first row.
export async function fetchSourceChangelog(
  branch: ChangelogBranch,
  pkg: Package,
  signal?: AbortSignal,
  request: typeof fetch = fetch,
  timeoutMs = 30000,
): Promise<ChangelogEntry[]> {
  const json = (url: string) => readResponse(url, { signal }, request, async response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, timeoutMs);
  const versions = await json(`https://rdb.altlinux.org/api/site/source_package_versions?name=${encodeURIComponent(pkg.source)}`);
  if (versions.request_args?.name !== pkg.source || !Array.isArray(versions.versions)) {
    throw new Error('источник версий вернул неполные или несоответствующие данные');
  }
  const vr = pkg.evr.replace(/^[0-9]+:/, '');
  const candidates = versions.versions.filter((row: { branch: string; version: string; release: string }) =>
    row.branch === branch && `${row.version}-${row.release}` === vr);
  const hashes = new Set<string>(candidates.map((row: { pkghash?: string }) => String(row.pkghash || '')));
  if (hashes.size !== 1 || hashes.has('')) {
    throw new Error(`исходная сборка ${pkg.source} ${vr} не подтверждена в ${branchLabel(branch)}; обновите снимки данных`);
  }
  const hash = [...hashes][0];
  const result = await json(`https://rdb.altlinux.org/api/site/package_changelog/${encodeURIComponent(hash)}?changelog_last=1000`);
  if (String(result.pkghash) !== hash || !Array.isArray(result.changelog)) {
    throw new Error('источник changelog не подтвердил выбранную сборку');
  }
  return result.changelog;
}
