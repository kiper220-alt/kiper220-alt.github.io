import type { ComponentRow, PackageRow } from './model';

export const changeFilters = [
  { value: '', label: 'Все пакеты' },
  { value: 'updated', label: 'Обновлены' },
  { value: 'included', label: 'Включены в компонент' },
  { value: 'excluded', label: 'Исключены из компонента' },
  { value: 'provider-changed', label: 'Сменился RPM-поставщик' },
  { value: 'unchanged', label: 'Без изменений' },
] as const;

export type PackageChangeFilter = typeof changeFilters[number]['value'];
export type ChangeFilter = PackageChangeFilter | 'downgraded' | 'missing-p11' | 'changed' | 'composition' | 'new-component' |
  'removed-component' | 'moved' | 'no-image' | 'missing-both' | 'uncertain' |
  'ambiguous-provider' | 'kernel-modules';

export function isPackageChangeFilter(filter: ChangeFilter): boolean {
  return ['updated', 'downgraded', 'provider-changed', 'ambiguous-provider', 'missing-p11', 'included', 'excluded', 'no-image', 'missing-both', 'uncertain', 'unchanged'].includes(filter);
}

export function matchesPackageChange(pkg: PackageRow, filter: ChangeFilter): boolean {
  switch (filter) {
    case 'updated': return pkg.change === 'обновлён';
    case 'downgraded': return pkg.change === 'понижен';
    case 'provider-changed': return !!pkg.providerChanged;
    case 'ambiguous-provider': return pkg.change === 'неоднозначный поставщик RPM';
    case 'missing-p11': return !!pkg.before && !pkg.after && (pkg.change === 'отсутствует в p11' || pkg.availability === 'отсутствует в p11');
    case 'included': return pkg.composition === 'включён в компонент' || pkg.change === 'включён в компонент';
    case 'excluded': return pkg.composition === 'исключён из компонента' || pkg.change === 'исключён из компонента';
    case 'unchanged': return pkg.change === 'без изменений' && !pkg.composition && !pkg.availability && !pkg.providerChanged;
    case 'no-image': return !pkg.before && !!pkg.after && (!pkg.beforeResolution || pkg.beforeResolution.kind === 'missing');
    case 'missing-both': return pkg.change === 'нет в образе и p11' || pkg.availability === 'нет в образе и p11';
    case 'uncertain': return ['нет данных', 'неоднозначный поставщик RPM', 'epoch образа неизвестен', 'изменился version-release; epoch образа неизвестен'].includes(pkg.change);
    default: return true;
  }
}

export function matchesComponentChange(row: ComponentRow, filter: ChangeFilter): boolean {
  if (filter !== 'unchanged' && isPackageChangeFilter(filter)) return row.rows.some(pkg => matchesPackageChange(pkg, filter));
  const composition = row.kernelModulesChanged || row.rows.some(pkg => !!pkg.composition);
  switch (filter) {
    case 'changed': return row.isNew || row.removed || row.moved || composition || row.rows.some(pkg =>
      ['обновлён', 'понижен', 'появился в p11', 'изменился version-release; epoch образа неизвестен'].includes(pkg.change) || pkg.providerChanged || matchesPackageChange(pkg, 'missing-p11'));
    case 'composition': return row.isNew || row.removed || composition;
    case 'new-component': return row.isNew;
    case 'removed-component': return row.removed;
    case 'moved': return row.moved;
    case 'kernel-modules': return row.kernelModules.length > 0;
    case 'unchanged': return !row.isNew && !row.removed && !row.moved && !composition && !row.kernelModules.length && row.rows.length > 0 &&
      row.rows.every(pkg => pkg.change === 'без изменений' && !pkg.availability && !pkg.providerChanged);
    default: return true;
  }
}

export function packagesForChangeFilter(row: ComponentRow, filter: ChangeFilter): PackageRow[] {
  return row.rows.filter(pkg => !isPackageChangeFilter(filter) || matchesPackageChange(pkg, filter));
}

export function matchesFilters(row: ComponentRow, filter: PackageChangeFilter): boolean {
  return !filter || packagesForChangeFilter(row, filter).length > 0;
}
