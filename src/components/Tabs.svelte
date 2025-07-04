<script lang="ts">
    import X from "@lucide/svelte/icons/x";
    import AddButton from "$components/AddButton.svelte";
    import { cn } from "$lib/utils";
    import type { KeyboardEventHandler } from "svelte/elements";

    interface Props {
        tabs: string[],
        activeTab: number,
        onadd?: (tab: string, packages: string[]) => void,
        onremove?: (index: number, tab: string) => void,
        onrerange?: (old_position: number, new_position: number) => void,
        class: string
    }

    let {
        tabs = [],
        activeTab = $bindable(0),
        onadd: onAdd = undefined,
        onremove: onRemove = undefined,
        onrerange: onRerange = undefined,
        class: className = '',
    }: Props = $props();

    let draggedIndex: number | null = $state(null);
    let hoverIndex: number | null = $state(null);

    function onadd(name: string, packages: string[]) {
        tabs = [...tabs, name];
        activeTab = tabs.length - 1;
        if (onAdd) {
            onAdd(name, packages);
        }
    }

    function onremove(e: MouseEvent, index: number) {
        e.stopPropagation();
        e.preventDefault();
        if (onRemove) {
            onRemove(index, tabs[index]);
        }
    }

    function handleDragStart(event: DragEvent, index: number) {
        activeTab = index;
        draggedIndex = index;
        const emptyImage = document.createElement('div');
        event.dataTransfer?.setDragImage(emptyImage, 0, 0);
    }

    function handleDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        hoverIndex = index;
        const newOrder = [...tabs];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(index, 0, removed);
        tabs = newOrder;

        if (onRerange) {
            onRerange(draggedIndex, index);
        }

        draggedIndex = index;
        activeTab = index;
    }

    function handleDragLeave() {
        hoverIndex = null;
    }

    function handleDragEnd() {
        draggedIndex = null;
        hoverIndex = null;
    }

    function onKeyDown(e: KeyboardEvent & { currentTarget: EventTarget & Window; }) {
        if ((e.altKey || e.ctrlKey) && e.code.slice(0, 5) === "Digit") {
            let index = parseInt(e.code.slice(5)) - 1;
            if (index < 0) index = 10;

            if (index >= 0 && index < tabs.length) {
                activeTab = index;
            }
        }
	}
</script>

<div class={cn("flex flex-row max-h-max items-center overflow-y-auto overflow-x-auto grow shrink no-scrollbar", className)}>
    {#each tabs as tab, i (tab)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
                draggable="true"
                ondragover={(e) => handleDragOver(e, i)}
                ondragleave={handleDragLeave}
                ondragend={handleDragEnd}
                ondragstart={(e) => handleDragStart(e, i)}
                class="flex flex-row items-center min-w-min overflow-hidden overflow-x-auto px-2 py-2 border-r cursor-pointer transition-colors {activeTab === i ? 'bg-accent' : 'hover:bg-secondary'}"
                role="button"
                onclick={(e) => {e.stopPropagation(); e.preventDefault(); activeTab = i;}}
                tabindex="0"
                aria-pressed={activeTab === i}
                aria-label={`Select tab ${tab}`}
        >
            <span class="text-nowrap select-none w-24 overflow-hidden text-ellipsis">
                {tab}
            </span>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <span
                    class="ml-3 text-nowrap cursor-pointer transition-colors hover:bg-primary p-0.5 rounded-full"
                    onclick={e => onremove(e, i)}
                    tabindex="-1"
                    role="button"
                    aria-label={`Close tab ${tab}`}
            >
                <X size="12"/>
            </span>
        </div>
    {/each}
    <AddButton
            class="sticky right-0 m-2 min-h-7 min-w-7 h-7 w-7"
            ignore={tabs}
            onadd={onadd}
            tabindex="-1"
            variant="default"
    />
</div>
<svelte:window on:keydown={onKeyDown}/>