<!--
@component

The `/login` page offers the user a chance login and confirm the pincode they
used when registering for the app.

_Note:_ In this example application, our login process is not **nearly** as
robust as one would expect or desire from a real-world application. While there
are ways one could get around the login page, if they really wanted to, the
pincode is still required before the keypair can be decrypted to sign anything
for submission to the network.
-->

<script>
    // The `export let data` declaration allows us to receive and use the page
    // load data from our `+page.js` file.
    /** @type {import('./$types').PageData} */
    export let data

    // We import any Svelte components we will need
    import ErrorAlert from '$lib/components/ErrorAlert.svelte'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'

    // We import any stores we will need to read and/or write
    import { goto } from '$app/navigation'
    import { errorMessage } from '$lib/stores/alertsStore'
    import { walletStore } from '$lib/stores/walletStore'

    // Define some component variables that will be used throughout the page
    let pincode = ''

    /**
     * Our `login` function ensures the the user has entered a valid pincode for the encrypted keypair, and then redirects them to the dashboard page.
     * @async
     * @function login
     */
    const login = async () => {
        try {
            await walletStore.confirmPincode({ pincode: pincode })
            goto('/dashboard')
        } catch (err) {
            // Notify the user about the error that has taken place.
            // @ts-ignore
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
                <ErrorAlert dismissible={false} />
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
                            id="pincode"
                            name="pincode"
                            type="password"
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
