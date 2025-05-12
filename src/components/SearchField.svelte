<script lang="ts">
    import {Input} from "$lib/components/ui/input";
    import {onMount} from "svelte";
    import {cn} from "$lib/utils.js";
    import "./search";
    import SearchResult from "$components/SearchResult.svelte";
    import HolderPromptInput from "./HolderPromptInput.svelte";

    let open = $state(false);

    let {
        ref = $bindable(null),
        type_speed = $bindable(40),
        word_speed = $bindable(5000),
        value = $bindable(''),
        class: className = "",
        ...restProps
    } = $props();

    const randomData: string[] = [
        "alteratorctl", "gpupdate", "admc",
        "gpui", "samba", "firefox", "portproton-installer",
        "kubernetes", "gnome3", "gdm", "qt-creator",
        "gcc", "llvm", "rust", "zig", "thunderbird",
        "oneko", "kitty", "neovim", "LibreOffice", "d-feet"
    ];

    $effect(() => {
        if (value.length === 0 && open) {
            open = false;
        } else if (value.length >= 1 && !open) {
            open = true;
        }
    });

</script>
<div>
    <HolderPromptInput bind:value={value} class="h-9 sm:w-[500px] lg:w-[700px]" prompts={randomData}/>
    {#if open}
        <div class="h-0 sm:w-[500px] lg:w-[700px] relative top-1">
            <div class="bg-popover text-popover-foreground min-h-5 rounded-md border shadow-md outline-none">
                {#if value.length >= 1 && open}
                    <SearchResult prompt={value}></SearchResult>
                {/if}
            </div>
        </div>
    {/if}
</div>
