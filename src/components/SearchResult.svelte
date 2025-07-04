<script lang="ts">
    import {Skeleton} from "$lib/components/ui/skeleton/index.js";
    import * as search from "./search.ts";
    import {Badge} from "$lib/components/ui/badge/index.js";
    import {cn} from "$lib/utils";
    import Trash from "@lucide/svelte/icons/trash";
    import Tag from "@lucide/svelte/icons/tag";
    import Package from "@lucide/svelte/icons/package";
    import {ScrollArea} from "$lib/components/ui/scroll-area";
    import { ResponseError } from "$rdb/runtime.js";

    interface Props {
        prompt: string,
        packages: string[],
        tab: number,
    };

    let {prompt = $bindable(""), packages = $bindable([]), tab}: Props = $props();

    let results = $state<search.FindResultElement[]>([]);
    let filteredResults = $derived(results.filter(a => packages.findIndex(b => a.name === b) === -1));
    let isLoading = $state(true);
    let error = $state<string | null>(null);


    // Packet search function with error handling
    async function findPackage(currentPrompt: string) {
        if (!currentPrompt.trim()) {
            results = [];
            isLoading = false;
            error = null;
            return;
        }

        try {
            isLoading = true;
            error = null;
            results = await search.findPackage(currentPrompt);
        } catch (err: unknown | Error) {
            error = "Failed to fetch packages";
            if (err instanceof ResponseError) {
                const json = await err.response.json();
                error = json.error;
            }
            results = [];
        } finally {
            isLoading = false;
        }
    }

    function addPackage(name: string, deleted: boolean) {
        if (deleted) {
            return;
        }
        packages.push(name);
        prompt = "";
    }

    // Эффект для дебаунсинга поиска
    $effect(() => {
        const fix = prompt;
        let timer: number = setTimeout(() => findPackage(fix), 1000);

        // Очистка при уничтожении компонента
        return () => {
            clearTimeout(timer);
        };
    });
</script>

<ScrollArea class="max-h-[50vh] overflow-y-auto" tabindex={-1}>
    {#if isLoading || error}
        <!-- Skeletons on loading or error -->
        <div
                class={cn(
                "flex flex-col p-2 border-b last:border-none transition-colors",
                error && "opacity-50"
            )}
                role="status"
                aria-live="polite"
        >
            <Skeleton class="h-5 w-28 select-none"/>
            <Skeleton class="h-4 w-48 mt-1 select-none"/>
            <div class="mt-1 select-none">
                <Skeleton class="h-5 w-28 float-end"/>
            </div>
            {#if error}
                <p class="text-red-500 text-xs mt-1">{error}</p>
            {/if}
        </div>
    {:else if filteredResults.length === 0 && prompt.trim()}
        <!-- Message if no results -->
        <div
                class="flex flex-col p-2 border-b last:border-none text-muted-foreground text-sm"
                role="status"
                aria-live="polite"
        >
            No packages found for "{prompt}"
        </div>
    {:else if filteredResults.length > 0}
        <!-- Search results -->
        {#each filteredResults as pkg (pkg.name)}
            <button
                    class={cn(
                    "flex flex-col p-2 w-full text-left border-b last:border-none cursor-pointer transition-colors hover:bg-accent",
                    pkg.deleted ? "opacity-50 cursor-not-allowed" : "focus:bg-accent"
                )}
                    role="option"
                    aria-selected="false"
                    tabindex="0"
                    onclick={() => addPackage(pkg.name, pkg.deleted)}
                    aria-label={`Package ${pkg.name}, version ${pkg.version}`}
            >
                <div class="font-semibold text-sm select-none flex flex-row">
                    {#if !pkg.deleted}
                        <Package size={16}/>
                    {/if}
                    {#if pkg.deleted}
                        <Trash size={16}/>
                    {/if}
                    <p class="ml-1">{pkg.name}</p>
                </div>
                <div
                        class="text-muted-foreground mt-1 line-clamp-2 text-xs select-none"
                >
                    <p>{pkg.description}</p>
                </div>
                <div class="mt-1 select-none">
                    {#if !pkg.deleted}
                        <Badge variant="default" class="float-end">
                            <Tag size={16}/>
                            <p class="ml-1">{pkg.version}</p>
                        </Badge>
                    {/if}
                    {#if pkg.deleted}
                        <Badge variant="destructive" class="float-end mr-2">
                            <Trash size={16}/>
                            <p class="ml-1"> Sisyphus</p>
                        </Badge>
                    {/if}
                </div>
            </button>
        {/each}
    {/if}
</ScrollArea>
