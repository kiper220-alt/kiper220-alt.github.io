<script lang="ts">
    import {ModeWatcher} from "mode-watcher";
    import { branchSettingsFromList, changeBranches, changeTab, listFromBranchSettings, setDndSort, setGroups, settings } from "./components/settings";
    import TabbedPackageTable from "./components/TabbedPackageTable.svelte";
    import DocMode from "./doc/DocMode.svelte";
    import './doc/doc.css';

    let view = $state<'branches' | 'components'>('branches');

    let branches = $state(branchSettingsFromList(settings.branches));
    let groups = $state(settings.groups);
    let currentTab = $state(Math.min(settings.tab, settings.groups.length ? settings.groups.length - 1 : 0));
    let dndSort = $state(settings.dndsort);

    $effect(() => {
        changeBranches(listFromBranchSettings(branches));
    })
    $effect(() => {
        setDndSort(dndSort);
    })
    $effect(() => {
        setGroups(groups);
    })
    $effect(() => {
        changeTab(currentTab);
    })
</script>

<ModeWatcher/>
<nav class="site-modes" aria-label="Режим сайта"><button class:active={view === 'branches'} onclick={() => view = 'branches'}>Сравнение веток</button><button class:active={view === 'components'} onclick={() => view = 'components'}>Компоненты и пакеты</button></nav>
{#if view === 'branches'}
    <TabbedPackageTable bind:packages={groups} bind:branches={branches} bind:dndSort={dndSort} bind:tab={currentTab}/>
{:else}
    <DocMode/>
{/if}
