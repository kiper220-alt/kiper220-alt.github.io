<script lang="ts">
    import {Skeleton} from "$lib/components/ui/skeleton/index.js";
    import * as search from "./search.ts";
    import {Badge} from "$lib/components/ui/badge/index.js";
    import {cn} from "$lib/utils";
    import Trash from "@lucide/svelte/icons/trash";
    import Tag from "@lucide/svelte/icons/tag";
    import Package from "@lucide/svelte/icons/package";
    import {untrack} from "svelte";

    // Интерфейс для результата поиска
    interface Package {
        name: string;
        version: string;
        description: string;
        deleted: boolean;
    }

    // Интерфейс пропсов
    interface Props {
        prompt: string;
    }

    // Инициализация пропсов
    let {prompt}: Props = $props();

    // Состояние для результатов и статуса загрузки
    let results = $state<Package[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);

    // Таймер для дебаунсинга
    let timer: number | undefined;

    // Функция поиска пакетов с обработкой ошибок
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
            const tmp = await search.findPackage(currentPrompt);
            results = tmp.slice(0, 5); // Ограничение до 5 результатов
        } catch (err) {
            error = "Failed to fetch packages";
            results = [];
        } finally {
            isLoading = false;
        }
    }

    // Эффект для дебаунсинга поиска
    $effect(() => {
        const fix = prompt;
        timer = setTimeout(() => findPackage(fix), 1000);

        // Очистка при уничтожении компонента
        return () => {
            if (timer !== undefined) {
                clearTimeout(timer);
            }
        };
    });
</script>

<!-- Контейнер для результатов -->
<div class="space-y-2">
    {#if isLoading || error}
        <!-- Скелетон при загрузке или ошибке -->
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
    {:else if results.length === 0 && prompt.trim()}
        <!-- Сообщение, если нет результатов -->
        <div
                class="flex flex-col p-2 border-b last:border-none text-muted-foreground text-sm"
                role="status"
                aria-live="polite"
        >
            No packages found for "{prompt}"
        </div>
    {:else if results.length > 0}
        <!-- Результаты поиска -->
        {#each results as pkg (pkg.name)}
            <div
                    class={cn(
                    "flex flex-col p-2 border-b last:border-none cursor-pointer transition-colors hover:bg-accent",
                    "focus:bg-accent"
                )}
                    role="option"
                    tabindex="0"
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
                            <Tag size={16}/><p class="ml-1">{pkg.version}</p>
                        </Badge>
                    {/if}
                    {#if pkg.deleted}
                        <Badge variant="destructive" class="float-end mr-2">
                            <Trash size={16}/> <p class="ml-1"> Sisyphus</p>
                        </Badge>
                    {/if}
                </div>
            </div>
        {/each}
    {/if}
</div>
