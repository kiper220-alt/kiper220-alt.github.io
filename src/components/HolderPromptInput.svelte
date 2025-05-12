<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { onMount } from "svelte";
    import { cn } from "$lib/utils.js";

    let displayedText = $state("");
    let open = $state(false);
    let previous_index = -1;

    let {
        ref = $bindable(null),
        type_speed = $bindable(40),
        word_speed = $bindable(5000),
        prompts = ["default"],
        value = $bindable(""),
        class: className = "",
        ...restProps
    } = $props();

    let _prompts = $derived(
        !prompts || prompts.length === undefined || prompts.length === 0
            ? ["default"]
            : prompts,
    );

    function getRandomPlaceholder(): string {
        let index = Math.floor(Math.random() * _prompts.length);
        if (index == previous_index) {
            index += 1;
            if (index == _prompts.length) {
                index = 0;
            }
        }
        previous_index = index;
        return _prompts[index];
    }

    async function typeEffect(text: string) {
        while (displayedText.length > 0) {
            displayedText = displayedText.slice(0, -1);
            await new Promise((resolve) => setTimeout(resolve, type_speed));
        }

        for (const char of text) {
            displayedText += char;
            await new Promise((resolve) => setTimeout(resolve, type_speed));
        }
    }

    function updatePlaceholder() {
        const newPlaceholder = getRandomPlaceholder();
        typeEffect(newPlaceholder);
    }

    onMount(() => {
        updatePlaceholder();
        const interval = setInterval(updatePlaceholder, word_speed);
        return () => clearInterval(interval);
    });
</script>

<Input
    {...restProps}
    bind:this={ref}
    bind:value
    class={className}
    placeholder={displayedText}
    type="search"
/>
