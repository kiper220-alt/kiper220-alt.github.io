<script lang="ts">
    import PackageTable from "./PackageTable.svelte";
    import type { PackageGroup } from "./settings";
    import Tabs from "./Tabs.svelte";

    interface Props {
        packages: PackageGroup[];
        branches: string[];
        tab: number;
    }

    let {
        packages = $bindable([]),
        branches = [],
        tab = $bindable(0)
    }: Props = $props();

    function onadd(name: string) {
        packages = [...packages, {name, packages: []}];
    }

    function onremove(index: number, _: string) {
        packages = [...packages.slice(0, index), ...packages.slice(index + 1)];
    }

</script>

<Tabs tabs={packages.map(p => p.name)} bind:activeTab={tab} {onadd} {onremove}/>
{#if packages.length !== 0}
<PackageTable branches={branches} bind:packages={packages[tab].packages}/>
{/if}
