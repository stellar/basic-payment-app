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

<fieldset class="my-1 fieldset">
    <label class="label" for={`transfer-field-${field}`}>
        {field}
        {#if fieldInfo.optional}(optional){/if}
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
        <p class="label">{fieldInfo.description}</p>
    {/if}
</fieldset>
