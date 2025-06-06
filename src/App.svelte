<script lang="ts">
    import {ModeWatcher} from "mode-watcher";
    import ControlPanel from "./components/ControlPanel.svelte";
    import { branchSettingsFromList, changeBranches, listFromBranchSettings, setDndSort, setGroups, settings } from "./components/settings";
    import TabbedPackageTable from "./components/TabbedPackageTable.svelte";

    let branches = $state(branchSettingsFromList(settings.branches));
    let branchesList = $derived(listFromBranchSettings(branches));
    let groups = $state(settings.groups);
    let currentTab = $state(settings.tab);
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
</script>

<ModeWatcher/>
{#if groups.length !== 0}
<ControlPanel bind:packages={groups} tab={currentTab} bind:branches={branches} bind:dndSort={dndSort}/>
{/if}
<TabbedPackageTable bind:packages={groups} branches={branchesList} bind:tab={currentTab}/>
