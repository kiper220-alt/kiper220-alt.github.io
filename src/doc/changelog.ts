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
): Promise<ChangelogEntry[]> {
  const response = await request(
    `https://rdb.altlinux.org/api/site/source_package_versions?name=${encodeURIComponent(pkg.source)}`,
    { signal },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const versions = await response.json();
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
  const logResponse = await request(
    `https://rdb.altlinux.org/api/site/package_changelog/${encodeURIComponent(hash)}?changelog_last=1000`,
    { signal },
  );
  if (!logResponse.ok) throw new Error(`HTTP ${logResponse.status}`);
  const result = await logResponse.json();
  if (String(result.pkghash) !== hash || !Array.isArray(result.changelog)) {
    throw new Error('источник changelog не подтвердил выбранную сборку');
  }
  return result.changelog;
}
