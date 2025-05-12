<script lang="ts">
    import {Button, buttonVariants} from "$lib/components/ui/button";
    import {Label} from "$lib/components/ui/label";
    import {Input} from "$lib/components/ui/input";
    import Plus from "@lucide/svelte/icons/plus";
    import {cn} from "$lib/utils";
    import * as Dialog from "$lib/components/ui/dialog";
    import HolderPromptInput from "./HolderPromptInput.svelte";

    let open = $state(false);
</script>

<Dialog.Root bind:open={open}>
    <Dialog.Trigger class={buttonVariants({variant:"secondary", color:"green", size:"icon"})}>
        <Plus/>
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Add Profile</Dialog.Title>
        </Dialog.Header>
        <Label for="name">Profile Name</Label>
        <HolderPromptInput type="text" id="name" prompts={["default", "ADMX", "DC", "Group Policies"]}/>
        <Dialog.Footer>
            <Button onclick={() => open = false}>Add</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
