<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    changelogRange,
    compareEVR,
    compareImageSnapshot,
    resolvePackage,
    type ComponentRow,
    type PackageResolution,
    type PackageRow,
    type BranchSnapshot,
    type FrozenReleaseSnapshot,
  } from "./model";
  import { changeFilters, matchesFilters, packagesForChangeFilter, type PackageChangeFilter } from "./change-filters";
  import { branchLabel, fetchSourceChangelog, type ChangelogBranch, type ChangelogEntry } from "./changelog";
  import { lastResultKey, startRuntime, usableResult, type RuntimeResult, type RuntimeSession } from "./runtime";
  import { browserCache, type RuntimeCache } from "./cache";
  import { RELEASE, ARCHITECTURES } from "./config";
  import { changeLabel, componentLabel, resolutionLabel } from "./labels";
  import { RuntimePriority } from "./queue";

  const release = RELEASE;
  let edition = $state("edition_server");
  let arch = $state(ARCHITECTURES[0]);
  let current = $state<BranchSnapshot | null>(null);
  let image = $state<FrozenReleaseSnapshot | null>(null);
  let sisyphus = $state<BranchSnapshot | null>(null);
  let sisyphusError = $state("");
  let loading = $state(true);
  let error = $state("");
  let dataWarnings = $state<string[]>([]);
  let checking = $state(false);
  let session: RuntimeSession | undefined;
  let loadRequest = 0;
  const successfulLoads = new Map<string, RuntimeResult>();
  const runtimeCache: RuntimeCache = browserCache();
  const runtimePriority = new RuntimePriority();
  let query = $state("");
  let sectionFilter = $state("");
  let categoryFilter = $state("");
  let changeFilter = $state<PackageChangeFilter>("");
  let expanded = $state<string | null>(null);
  let selection = $state<{ component: string; name: string } | null>(null);
  let changelog = $state<ChangelogEntry[]>([]);
  let changelogBranch = $state<ChangelogBranch>('p11');
  let changelogMode = $state<'range' | 'full'>('range');
  let changelogState = $state("");
  let changelogRequest = 0;
  let changelogController: AbortController | undefined;

  const allRows = $derived.by(() =>
    current && image ? compareImageSnapshot(image, current, edition) : [] as ComponentRow[],
  );
  const selectedComponent = $derived(allRows.find(row => row.name === selection?.component) ?? null);
  const selected = $derived(selectedComponent?.rows.find(row => row.name === selection?.name) ?? null);
  const categories = $derived([...new Set(allRows.map((row) => row.category).filter(Boolean))] as string[]);
  const sections = $derived([...new Set(allRows.map((row) => row.section))]);
  const visible = $derived(allRows.filter((row) => {
    if (sectionFilter && row.section !== sectionFilter) return false;
    if (categoryFilter && row.category !== categoryFilter) return false;
    if (!matchesFilters(row, changeFilter)) return false;
    return !query || `${row.name} ${row.title} ${row.rows.map((p) => [p.name, ...(p.beforeResolution?.candidates || []), ...(p.afterResolution?.candidates || [])].join(" ")).join(" ")} ${row.kernelModules.join(" ")}`
      .toLowerCase().includes(query.toLowerCase());
  }));
  function resolveSisyphus(name: string): PackageResolution {
    return !sisyphus && sisyphusError ? { kind: 'unknown', candidates: [] } : resolvePackage(sisyphus, name);
  }
  const selectedSisyphus = $derived(selected ? resolveSisyphus(selected.name) : undefined);
  const selectedTarget = $derived(changelogBranch === 'p11' ? selected?.afterResolution : selectedSisyphus);
  const selectedSource = $derived(selectedTarget?.package?.source || "");
  const selectedBranchSnapshot = $derived(changelogBranch === 'p11' ? current : sisyphus);
  const displayedBefore = $derived(selected?.before);
  const displayedBeforeResolution = $derived(selected?.beforeResolution
    ? {...selected.beforeResolution, package:displayedBefore} : undefined);
  const selectedProviderChanged = $derived(!!displayedBefore && !!selectedTarget?.package &&
    selected?.beforeResolution?.name !== selectedTarget.name);
  const affected = $derived(selectedSource
    ? allRows.filter((row) => row.rows.some((pkg) =>
        selectedBranchSnapshot && resolvePackage(selectedBranchSnapshot, pkg.name).package?.source === selectedSource)).map((row) => row.title)
    : []);

  // A scalar identity prevents unrelated background updates from restarting
  // changelog requests. Selection itself is always derived from current rows.
  const changelogIdentity = $derived(JSON.stringify([
    arch, edition, selected?.name, changelogBranch,
    selectedTarget?.kind, selectedTarget?.name, selectedTarget?.package,
    selected?.beforeResolution?.kind, selected?.beforeResolution?.name, selected?.before,
  ]));
  $effect(() => {
    void changelogIdentity;
    untrack(() => {
      if (selected) void loadChangelog(selected, changelogBranch);
      else { ++changelogRequest; changelogController?.abort(); }
    });
  });

  function applyRuntimeResult(value: RuntimeResult, request: number) {
    if (request !== loadRequest) return;
    loading = false;
    current = value.current;
    image = value.image;
    sisyphus = value.sisyphus;
    sisyphusError = value.sisyphusError || "";
    dataWarnings = value.warnings;
    checking = value.stage !== 'complete';
    if (value.stage === 'complete' && value.metrics.failed === 0) successfulLoads.set(arch, value);
  }

  async function load() {
    const request = ++loadRequest;
    session?.cancel();
    const requestedArch = arch;
    loading = true;
    checking = false;
    error = "";
    const previousCandidate = successfulLoads.get(requestedArch) || await runtimeCache.get<RuntimeResult>(lastResultKey(requestedArch));
    if (request !== loadRequest) return;
    const previous = usableResult(previousCandidate, requestedArch) ? previousCandidate : undefined;
    current = previous?.current || null;
    image = previous?.image || null;
    sisyphus = previous?.sisyphus || null;
    sisyphusError = "";
    closePackage();
    dataWarnings = [];
    try {
      const active = startRuntime(requestedArch, { cache: runtimeCache, priority: runtimePriority,
        update: value => applyRuntimeResult(value, request) });
      session = active;
      await active.initial;
      await active.done;
      if (request !== loadRequest) return;
    } catch (e) {
      if (request !== loadRequest) return;
      session?.cancel();
      if (previous) applyRuntimeResult(previous, request);
      checking = false;
      error = `Не удалось получить данные напрямую: ${String(e)}${previous && usableResult(previous, requestedArch)
        ? ". На экране сохранён предыдущий успешный результат." : ""}`;
    } finally {
      if (request === loadRequest) {
        loading = false;
      }
    }
  }

  function setPriority(row: ComponentRow | null, pkg: PackageRow | null = null) {
    runtimePriority.setComponent(row?.rows.map(item => item.name) || []);
    runtimePriority.setPackage(pkg?.name || "");
  }

  function toggleComponent(row: ComponentRow) {
    const next = expanded === row.name ? null : row.name;
    expanded = next;
    setPriority(next ? row : null);
  }

  onMount(() => {
    void load();
    return () => { ++loadRequest; session?.cancel(); closePackage(); };
  });

  const definitionLink = (row: ComponentRow) => current
    ? current.definitions.source.replace(/\.git$/, '') + "/src/tag/" + current.definitions.tag + "/" + (row.path || `components/${row.name}/${row.name}.component`)
    : "";

  function openPackage(pkg: PackageRow, component: ComponentRow) {
    setPriority(component, pkg);
    selection = { component: component.name, name: pkg.name };
    changelogBranch = 'p11';
  }

  function switchChangelog(branch: ChangelogBranch) {
    if (branch === changelogBranch || !selected) return;
    changelogBranch = branch;
  }

  async function loadChangelog(pkg: PackageRow, branch: ChangelogBranch) {
    const request = ++changelogRequest;
    changelogController?.abort();
    changelogController = new AbortController();
    const signal = changelogController.signal;
    changelog = [];
    changelogMode = 'range';
    changelogState = "Загрузка changelog…";
    const target = branch === 'p11' ? resolvePackage(current, pkg.name) : resolveSisyphus(pkg.name);
    const after = target?.package;
    if (!target || target.kind === 'pending') {
      changelogState = "Проверяется RPM-поставщик; changelog загрузится после проверки.";
      return;
    }
    if (!after) {
      changelogState = target?.kind === 'ambiguous' || target?.kind === 'unknown'
        ? `Нельзя загрузить changelog ${branchLabel(branch)}: ${resolutionLabel(target)}.`
        : `Пакет не найден в снимке ${branchLabel(branch)}; changelog этой ветки недоступен.`;
      return;
    }
    const actual = pkg.beforeResolution?.name;
    const before = actual && image ? image.packages[actual] : pkg.before;
    const providerChanged = !!before && pkg.beforeResolution?.name !== target?.name;
    let fullReason = '';
    if (providerChanged) {
      fullReason = "RPM-поставщик изменился. Общий диапазон changelog разных RPM не определяется автоматически. Показаны доступные записи выбранного RPM.";
    } else if (!before?.evr) {
      fullReason = `Версия RPM в образе ${release} не определена. Показаны доступные записи выбранной ветки; диапазон изменений от ${release} определить нельзя.`;
    }
    changelogMode = fullReason ? 'full' : 'range';
    try {
      const epochWarning = !fullReason && before?.epochKnown === false
        ? `Полная RPM-версия не подтверждена в фиксированной базе ${release}. Границы changelog предварительные.` : "";
      if (request !== changelogRequest) return;
      if (!fullReason && before && compareEVR(before.evr, after.evr) === 0) {
        changelogState = epochWarning || "Версии совпадают; перехода между версиями нет.";
        return;
      }
      changelogState = "Загрузка changelog…";
      const entries = await fetchSourceChangelog(branch, after, signal);
      if (request !== changelogRequest) return;
      const range = fullReason || !before
        ? {entries, reason:fullReason} : changelogRange(entries, before.evr, after.evr);
      changelog = range.entries;
      changelogState = [
        epochWarning,
        range.reason,
        !range.entries.length ? (fullReason ? "Записей changelog нет." : "Записей в найденном диапазоне нет.") : "",
        fullReason && entries.length >= 1000 ? "Загружены последние 1000 записей; остальная история доступна в полном источнике." : "",
      ].filter(Boolean).join(" ");
    } catch (e) {
      if (request !== changelogRequest) return;
      changelogState = `Changelog ${branchLabel(branch)} недоступен: ${String(e)}. Проверьте полный источник.`;
    }
  }

  function closePackage() {
    ++changelogRequest;
    changelogController?.abort();
    selection = null;
    runtimePriority.setPackage("");
  }
