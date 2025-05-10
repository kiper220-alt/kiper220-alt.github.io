<script lang="ts">
    import {Input} from "$lib/components/ui/input";
    import {onMount} from "svelte";
    import {cn} from "$lib/utils.js";
    import {Badge} from "$lib/components/ui/badge/index.js";
    import {Skeleton} from "$lib/components/ui/skeleton/index.js";
    import "./search";
    import SearchResult from "$components/SearchResult.svelte";

    let displayedText = $state('');
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

    function getRandomPlaceholder(): string {
        const index = Math.floor(Math.random() * randomData.length);
        return randomData[index];
    }

    async function typeEffect(text: string) {
        while (displayedText.length > 0) {
            displayedText = displayedText.slice(0, -1);
            await new Promise(resolve => setTimeout(resolve, type_speed));
        }

        for (const char of text) {
            displayedText += char;
            await new Promise(resolve => setTimeout(resolve, type_speed));
        }
    }

    function updatePlaceholder() {
        const newPlaceholder = getRandomPlaceholder();
        typeEffect(newPlaceholder);
    }

    $effect(() => {
        if (value.length === 0 && open) {
            open = false;
        } else if (value.length >= 1 && !open) {
            open = true;
        }
    });

    onMount(() => {
        updatePlaceholder();
        const interval = setInterval(updatePlaceholder, word_speed);
        return () => clearInterval(interval);
    });
</script>

<div>
    <Input {...restProps} bind:this={ref}
           bind:value class={cn("h-9 sm:w-[500px] lg:w-[700px]", className)}
           placeholder={displayedText}
           type="search"/>
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