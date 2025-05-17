<script lang="ts">
    import {EllipsisVertical} from '@lucide/svelte';

    interface Props {
        branches: string[];
        packages: string[];
        data: Record<string, Record<string, string>>;
    }

    let {branches, packages = $bindable([]), data} = $props<Props>();

    let packageOrder = $state([...packages]);

    let draggedIndex: number | null = $state(null);

    let hoverIndex: number | null = $state(null);

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
                        {data[pkg][branch] || "-"}
                    </td>
                {/each}
            </tr>
        {/each}
        </tbody>
    </table>
</div>
