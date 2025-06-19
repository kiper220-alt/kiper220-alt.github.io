<script lang="ts">
    import {ModeWatcher} from "mode-watcher";
    import ControlPanel from "./components/ControlPanel.svelte";
    import { branchSettingsFromList, changeBranches, changeTab, listFromBranchSettings, setDndSort, setGroups, settings } from "./components/settings";
    import TabbedPackageTable from "./components/TabbedPackageTable.svelte";
    import SettingsDialog from "./components/SettingsDialog.svelte";

    let branches = $state(branchSettingsFromList(settings.branches));
    let branchesList = $derived(listFromBranchSettings(branches));
    let groups = $state(settings.groups);
    let currentTab = $state(Math.min(settings.tab, settings.groups.length ? settings.groups.length - 1 : 0));
    let dndSort = $state(settings.dndsort);

    $effect(() => {
        changeBranches(branchesList);
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
{#if groups.length === 0}
    <ControlPanel packages={[]} bind:branches={branches} hideSearch={true} bind:dndSort={dndSort}/>
{:else}
    <ControlPanel bind:packages={groups[currentTab].packages} bind:branches={branches} hideSearch={false} bind:dndSort={dndSort}/>
{/if}
<TabbedPackageTable bind:packages={groups} branches={branchesList} {dndSort} bind:tab={currentTab}/>
