import type { Change, ComponentChange, ComponentRow, PackageResolution } from './model.ts';
import { RELEASE } from './config.ts';

const changeLabels: Record<Change, string> = {
  "updated": "обновлён",
  "downgraded": "понижен",
  "unchanged": "без изменений",
  "included": "включён в компонент",
  "excluded": "исключён из компонента",
  "added-p11": "появился в p11",
  "missing-p11": "отсутствует в p11",
  "missing-image": `нет в образе ${RELEASE}`,
  "missing-both": "нет в образе и p11",
  "version-changed-epoch-unknown": "изменился version-release; epoch образа неизвестен",
  "epoch-unknown": "epoch образа неизвестен",
  "ambiguous-provider": "неоднозначный поставщик RPM",
  "provider-changed": "изменился поставщик RPM",
  "unknown": "нет данных",
  "pending": "проверяется"
};

const componentLabels: Record<ComponentChange, string> = {
  "composition": "Изменился состав",
  "provider-changed": "Изменился поставщик RPM",
  "ambiguous-provider": "Несколько RPM-поставщиков",
  "missing-p11": "Пакет отсутствует в p11",
  "versions-changed": "Обновились пакеты",
  "version-changed-epoch-unknown": "Изменился version-release; epoch неизвестен",
  "epoch-unknown": "Epoch образа неизвестен",
  "missing-both": "Пакеты не найдены в снимках",
  "missing-image": "Часть пакетов не входит в образ",
  "pending": "Проверяются данные",
  "unknown": "Нет данных",
  "kernel-only": "Шаблоны модулей ядра",
  "kernel-uncompared": "Модули ядра не сравнивались",
  "unchanged": "Без изменений",
  "new": "Новый компонент",
  "removed": "Компонент удалён",
  "moved": "Изменён раздел или категория"
};

export const changeLabel = (change: Change) => changeLabels[change];
export const componentLabel = (row: ComponentRow) => componentLabels[row.reason] + (row.pending && row.reason !== 'pending' ? ' · проверка продолжается' : '');

export function resolutionLabel(resolution: PackageResolution | undefined): string {
  if (resolution?.kind === 'pending') return 'проверяется RPM-поставщик';
  if (resolution?.kind === 'ambiguous') return 'несколько RPM-поставщиков';
  if (resolution?.kind === 'unknown') return 'RPM-поставщик не определён';
  return '';
}
