<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/signup/+page.svelte data', data)

    import { Keypair } from 'stellar-sdk'
    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import { getContext } from 'svelte'
    import { walletStore } from '$lib/stores/walletStore'
    import { fundWithFriendbot } from '$lib/stellar/horizonQueries'
    const { open } = getContext('simple-modal')
    let pincodeConfirmed

    let keypair = Keypair.random()
    let publicKey = ''
    let secretKey = ''
    let showSecret = true
    let pincode = ''

    $: if (browser) {
        publicKey = keypair.publicKey()
        secretKey = keypair.secret()
    }

    const onConfirm = async () => {
        console.log('pincode confirmed, and `onConfirm` has been fired!')
        await walletStore.register({
            publicKey: publicKey,
            secretKey: secretKey,
            pincode: pincode,
        })
        await fundWithFriendbot(publicKey)
        if ($walletStore.publicKey) {
            goto('/dashboard')
        }
    }

    const onReject = () => {
        console.log('pincode rejected, and `onReject` has been fired!!!')
    }

    const signup = () => {
        open(ConfirmationModal, {
            firstPincode: pincode,
            title: 'Confirm Pincode',
            body: 'Please re-type your 6-digit pincode to encrypt the secret key.',
            rejectButton: 'Cancel',
            onConfirm: onConfirm,
            onReject: onReject
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
                                type="password"
                                id="pincode"
                                class="input-bordered input"
                                minlength="6"
                                maxlength="6"
                                required
                                bind:value={pincode}
                            />
                        </div>
                        <div class="form-control my-1">
                            <button type="submit" class="btn-primary btn">Signup</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
