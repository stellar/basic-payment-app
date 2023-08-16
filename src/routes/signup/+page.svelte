<!--
@component

The `/signup` page presents the user with a randomly generated keypair, and
prompts them to input a pincode. The user can choose to generate a different
keypair if they want. They are then asked to confirm the pincode in our modal
popup. This pincode is used to encrypt the keypair before it is stored in the
browser's `localStorage`. In this example application, everything lives entirely
client-side. So, we don't have to take extra precautions to ensure the secret
key doesn't hit any "backend." In a real-world implementation, you would want to
be absolutely certain the secret key **does not** leave the browser under any
circumstance.
-->

<script>
    /**
     * @description
     */

    // We import things from external packages that will be needed
    import { Keypair } from 'stellar-sdk'

    // We import any Svelte components we will need
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'

    // We import any stores we will need to read and/or write
    import { goto } from '$app/navigation'
    import { walletStore } from '$lib/stores/walletStore'
    import { fundWithFriendbot } from '$lib/stellar/horizonQueries'

    // The `open` Svelte context is used to open the confirmation modal
    import { getContext } from 'svelte'
    const { open } = getContext('simple-modal')

    // Define some component variables that will be used throughout the page
    let keypair = Keypair.random()
    $: publicKey = keypair.publicKey()
    $: secretKey = keypair.secret()
    let showSecret = false
    let pincode = ''

    /**
     * Takes an action after the pincode has been confirmed by the user.
     * @async
     * @function onConfirm
     * @param {string} pincode Pincode that was confirmed by the modal window
     */
    const onConfirm = async (pincode) => {
        // Register the encryped keypair in the user's browser
        await walletStore.register({
            publicKey: publicKey,
            secretKey: secretKey,
            pincode: pincode,
        })
        // Fund the account with a request to Friendbot
        await fundWithFriendbot(publicKey)
        // If the registration was successful, redirect to the dashboard
        if ($walletStore.publicKey) {
            goto('/dashboard')
        }
    }

    /**
     * Registers the user's wallet after they have confirmed the pincode in the modal window.
     * @function signup
     */
    const signup = () => {
        open(ConfirmationModal, {
            firstPincode: pincode,
            title: 'Confirm Pincode',
            body: 'Please re-type your 6-digit pincode to encrypt the secret key.',
            rejectButton: 'Cancel',
            onConfirm: onConfirm,
        })
    }
</script>

<div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col gap-7 lg:flex-row-reverse">
        <div class="text-center lg:text-left">
            <h1 class="text-5xl font-bold">Signup now!</h1>
            <p class="py-6">
                Please provide a 6-digit pincode to sign up. This pincode will be used to encrypt
                the secret key for your Stellar address, before it is stored in your browser's local
                storage. Your secret key to this address will be stored on your device. You will be
                the only one to ever have custody over this key.
            </p>
        </div>
        <div class="flex-col">
            <div class="card w-full max-w-sm flex-shrink-0 bg-base-100 shadow-2xl">
                <div class="card-body">
                    <form on:submit|preventDefault={signup}>
                        <div class="form-control my-1">
                            <label for="publicKey" class="label">
                                <span class="label-text">Public Key</span>
                            </label>
                            <div class="input-bordered input flex">
                                <TruncatedKey keyText={publicKey} />
                            </div>
                            <label for="publicKey" class="label">
                                <button
                                    on:click={() => (keypair = Keypair.random())}
                                    class="link-hover label-text-alt link"
                                >
                                    Generate new address?
                                </button>
                            </label>
                        </div>
                        <div class="form-control">
                            <label class="label cursor-pointer pb-0">
                                <span class="label-text">Show secret key?</span>
                                <input
                                    id="showSecret"
                                    name="showSecret"
                                    type="checkbox"
                                    class="toggle-accent toggle"
                                    bind:checked={showSecret}
                                />
                            </label>
                        </div>
                        {#if showSecret}
                            <div class="form-control mb-1">
                                <label for="secretKey" class="label">
                                    <span class="label-text">Secret Key</span>
                                </label>
                                <div class="input-bordered input flex">
                                    <TruncatedKey keyText={secretKey} />
                                </div>
                            </div>
                        {/if}
                        <div class="form-control my-1">
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
                            <button type="submit" class="btn-primary btn">Signup</button>
                        </div>
                        <div class="form-control my-1">
                            <div class="label">
                                <a class="link-hover label-text-alt link" href="/login">
                                    Existing users, login here.
                                </a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
