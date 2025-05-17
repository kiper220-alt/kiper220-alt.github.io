<script lang="ts">
    import {Label} from "$lib/components/ui/label";
    import {Switch} from "$lib/components/ui/switch";
    import {cn} from "$lib/utils";
    import {nanoid} from "nanoid";

    interface Props {
        ref?: HTMLInputElement | null;
        checked?: boolean;
        title?: string;
        description?: string;
        disabled?: boolean;
        id?: string | null;
        class?: string;
        onclick?: (event: MouseEvent) => void;

        [key: string]: any;
    }

    let {
        ref = $bindable(null),
        checked = $bindable(false),
        title = '',
        description = '',
        disabled = false,
        id = null,
        class: className = '',
        onclick = undefined,
        ...restProps
    }: Props = $props();

    function clickEvent(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) {
            checked = !checked;
        }
        if (onclick) {
            onclick(event);
        }
    }

</script>

<button
        class={cn(
        "space-y-1 flex flex-row items-center w-full justify-between transition-colors rounded-lg border p-4",
        disabled ? "cursor-not-allowed" : "",
        checked ? "bg-secondary" : "",
        className
    )}
        id={id}
        onclick={clickEvent}
>
    {#if title || description}
        <div class="space-y-0.5 text-left">
            {#if title}
                <Label
                        class="text-sm font-medium pointer-events-none"
                >
                    {title}
                </Label>
            {/if}
            {#if description}
                <div class="text-muted-foreground text-[0.8rem]">
                    {description}
                </div>
            {/if}
        </div>
    {/if}

    <Switch
            {...restProps}
            bind:checked
            bind:ref
            class="col-span-3 ml-1"
            disabled={disabled}
            onclick={clickEvent}
            tabindex="-1"
    />
</button>