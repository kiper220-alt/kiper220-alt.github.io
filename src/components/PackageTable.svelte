<script lang="ts" module>
    import X from "@lucide/svelte/icons/x";
    import "./api";
    import * as rdb from "$rdb/";

    let data = $state(new Map<string, Map<string, string>>());

    function addPackages(packages: string[]): Promise<boolean> {
        packages = packages.filter(a => !data.has(a));
        if (packages.length === 0) {
            return new Promise((resolve, _) => { resolve(true); });
        }
        return fetchPackages(packages, defaultSettings.branches);
    }

    function getVersion(packageName: string, branch: string): string | null {
        const packageBranches = data.get(packageName);
        if (!packageBranches) {
            return null;
        }
        const version = packageBranches.get(branch);
        return version ? version : "";
    }

    function compare(packageName: string, branch1: string, branch2: string): number {
        const first = getVersion(packageName, branch1);
        const second = getVersion(packageName, branch2);
        return compareVersionsString(first ? first : "", second ? second : "");
    }

    async function fetchPackages(packages: string[], branches: string[]): Promise<boolean> {
        try {
            let findPackageSetResponse = await packageApiInstance.getRouteFindPackagesetPackageFindPackageset({packages: packages, branches: branches});

            if (findPackageSetResponse.packages === undefined) {
                return false;
            }
            let tmp = new Map(data);
            for (let a of packages) {
                tmp.set(a, new Map<string, string>(findPackageSetResponse.packages?.filter(b => a === b.sourcepkgname).map(b => {
                    if (b.branch === undefined) {
                        throw new Error("Error while fetching!");
                    }
                    let version = b.version ? b.version : "";
                    let release = b.release ? b.release : "";

                    if ((b.version === undefined) === (b.release === undefined)) {
                        return [b.branch, version + "-" + release];
                    }
                    return [b.branch, version + release];
                })));
            }
            data = tmp;
        }
        catch (error) {
            return false;
        }
        return true;
    }
</script>

<script lang="ts">
    import {ArrowDown, ArrowUp, EllipsisVertical} from '@lucide/svelte';
    import { branchList, defaultSettings } from './settings';
    import { packageApiInstance } from "./api";
    import Skeleton from "$lib/components/ui/skeleton/skeleton.svelte";
    import { compareVersionsString } from "./versioning";
    import { cn } from "$lib/utils";

    interface Props {
        branches: string[];
        packages: string[];
        dndSort: boolean;
    };

    let {branches, packages = $bindable([]), dndSort = true}: Props = $props();

    let packageOrder = $state([...packages]);

    let draggedIndex: number | null = $state(null);

    let hoverIndex: number | null = $state(null);

    $effect(() => {
        // TODO: add error handling.
        addPackages(packages);
        packageOrder = packages;
    });

    function handleDragStart(event: DragEvent, index: number) {
        draggedIndex = index;
        const emptyImage = document.createElement('div');
        event.dataTransfer?.setDragImage(emptyImage, 0, 0);
    }

    function handleDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        hoverIndex = index;
        const newOrder = [...packageOrder];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(index, 0, removed);
        packageOrder = newOrder;
        draggedIndex = index;
    }

    function handleDragLeave() {
        hoverIndex = null;
    }

    function handleDragEnd() {
        draggedIndex = null;
        hoverIndex = null;
        if (packages != packageOrder) {
            packages = packageOrder;
        }
    }

    function getBranchTitle(branch: string): string {
        for (let b of branchList) {
            if (b.key === branch) {
                return b.title;
            }
        }
        return branch;
    }

    function onremove(e: MouseEvent, index: number) {
        e.stopPropagation();
        e.preventDefault();
        packages.splice(index, 1);
    }

    function branchCompare(packageName: string, branchId: number): number {
        if (branchId === 0) {
            return 0;
        }
        return compare(packageName, branches[branchId - 1], branches[branchId]);
    }

    function branchColor(packageName: string, branchId: number): string {
        const cmp = branchCompare(packageName, branchId);
        if (cmp > 0) {
            return "bg-red-200 dark:bg-red-950";
        }
        if (cmp < 0) {
            return "bg-green-200 dark:bg-green-950";
        }
        return "";
    }

