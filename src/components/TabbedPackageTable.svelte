<script lang="ts">
    import PackageTable from "./PackageTable.svelte";
    import { defaultBranchSettings, listFromBranchSettings, type BranchSettings, type PackageGroup } from "./settings";
    import Tabs from "./Tabs.svelte";
    import SettingsDialog from "./SettingsDialog.svelte";
    import SearchField from "./SearchField.svelte";

    interface Props {
        packages: PackageGroup[];
        branches: BranchSettings;
        tab: number;
        dndSort: boolean;
    }

    let {
        packages = $bindable([]),
        branches = $bindable({branches: defaultBranchSettings}),
        tab = $bindable(0),
        dndSort = $bindable(true),
    }: Props = $props();

    let branchList = $derived(listFromBranchSettings(branches));
    let groupNames = $derived(packages.map(p => p.name));

    function onadd(name: string, pkgs: string[]) {
        packages.push({name, packages: pkgs});
    }

    function onremove(index: number, _: string) {
        if (tab >= index) {
            tab = Math.max(tab - 1, 0);
        }
        packages.splice(index, 1);
    }

    function onrerange(old_position: number, new_position: number) {
        const temp = packages[old_position];
        packages[old_position] = packages[new_position];
        packages[new_position] = temp;
    }
</script>
<div class="flex items-center shrink-0 justify-stretch border-b gap-2 w-screen overflow-hidden flex-row">
    <SettingsDialog bind:branches={branches} bind:dndSort={dndSort}/>
    <Tabs tabs={groupNames} bind:activeTab={tab} {onadd} {onrerange} {onremove} class="flex-shrink-0"/>
    {#if groupNames.length !== 0}
        <SearchField branches={branchList} bind:packages={packages}/>
    {/if}
</div>
{#if packages.length !== 0}
<PackageTable branches={branchList} {dndSort} bind:packages={packages[tab].packages}/>
{/if}
