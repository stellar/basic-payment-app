<script>
    /**
     * @typedef {Object} Props
     * @property {string} [field]
     * @property {any} [fieldInfo]
     * @property {string} [value]
     */

    /** @type {Props} */
    let {
        field = '',
        fieldInfo = {
            optional: false,
            choices: [],
            description: '',
        },
        value = $bindable(''),
    } = $props()
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
            class="select select-bordered"
            name={`transfer-field-${field}`}
            id={`transfer-field-${field}`}
            bind:value={value}
        >
            <option value="" disabled selected>Select one</option>
            {#each fieldInfo.choices as choice}
                <option>{choice}</option>
            {/each}
        </select>
    {:else}
        <input
            type="text"
            class="input input-bordered"
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