</script>

{#snippet packageVersion(resolution: PackageResolution | undefined, fallback: string, epochWarning = false)}
  {resolution?.package?.evr || resolutionLabel(resolution) || fallback}
  {#if resolution?.kind === 'provided'}<small class="doc-cell-note doc-provider">RPM: {resolution.name} · Provides</small>{/if}
  {#if resolution?.kind === 'ambiguous'}<small class="doc-cell-note doc-provider">{resolution.candidates.join(", ")}</small>{/if}
  {#if epochWarning}<small class="doc-cell-note">epoch не подтверждён</small>{/if}
{/snippet}

<main class="doc-shell" aria-busy={loading || checking}>
  <div class="doc-top">
    <div>
      <h1>Компоненты и пакеты</h1>
      <p>Состав редакций по alt-components-base{current ? ` ${current.definitions.package?.evr || current.definitions.tag} из снимка p11` : ""}; версии образа {release}, p11 и Sisyphus</p>
    </div>
  </div>
  <div class="doc-toolbar">
    <label>Редакция <select bind:value={edition} onchange={() => { closePackage(); expanded = null; sectionFilter = ""; categoryFilter = ""; }}>
      <option value="edition_server">Альт Сервер</option>
      <option value="edition_domain">Альт Домен</option>
    </select></label>
    <label>Выпуск <select><option>{release}</option></select></label>
    <label>Архитектура <select bind:value={arch} onchange={() => {
      closePackage();
      expanded = null;
      void load();
    }}>{#each ARCHITECTURES as architecture}<option>{architecture}</option>{/each}</select></label>
  </div>
  {#if loading}<div class="doc-message" role="status">Загрузка данных…{current ? " До завершения показан предыдущий успешный результат." : ""}</div>{/if}
  {#if error}<div class="doc-message doc-error" role="alert">{error}</div>{/if}
  {#each dataWarnings as warning}<div class="doc-message doc-warning">{warning}</div>{/each}
  {#if current && image}
    <div class="doc-sources">
      <a href={image.source} target="_blank" rel="noreferrer">Список пакетов образа</a>
      <a href={current.source} target="_blank" rel="noreferrer">Источник p11</a>
      <a href={current.definitions.source.replace(/\.git$/, '') + "/src/tag/" + current.definitions.tag} target="_blank" rel="noreferrer">Компоненты {current.definitions.package?.evr || current.definitions.tag}</a>
      {#if sisyphus}
        <a href={sisyphus.source} target="_blank" rel="noreferrer">Источник Sisyphus</a>
      {/if}
    </div>
    <p class="doc-definition">Имя в компоненте может предоставляться другим RPM через <code>Provides</code>. В таком случае под версией указан реальный RPM; сравнивается его версия. При нескольких поставщиках версия не выбирается автоматически.</p>
    <div class="doc-toolbar doc-filters">
      <input aria-label="Поиск компонентов и пакетов" placeholder="Компонент или пакет" bind:value={query} />
      <select aria-label="Раздел редакции" bind:value={sectionFilter}>
        <option value="">Все разделы</option>
        {#each sections as section}<option value={section}>{current.definitions.editions[edition]?.sections[section]?.title || section}</option>{/each}
      </select>
      <select aria-label="Категория" bind:value={categoryFilter}>
        <option value="">Все категории</option>
        {#each categories as category}<option value={category}>{current.definitions.categories[category]?.title || category}</option>{/each}
      </select>
      <select aria-label="Тип изменения" bind:value={changeFilter}>
        {#each changeFilters as filter}<option value={filter.value}>{filter.label}</option>{/each}
      </select>
    </div>
    <div class="doc-count">Компонентов: {visible.length} из {allRows.length}. В таблице — только пакеты, явно перечисленные в компонентах.</div>
    {#if !visible.length}<div class="doc-message">По выбранным условиям компонентов нет.</div>{/if}
    {#each visible as row (row.name)}
      <section class="doc-card">
        <button class="doc-card-head" onclick={() => toggleComponent(row)} aria-expanded={expanded === row.name}>
          <span class="doc-chevron">{expanded === row.name ? "▾" : "▸"}</span>
          <span><strong>{row.title}</strong><small>{row.name} · {current.definitions.editions[edition]?.sections[row.section]?.title || row.section} · {current.definitions.categories[row.category || ""]?.title || row.category || "без категории"}</small></span>
          <span class="doc-reason">{componentLabel(row)}</span>
        </button>
        {#if expanded === row.name}
          <div class="doc-card-body">
            <p class="doc-definition"><a href={definitionLink(row)} target="_blank" rel="noreferrer">Определение компонента {current.definitions.tag} ↗</a></p>
            {#if row.rows.length}
            {#if changeFilter}<p class="doc-definition">Пакетов по фильтру: {packagesForChangeFilter(row, changeFilter).length} из {row.rows.length}. Для полного состава выберите «Все пакеты».</p>{/if}
            <div class="doc-table-wrap">
              <table>
                <thead><tr><th>Пакет</th><th>Версия в {release}</th><th>Версия в p11</th><th>Версия в Sisyphus</th><th>Тип изменения</th></tr></thead>
                <tbody>
                  {#each packagesForChangeFilter(row, changeFilter) as pkg}
                    {@const sisyphusResolution = resolveSisyphus(pkg.name)}
                    <tr>
                      <td><button class="doc-package" onclick={() => openPackage(pkg, row)}>{pkg.name}</button></td>
                      <td>{@render packageVersion(pkg.beforeResolution, "нет в образе", pkg.before?.epochKnown === false && !!pkg.after?.evr.includes(':'))}</td>
                      <td>{@render packageVersion(pkg.afterResolution, "нет в p11")}</td>
                      <td>{@render packageVersion(sisyphusResolution, "нет в Sisyphus")}</td>
                      <td>{changeLabel(pkg.change)}{#if pkg.composition && pkg.composition !== pkg.change}; {changeLabel(pkg.composition)}{/if}{#if pkg.availability && pkg.availability !== pkg.change}; {changeLabel(pkg.availability)}{/if}{#if pkg.providerChanged && pkg.change !== 'provider-changed'}; изменился поставщик RPM{/if}{#if pkg.pending}<small class="doc-cell-note">проверка продолжается</small>{/if}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            {/if}
            {#if row.kernelModules.length}
              <div class="doc-kernel-note">
                <strong>Шаблоны модулей ядра:</strong> {row.kernelModules.join(", ")}. Они помечены в определении как <code>kernel_module = true</code>, не являются точными именами RPM и зависят от варианта ядра. Их версии здесь не сравниваются.
              </div>
            {/if}
          </div>
        {/if}
      </section>
    {/each}
  {/if}
</main>

{#if selected}
  <div class="doc-overlay" role="presentation" onclick={closePackage}></div>
  <aside class="doc-panel" aria-label="Пакет">
    <button class="doc-close" onclick={closePackage}>Закрыть ×</button>
    <h2>{selected.name}</h2>
    {#if selectedComponent}<p>Имя взято из <a href={definitionLink(selectedComponent)} target="_blank" rel="noreferrer">определения компонента {selectedComponent.name}</a>.</p>{/if}
    <p>Исходный пакет {branchLabel(changelogBranch)}: {selectedSource || resolutionLabel(selectedTarget) || "нет данных"}</p>
    <div class="doc-versions" role="group" aria-label="Ветка changelog">
      <span>Образ {release}<br /><strong>{@render packageVersion(displayedBeforeResolution, "нет в образе")}</strong></span>
      <button aria-label="Changelog p11" aria-pressed={changelogBranch === 'p11'} onclick={() => switchChangelog('p11')}>p11<br /><strong>{@render packageVersion(selected.afterResolution, "нет в p11")}</strong></button>
      <button aria-label="Changelog Sisyphus" aria-pressed={changelogBranch === 'sisyphus'} onclick={() => switchChangelog('sisyphus')}>Sisyphus<br /><strong>{@render packageVersion(selectedSisyphus, "нет в Sisyphus")}</strong></button>
    </div>
    {#if selectedProviderChanged}<p>Поставщик изменился: <code>{selected.beforeResolution?.name}</code> → <code>{selectedTarget?.name}</code> в {branchLabel(changelogBranch)}. Это изменение реального RPM, а не номера версии одного пакета.</p>{/if}
    {#each [{label:`Образ ${release}`, resolution:selected.beforeResolution, snapshot:image}, {label:"p11", resolution:selected.afterResolution, snapshot:current}, {label:"Sisyphus", resolution:selectedSisyphus, snapshot:sisyphus}] as state}
      {#if state.resolution?.kind === 'provided' && state.resolution.source}
        <p>{state.label}: <code>{selected.name}</code> → <code>{state.resolution.name}</code>. <a href={state.resolution.source} target="_blank" rel="noreferrer">Подтверждение Provides в RPM ↗</a></p>
      {:else if state.resolution?.kind === 'ambiguous'}
        <p>{state.label}: несколько поставщиков; автоматический выбор отключён.</p>
        <ul>{#each state.resolution.candidates as actual}<li>{actual}: {state.snapshot?.packages[actual]?.evr || "нет данных"}</li>{/each}</ul>
      {:else if state.resolution?.kind === 'unknown'}
        <p>{state.label}: RPM-поставщик не подтверждён. Это недостаток данных, а не доказательство удаления пакета.</p>
      {/if}
    {/each}
    {#if selectedTarget?.package?.evr.includes(':') || displayedBefore?.evr.includes(':')}<p>Префикс «N:» — RPM epoch. Он учитывается при сравнении раньше version и release и не является ошибкой в номере версии.</p>{/if}
    {#if displayedBefore?.epochSource}<p><a href={displayedBefore.epochSource} target="_blank" rel="noreferrer">Источник epoch версии {release} (changelog по хешу RPM) ↗</a></p>{/if}
    <p>Затронутые компоненты: {affected.join(", ") || "нет данных"}</p>
    <h3>Changelog</h3>
    <p class="doc-changelog-range">{changelogMode === 'range' ? `Образ ${release} → ${branchLabel(changelogBranch)}` : `История RPM в ${branchLabel(changelogBranch)}`}{selectedTarget?.package ? ` · ${selectedTarget.name} · ${selectedTarget.package.evr}` : ''}</p>
    {#if selectedSource}<a href={"https://packages.altlinux.org/ru/" + changelogBranch + "/srpms/" + encodeURIComponent(selectedSource) + "/"} target="_blank" rel="noreferrer">Полный источник ↗</a>{/if}
    {#if changelogState}<p class="doc-warning-text" role="status">{changelogState}</p>{/if}
    {#each changelog as entry}<div class="doc-log"><strong>{entry.evr || 'версия не указана'}</strong> <small>{entry.date?.slice(0, 10)}</small><pre>{entry.message}</pre></div>{/each}
  </aside>
{/if}
