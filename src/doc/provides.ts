import type { Package, ProviderRecord } from './model.ts';
import type { Row } from './acquisition.ts';

export const API = 'https://rdb.altlinux.org/api';
export const providerURL = (branch: string, name: string) =>
  `${API}/dependencies/packages_by_dependency?${new URLSearchParams({ branch, dp_name: name, dp_type: 'provide', last_state: 'false' })}`;

// Same input/output contract as scripts/provides.py; shared fixtures exercise
// both implementations. Transport, caching and scheduling belong to callers.
export async function resolveBranchProvider(
  branch: string, name: string, arch: string, index: Record<string, Package>,
  data: { request_args?: { branch?: string; dp_name?: string; dp_type?: string }; length?: number; packages?: Row[] } | null,
  metadata: (hash: string) => Promise<{ source: string; provides: string[] }>,
): Promise<{ record: ProviderRecord; packages: Record<string, Package> }> {
  const source = providerURL(branch, name);
  if (data && (!Array.isArray(data.packages) || data.request_args?.branch !== branch ||
      data.request_args.dp_name !== name || data.request_args.dp_type !== 'provide' || data.length !== data.packages.length)) {
    throw new Error('Неполный ответ поиска Provides');
  }
  const candidates = new Set<string>(), evidence: Record<string, string> = {}, packages: Record<string, Package> = {};
  for (const row of data?.packages || []) {
    const pkg = index[row.name];
    if (!pkg || !['noarch', arch].includes(row.arch) || row.arch !== pkg.arch) continue;
    if (`${row.version}-${row.release}` !== pkg.evr.replace(/^[0-9]+:/, '') || !row.hash) {
      throw new Error(`Несогласованные сведения о ${row.name} в ${branch}`);
    }
    const proof = await metadata(String(row.hash));
    if (!proof.provides.includes(name)) throw new Error(`Provides ${name} не подтверждён RPM ${row.name}`);
    candidates.add(row.name);
    evidence[row.name] = proof.source;
    packages[row.name] = { ...pkg, hash: String(row.hash) };
  }
  return { record: { candidates: [...candidates].sort(), evidence, source, complete: true, status: 'complete' }, packages };
}
