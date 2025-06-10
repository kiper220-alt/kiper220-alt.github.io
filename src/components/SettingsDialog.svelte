<script lang="ts">
    import {buttonVariants} from "$lib/components/ui/button";
    import {Download, Settings, Upload} from "@lucide/svelte/icons";
    import * as Dialog from "$lib/components/ui/dialog";
    import {Label} from "$lib/components/ui/label";
    import {Separator} from "$lib/components/ui/separator";
    import {ScrollArea} from "$lib/components/ui/scroll-area";
    import FieldSwitch from "./FieldSwitch.svelte";

    import {cn} from "$lib/utils";
    import ThemeButton from "./ThemeButton.svelte";
    import {branchList, type BranchSettings, defaultBranchSettings, loadFrom, saveAs} from "./settings";
    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";

    interface Props {
        branches: BranchSettings;
        dndSort: boolean;
    }

    let InputElement: HTMLInputElement;

    let {
        branches = $bindable({branches: defaultBranchSettings}),
        dndSort = $bindable(true),
    }: Props = $props();

    function onClickLoad() {
        InputElement.click();
    }

</script>

<Dialog.Root>
    <Dialog.Trigger
            aria-label="Open settings dialog"
            class={cn(buttonVariants({ variant: "outline" }), "p-2")}
    >
        <Settings class="h-5 w-5"/>
    </Dialog.Trigger>

    <Dialog.Content
            aria-describedby="settings-description"
            class="max-h-[90vh] flex flex-col overflow-hidden"
    >
        <Dialog.Header>
            <Dialog.Title>
                <ThemeButton class="mr-5"/>
                Settings
            </Dialog.Title>
            <Dialog.Description class="sr-only" id="settings-description">
                Configure visual and branch settings
            </Dialog.Description>
        </Dialog.Header>

        <ScrollArea class="flex-1 overflow-y-auto">
            <section class="p-4 space-y-2">
                <Label class="text-base font-semibold">Visual</Label>
                <FieldSwitch
                        bind:checked={dndSort}
                        description="Enables drag-and-drop table item sorting."
                        title="Table DnD sort"
                />
            </section>

            <Separator class="my-4"/>

            <section class="p-4 space-y-4">
                <Label class="text-base font-semibold">Branches</Label>
                <div class="grid grid-cols-2 gap-2">
                    {#each branchList as {key, title}}
                        <FieldSwitch
                                title={title}
                                bind:checked={branches.branches[key].checked}
                                disabled={branches.branches[key].disabled ?? false}
                        />
                    {/each}
                </div>
            </section>
            <section class="p-4 space-y-4">
                <Label class="text-base font-semibold">Configuration:</Label>
                <div class="grid grid-cols-2 gap-2">
                    <input class="hidden" type="file" accept=".json" bind:this={InputElement} onchange={a => loadFrom(a)}/>
                    <Button variant="outline" onclick={onClickLoad}>Load <Upload size="12"/></Button>
                    <Button variant="outline" onclick={() => saveAs("configuration.json")}>Save <Download size="12"/></Button>
                </div>
            </section>
        </ScrollArea>
    </Dialog.Content>
</Dialog.Root>
