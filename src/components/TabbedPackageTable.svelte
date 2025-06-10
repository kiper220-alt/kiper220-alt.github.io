<script lang="ts">
    import { stopPropagation } from "svelte/legacy";
    import PackageTable from "./PackageTable.svelte";
    import type { PackageGroup } from "./settings";
    import Tabs from "./Tabs.svelte";

    interface Props {
        packages: PackageGroup[];
        branches: string[];
        tab: number;
        dndSort: boolean;
    }

    let {
        packages = $bindable([]),
        branches = [],
        tab = $bindable(0),
        dndSort = true,
    }: Props = $props();

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

    $inspect(packages);
</script>

<Tabs tabs={groupNames} bind:activeTab={tab} {onadd} {onremove} class="flex-shrink-0"/>
{#if packages.length !== 0}
<PackageTable branches={branches} {dndSort} bind:packages={packages[tab].packages}/>
{/if}
