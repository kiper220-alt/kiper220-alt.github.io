<script lang="ts">
    import {slide} from "svelte/transition";
    import {Button, buttonVariants} from "$lib/components/ui/button";
    import {Label} from "$lib/components/ui/label";
    import {Input} from "$lib/components/ui/input";
    import Plus from "@lucide/svelte/icons/plus";
    import {cn} from "$lib/utils";
    import * as Dialog from "$lib/components/ui/dialog";
    import HolderPromptInput from "./HolderPromptInput.svelte";

    interface Props {
        open: boolean;
        variant: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | undefined;
        onadd?: (name: string) => void;
        ignore: string[];
        class: string;
    }

    let {
        open = $bindable(false),
        variant = "link",
        class: className = "",
        onadd = undefined,
        ignore = [],
        ...restProps
    }: Props = $props();

    let name = $state("");
    let disabled = $derived(buttonIgnore(name));
    let exist = $derived(!(!name || name === "" || name.trim().length === 0));

    function buttonIgnore(name: string): boolean {
        return ignore.findIndex(a => a == name.trim()) !== -1;
    }

    function enterEvent(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            if (!disabled && exist) {
                onclick();
            }
        }
    }

    function onclick() {
        if (onadd) {
            onadd(name.trim());
        }
        open = false;
    }

</script>

<Dialog.Root bind:open={open}>
    <Dialog.Trigger {...restProps} class={cn(buttonVariants({variant: variant, size:"icon"}), className)}>
        <Plus/>
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Add Profile</Dialog.Title>
        </Dialog.Header>
        <Label for="name">Profile Name</Label>
        <HolderPromptInput bind:value={name} id="name" onkeydown={enterEvent}
                           prompts={["default", "ADMX", "DC", "Group Policies"]}
                           type="text"/>
        <div>
            {#if disabled}
                <p class="text-red-500 text-xs" transition:slide>this name is taken</p>
            {/if}
        </div>
        <Dialog.Footer>
            {#if exist}
                <div transition:slide>
                    <Button onclick={onclick} disabled={disabled}>Add</Button>
                </div>
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
