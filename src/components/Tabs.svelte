<script lang="ts">
    import X from "@lucide/svelte/icons/x";
    import AddButton from "$components/AddButton.svelte";
    import { cn } from "$lib/utils";

    interface Props {
        tabs: string[],
        activeTab: number,
        onadd?: (tab: string, packages: string[]) => void,
        onremove?: (index: number, tab: string) => void,
        class: string
    }

    let {
        tabs = [],
        activeTab = $bindable(0),
        onadd: onAdd = undefined,
        onremove: onRemove = undefined,
        class: className = '',
    }: Props = $props();

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

</script>

<div class={cn("flex flex-row max-h-max items-center overflow-y-auto w-full border-b overflow-x-auto", className)}>
    {#each tabs as tab, i (tab)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <span
                class="flex flex-row items-center min-w-min overflow-hidden overflow-x-auto px-2 py-2 border-r cursor-pointer transition-colors {activeTab === i ? 'bg-accent' : 'hover:bg-secondary'}"
                role="button"
                onclick={(e) => {e.stopPropagation(); e.preventDefault(); activeTab = i;}}
                tabindex="0"
                aria-pressed={activeTab === i}
                aria-label={`Select tab ${tab}`}
        >
            <span class="text-nowrap select-none">{tab}</span>
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
        </span>
    {/each}
    <AddButton
            class="sticky right-0 m-2 min-h-7 min-w-7 h-7 w-7"
            ignore={tabs}
            onadd={onadd}
            tabindex="-1"
            variant="default"
    />
</div>
