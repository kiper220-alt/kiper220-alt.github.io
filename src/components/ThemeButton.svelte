<script lang="ts">
    import Sun from "@lucide/svelte/icons/sun";
    import Moon from "@lucide/svelte/icons/moon";

    import {resetMode, setMode} from "mode-watcher";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import {buttonVariants} from "$lib/components/ui/button/index.js";
    import {cn} from "$lib/utils";

    // Интерфейс пропсов
    interface Props {
        ref?: HTMLInputElement | null;
        class?: string;

        [key: string]: any;
    }

    // Инициализация пропсов
    let {
        ref = $bindable(null),
        class: className = '',
        ...restProps
    }: Props = $props();
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger
            class={cn(buttonVariants({ variant: "outline", size: "icon" }), className)}
    >
        <Sun
                class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Moon
                class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
        <span class="sr-only">Toggle theme</span>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="center">
        <DropdownMenu.Item onclick={() => resetMode()}>System</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => setMode("dark")}>Dark</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => setMode("light")}>Light</DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>