<script lang="ts">
    import {Input} from "$lib/components/ui/input";
    import {onMount} from "svelte";
    import {cn} from "$lib/utils.js";
    import "./search";
    import SearchResult from "$components/SearchResult.svelte";
    import HolderPromptInput from "./HolderPromptInput.svelte";
    import { Search, TestTube } from "@lucide/svelte";

    let {
        ref = $bindable(null),
        type_speed = $bindable(40),
        word_speed = $bindable(5000),
        value = $bindable(''),
        packages = $bindable([]),
        tab = 0,
        class: className = "",
        ...restProps
    } = $props();

    let inputElement : HTMLInputElement | null = $state(null);

    const randomData: string[] = [
        "alteratorctl", "gpupdate", "admc",
        "gpui", "samba", "firefox", "portproton-installer",
        "kubernetes", "gnome3", "gdm", "qt-creator",
        "gcc", "llvm", "rust", "zig", "thunderbird",
        "oneko", "kitty", "neovim", "LibreOffice", "d-feet",
        "alterator-auth", "alterator-manager", "alterator-module-executor",
    ];

    let open = $derived(value.length >= 1);

    function escapeEvent(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            value = "";
        }
    }

</script>
<div>
    <div class="flex flex-row items-stretch *:focus-within:outline">
        <button onclick={
            a => {
                a.preventDefault();
                inputElement?.focus();
            }
        }
            class="p-1 px-3 border-l border-t border-b flex bg-primary text-primary-foreground items-center outline-offset-[-3px] outline-4 outline-primary rounded-l-full">
            <Search size={16}/>
        </button>
        <HolderPromptInput bind:ref={inputElement} bind:value={value} class="h-9 rounded-l-none md:w-[500px] lg:w-[700px]" onkeydown={escapeEvent}
        prompts={randomData}/>
    </div>
    {#if open}
        <div class="h-0 sm:w-[500px] z-20 lg:w-[700px] relative top-1">
            <div class="bg-popover text-popover-foreground min-h-5 rounded-md border shadow-md outline-none">
                {#if value.length >= 1 && open}
                    <SearchResult bind:packages={packages} {tab} bind:prompt={value}></SearchResult>
                {/if}
            </div>
        </div>
    {/if}
</div>
