<script lang="ts">
    import {slide} from "svelte/transition";
    import {Button, buttonVariants} from "$lib/components/ui/button";
    import {Label} from "$lib/components/ui/label";
    import {Input} from "$lib/components/ui/input";
    import Plus from "@lucide/svelte/icons/plus";
    import {cn} from "$lib/utils";
    import * as Dialog from "$lib/components/ui/dialog";
    import HolderPromptInput from "./HolderPromptInput.svelte";
    import FieldSwitch from "./FieldSwitch.svelte";
    import { fetchDefaultPackages } from "./settings";
    import type { EscapeBehaviorType } from "node_modules/bits-ui/dist/bits/utilities/escape-layer/types";

    interface Props {
        open: boolean;
        variant: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | undefined;
        onadd?: (name: string, packages: string[]) => void;
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
    let isDefaultPackages = $state(false);
    let isLoadingState = $state(false);
    let closeBehavior : EscapeBehaviorType = $derived(isLoadingState ? "ignore" : "close" );

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
        if (!onadd) {
            open = false;
            return;
        }
        if (!isDefaultPackages) {
            onadd(name.trim(), []);
            open = false;
            return;
        }
        isLoadingState = true;
        fetchDefaultPackages().then((packages) => {
            isLoadingState = false;
            onadd(name.trim(), packages);
            isDefaultPackages = false;
            open = false;
        }).catch((err) => {
            isLoadingState = false;
            isDefaultPackages = false;
            console.error(err);
        })
    }

</script>

<Dialog.Root bind:open={open}>
    <Dialog.Trigger {...restProps} class={cn(buttonVariants({variant: variant, size:"icon"}), className)}>
        <Plus/>
    </Dialog.Trigger>
    <Dialog.Content interactOutsideBehavior={closeBehavior} escapeKeydownBehavior={closeBehavior}>
        {#if !isLoadingState}
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
                <div transition:slide class="flex flex-row w-full space-x-2 items-center">
                    <FieldSwitch
                            class="px-4 py-2"
                            title="Default package list"
                            disabled={disabled}
                            bind:checked={isDefaultPackages}
                        />
                    <div>
                        <Button onclick={onclick} disabled={disabled}>Add</Button>
                    </div>
                </div>
            {/if}
        </Dialog.Footer>
        {:else}
        <Dialog.Header>
            <Dialog.Title>Loading default profile for "{name}"</Dialog.Title>
            <Label>Please wait...</Label>
        </Dialog.Header>
        {/if}
    </Dialog.Content>
</Dialog.Root>