</script>

<div class="overflow-x-auto w-full relative flex flex-col justify-stretch overflow-y-auto">
    <table class="table-auto w-full md:rounded-xl bg-background text-foreground border-secondary">
        <thead class="relative table-fixed w-full">
        <tr>
            {#if dndSort}
                <!-- Blank header for flu column -->
                <th
                        class="px-6 py-3 bg-background z-10 text-left text-xs font-medium uppercase tracking-wider sticky top-0 "
                        scope="col"
                >
                </th>
            {/if}
            <th
                    class="px-6 py-3 bg-background z-10 text-left text-xs font-medium uppercase tracking-wider sticky top-0"
                    scope="col"
            >
                Package
            </th>
            {#each branches as branch}
                <th
                        scope="col"
                        class="px-6 py-3 bg-background z-10 text-left text-xs font-medium uppercase tracking-wider sticky top-0"
                >
                    {getBranchTitle(branch)}
                </th>
            {/each}
            <!-- Blank header for close column -->
            <th
                    class="px-6 py-3 bg-background z-10 text-left text-xs font-medium uppercase tracking-wider sticky top-0 "
                    scope="col"
            >
        </tr>
        </thead>
        <tbody class="overflow-y-auto relative table-fixed w-full">
        {#each packageOrder as pkg, index (pkg)}
            <tr
                    ondragover={(event) => handleDragOver(event, index)}
                    ondragleave={handleDragLeave}
                    ondragend={handleDragEnd}
                    class="transition-all duration-200 relative table-fixed w-full border-b {draggedIndex === index ? ' scale-[0.99] bg-secondary' : ''} {hoverIndex === index && draggedIndex !== index ? ' translate-y-1' : ''}"
            >
                {#if dndSort}
                <!-- Flu column for dragging -->
                <td class="px-2 py-4 whitespace-nowrap text-sm w-12">
                    <div
                            draggable="true"
                            ondragstart={(event) => handleDragStart(event, index)}
                            class="grip cursor-move flex items-center justify-center"
                            role="button"
                            aria-label="Drag to reorder row"
                            tabindex="0"
                    >
                        <EllipsisVertical/>
                    </div>
                </td>
                {/if}
                <td class="sticky left-0 bg-clip-content">
                    <p class="px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-200 bg-background {draggedIndex === index ? ' bg-secondary' : ''}">
                        {pkg}
                    </p>
                </td>

                {#each branches as branch, index}
                    <td class={cn("px-6 py-4 whitespace-nowrap text-sm", branchColor(pkg, index))}>
                        <div class="flex items-center space-x">
                            {#if getVersion(pkg, branch) !== null}
                                {getVersion(pkg, branch)}
                                {#if branchCompare(pkg, index) < 0}
                                    <span class="pl-1">
                                        <ArrowUp size="12"/>
                                    </span>
                                {:else if branchCompare(pkg, index) > 0}
                                    <span class="pl-1">
                                        <ArrowDown size="12"/>
                                    </span>
                                {/if}
                            {:else}
                                <Skeleton class="h-5 w-28 select-none"/>
                            {/if}
                        </div>
                    </td>
                {/each}

                <td class="px-6 py-4 whitespace-nowrap text-sm">
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <span
                        class="block max-w-min min-w-min text-nowrap cursor-pointer transition-colors p-0.5 box-border hover:bg-primary rounded-full"
                        onclick={e => onremove(e, index)}
                        tabindex="-1"
                        role="button"
                        aria-label={`Remove ${pkg}`}
                >
                    <X size="12"/>
                </span>
                </td>
            </tr>
        {/each}
        </tbody>
    </table>
</div>
