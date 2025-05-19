<script lang="ts" module>
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

    function getVersion(packageName: string, branch: string): string {
        let packageBranches = data.get(packageName);
        if (!packageBranches) {
            return "-";
        }
        let version = packageBranches.get(branch);
        return version ? version : "-";
    }

    async function fetchPackages(packages: string[], branches: string[]): Promise<boolean> {
        try {
            let models: Map<string, rdb.SiteSourcePackagesVersionsModel>;
            let findPackageSetResponse = await packageApiInstance.getRouteFindPackagesetPackageFindPackageset({packages: packages, branches: branches});

            if (findPackageSetResponse.packages === undefined) {
                return false;
            }
            let tmp = data;
            for (let a of packages) {
                tmp.set(a, new Map<string, string>(findPackageSetResponse.packages?.filter(b => a === b).map(b => {
                    if (b.branch === undefined) {
                        throw new Error("Error while fetching!");
                    }
                    let version = b.version ? b.version : "";
                    let release = b.release ? b.release : "";

                    if ((b.version === undefined) === (b.release == undefined)) {
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
    import {EllipsisVertical} from '@lucide/svelte';
    import { defaultSettings } from './settings';
    import { packageApiInstance } from "./api";

    interface Props {
        branches: string[];
        packages: string[];
    }

    let {branches, packages = $bindable([])}: Props = $props();

    let packageOrder = $state([...packages]);

    let draggedIndex: number | null = $state(null);

    let hoverIndex: number | null = $state(null);

    $effect(() => {
        // TODO: add error handling.
        addPackages(packages);
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
            console.log("replace");
            packages = packageOrder;
        }
    }
</script>

<div class="overflow-x-auto w-full relative flex flex-col justify-stretch overflow-y-auto">
    <table class="table-auto w-full md:rounded-xl bg-background text-foreground border-secondary">
        <thead class="relative table-fixed w-full">
        <tr>
            <!-- Blank header for flu column -->
            <th
                    class="px-6 py-3 bg-background z-10 text-left text-xs font-medium uppercase tracking-wider sticky top-0 "
                    scope="col"
            >
            </th>
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
                    {branch}
                </th>
            {/each}
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
                <td class="sticky left-0 bg-clip-content">
                    <p class="px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-200 bg-background {draggedIndex === index ? ' bg-secondary' : ''}">
                        {pkg}
                    </p>
                </td>
                {#each branches as branch}
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        {getVersion(pkg, branch)}
                    </td>
                {/each}
            </tr>
        {/each}
        </tbody>
    </table>
</div>
