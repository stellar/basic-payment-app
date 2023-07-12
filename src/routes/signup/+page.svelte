<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/signup/+page.svelte data', data)

    import { Keypair } from 'stellar-sdk'
    import { browser } from '$app/environment'

    let keypair = Keypair.random()
    let publicKey = ''
    let secretKey = ''

    $: if (browser) {
        publicKey = keypair.publicKey()
        secretKey = keypair.secret()
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
                    <div class="form-control my-1">
                        <label for="publicKey" class="label">
                            <span class="label-text">Public Key</span>
                        </label>
                        <input
                            type="text"
                            placeholder="G..."
                            id="publicKey"
                            class="input-bordered input"
                            bind:value={publicKey}
                        />
                        <label for="publicKey" class="label">
                            <button
                                on:click={() => (keypair = Keypair.random())}
                                class="link-hover label-text-alt link"
                            >
                                Generate new address?
                            </button>
                        </label>
                    </div>
                    <div class="form-control my-1">
                        <label for="secretKey" class="label">
                            <span class="label-text">Secret Key</span>
                        </label>
                        <input
                            type="text"
                            placeholder="S..."
                            id="secretKey"
                            class="input-bordered input"
                            bind:value={secretKey}
                        />
                    </div>
                    <div class="form-control my-1">
                        <label for="pincode" class="label">
                            <span class="label-text">Pincode</span>
                        </label>
                        <input type="password" id="pincode" class="input-bordered input" />
                    </div>
                    <div class="form-control my-1">
                        <button class="btn-primary btn">Signup</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
