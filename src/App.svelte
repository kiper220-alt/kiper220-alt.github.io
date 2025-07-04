<script lang="ts">
    import {ModeWatcher} from "mode-watcher";
    import { branchSettingsFromList, changeBranches, changeTab, listFromBranchSettings, setDndSort, setGroups, settings } from "./components/settings";
    import TabbedPackageTable from "./components/TabbedPackageTable.svelte";

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
<TabbedPackageTable bind:packages={groups} bind:branches={branches} bind:dndSort={dndSort} bind:tab={currentTab}/>
