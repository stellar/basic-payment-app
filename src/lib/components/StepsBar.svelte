<script>
    /**
     * The `StepsBar.svelte` component abstracts much of the logic and
     * presentation behind implementing a "progress bar" that also displays
     * different steps the user must go through. At the time of writing, this is
     * only used in the SEP-6 transfer modal
     * (`/src/routes/dashboard/transfers/components/TransferModalSep6.svelte`),
     * and gives users and indication of what steps remain as they initiate a
     * SEP-6 transfer.
     *
     * This component borrows a lot from techniques used in this svelte example:
     * https://svelte.dev/repl/7b05d57dcdc04f49be72844e4b2825b3?version=3.44.0
     */

    export let steps = []
    export let currentActive = 1

    let stepMarkers

    export const handleStep = (stepIncrement) => {
        stepMarkers = document.querySelectorAll('.step')
        if (stepIncrement == 1) {
            currentActive++

            if (currentActive > steps.length) {
                currentActive = steps.length
            }
        } else {
            currentActive--

            if (currentActive < 1) {
                currentActive = 1
            }
        }

        update()
    }

    const update = () => {
        stepMarkers.forEach((step, i) => {
            if (i < currentActive) {
                step.classList.add('step-primary')
            } else {
                step.classList.remove('step-primary')
            }
        })
    }
</script>

<div class="not-prose">
    <ul class="steps w-full" bind:this={stepMarkers}>
        {#each steps as step, i}
            {@const stepClasses = `step ${i === 0 ? 'step-primary' : ''}`}
            <li class={stepClasses}>{step}</li>
        {/each}
    </ul>
</div>
