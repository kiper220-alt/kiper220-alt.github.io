<script lang="ts">
    import SearchField from "./SearchField.svelte";
    import SettingsDialog from "./SettingsDialog.svelte";
    import {type BranchSettings, branchList, defaultBranchSettings} from "./settings";

    // Инициализация пропсов
    let {
        branches = $bindable({...defaultBranchSettings}),
    }: BranchSettings = $props();

</script>

<nav class="flex items-center p-2 border-b justify-between w-full">
    <SettingsDialog bind:branches={branches}/>
    <SearchField branches={branches}/>
</nav>

{#each branchList as {key, title}}
    {title}: {branches[key].checked} <br>
{/each}