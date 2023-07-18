<script>
    import { goto } from '$app/navigation'
    import ErrorAlert from '$lib/components/ErrorAlert.svelte'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'
    import { errorMessage } from '$lib/stores/alertsStore'
    import { confirmCorrectPincode } from '$lib/stores/walletStore'

    /** @type {import('./$types').PageData} */
    export let data

    let pincode = ''

    const login = async () => {
        try {
            await confirmCorrectPincode({ pincode: pincode })
            goto('/dashboard')
        } catch (err) {
            errorMessage.set(err.body.message)
        }
    }
</script>

<div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col gap-7 lg:flex-row-reverse">
        <div class="text-center lg:text-left">
            <h1 class="text-5xl font-bold">Login now!</h1>
            <p class="py-6">
                Provide your 6-digit pincode to access the dashboard. To reiterate, this pincode
                never leaves your device, and your secret key is encrypted in your browser and is
                never shared anywhere else.
            </p>
        </div>
        <div class="card w-full max-w-sm flex-shrink-0 bg-base-100 shadow-2xl">
            <div class="card-body">
                <ErrorAlert dismissable={false} />
                <form on:submit|preventDefault={login}>
                    <div class="form-control">
                        <label class="label" for="publicKey">
                            <span class="label-text">Public Key</span>
                        </label>
                        <div class="input-bordered input flex">
                            <TruncatedKey keyText={data.publicKey} />
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="pincode" class="label">
                            <span class="label-text">Pincode</span>
                        </label>
                        <input
                            type="password"
                            id="pincode"
                            class="input-bordered input"
                            minlength="6"
                            maxlength="6"
                            required
                            bind:value={pincode}
                        />
                    </div>
                    <div class="form-control mt-6">
                        <button class="btn-primary btn">Login</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
