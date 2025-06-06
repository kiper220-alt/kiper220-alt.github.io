<script lang="ts">
    import SearchField from "./SearchField.svelte";
    import SettingsDialog from "./SettingsDialog.svelte";
    import {type BranchSettings, type PackageGroup, branchList, defaultBranchSettings} from "./settings";

    interface Props {
        branches: BranchSettings;
        packages: PackageGroup[];
        tab: number,
        dndSort: boolean;
    }

    let {
        branches = $bindable({branches: defaultBranchSettings}),
        packages = $bindable([]),
        tab = $bindable(0),
        dndSort = $bindable(true),
    }: Props = $props();

</script>

<nav class="flex items-center p-2 border-b justify-between w-full">
    <SettingsDialog bind:branches={branches} bind:dndSort={dndSort}/>
    <SearchField branches={branches} bind:packages={packages} {tab}/>
</nav>
