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
    import {type DefaultsConfiguration, fetchDefaultConfigration} from "./settings";
    import {Skeleton} from "$lib/components/ui/skeleton";

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
    let defaultsConf: DefaultsConfiguration | undefined = $state(undefined);
    let defaultsPicked: boolean[] = $state([]);

    $effect(() => {
        if (open) {
            for (let i in defaultsPicked) {
                defaultsPicked[i] = false;
            }
            name = "";
        }
    });

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

    function load_configuration() {
        if (defaultsConf === undefined) {
            let tmp = fetchDefaultConfigration();
            tmp.then(a => {
                for (let i = defaultsPicked.length; i < a.groups.length; i++) {
                    defaultsPicked.push(false);
                }
                defaultsConf = a;
            });
        }
    }

    function onclick() {
        if (!onadd) {
            open = false;
            return;
        }
        let packages: string[] = [];
        if (defaultsConf) {
            for (let i in defaultsPicked) {
                if (defaultsPicked[i]) {
                    packages = [...packages, ...defaultsConf.groups[i].packages];
                }
            }
        }
        onadd(name.trim(), [...new Set(packages)]);
        open = false;
        return;
    }

</script>

<Dialog.Root bind:open={open}>
    <Dialog.Trigger {...restProps} class={cn(buttonVariants({variant: variant, size:"icon"}), className)}
                    onclick={load_configuration}>
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
            <div class="w-full space-y-4">
                <div class="grid grid-cols-2 items-center gap-2">
                    {#if defaultsConf === undefined}
                        <Skeleton class="h-6 py-2 px-8"/>
                        <Skeleton class="h-6 py-2 px-8"/>
                        <Skeleton class="h-6 py-2 px-8"/>
                        <Skeleton class="h-6 py-2 px-8"/>
                    {:else}
                        {#each defaultsConf.groups as group, i (group.name)}
                            <FieldSwitch
                                    id="groups-{group.name}"
                                    class="px-4 py-2"
                                    title="{group.name}"
                                    bind:checked={defaultsPicked[i]}
                                    onclick={a => changeName(i)}
                            />
                        {/each}
                    {/if}
                </div>
                <div class="w-full">
                    <Button class="float-end" disabled={disabled} onclick={onclick}>Add</Button>
                </div>
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
