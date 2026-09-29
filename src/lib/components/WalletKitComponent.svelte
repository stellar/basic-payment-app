<!-- src/lib/components/WalletKitComponent.svelte -->
<script lang="ts">
    import { resolve } from '$app/paths'
    import { goto } from '$app/navigation'
    import { wallet } from '$lib/state/Wallet.svelte'
    // The kit itself is initialized once, in `src/routes/+layout.svelte`
    import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'

    interface Props {
        buttonText?: string
    }

    let { buttonText = 'Connect Wallet' }: Props = $props()

    async function connectWallet() {
        try {
            const { address } = await StellarWalletsKit.authModal()
            wallet.connectWallet({ publicKey: address })
            goto(resolve('/dashboard'))
        } catch (error) {
            console.error('Error connecting wallet:', error)
        }
    }
</script>

<!-- You can provide a button or any UI elements if needed -->
<button type="button" class="btn btn-secondary" onclick={connectWallet}>
    {buttonText}
</button>
