<script lang="ts">
    import type { Sep6Field } from '$lib/stellar/sep6'

    interface Props {
        field?: string
        fieldInfo?: Sep6Field
        value?: string
    }

    let {
        field = '',
        fieldInfo = {
            optional: false,
            choices: [],
            description: '',
        },
        value = $bindable(''),
    }: Props = $props()
</script>

<div class="form-control my-1">
    <label class="label" for={`transfer-field-${field}`}>
        <span class="label-text">{field}</span>
        {#if fieldInfo.optional}
            <span class="label-text-alt">Optional</span>
        {/if}
    </label>
    {#if 'choices' in fieldInfo}
        <select
            class="select"
            name={`transfer-field-${field}`}
            id={`transfer-field-${field}`}
            bind:value={value}
        >
            <option value="" disabled selected>Select one</option>
            {#each fieldInfo.choices as choice (choice)}
                <option>{choice}</option>
            {/each}
        </select>
    {:else}
        <input
            type="text"
            class="input"
            name={`transfer-field-${field}`}
            id={`transfer-field-${field}`}
            bind:value={value}
        />
    {/if}
    {#if fieldInfo.description}
        <label class="label" for={`transfer-field-${field}`}>
            <span class="label-text-alt">{fieldInfo.description}</span>
        </label>
    {/if}
</div>
