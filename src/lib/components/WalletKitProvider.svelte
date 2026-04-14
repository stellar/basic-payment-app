<!-- src/lib/components/WalletComponent.svelte -->
<script>
    import { goto } from '$app/navigation'
    import { walletStore } from '$lib/stores/walletStore'
    // @ts-ignore
    import {
        StellarWalletsKit,
        WalletNetwork,
        allowAllModules,
        XBULL_ID,
    } from '@creit.tech/stellar-wallets-kit'

    /**
     * @typedef {Object} Props
     * @property {string} [buttonText]
     */

    /** @type {Props} */
    let { buttonText = 'Connect Wallet' } = $props()
    const kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        selectedWalletId: XBULL_ID,
        modules: allowAllModules(),
    })

    const connectWallet = async () => {
        try {
            await kit.openModal({
                // @ts-ignore
                onWalletSelected: async (option) => {
                    kit.setWallet(option.id)
                    const { address } = await kit.getAddress()

                    if (address) {
                        await walletStore.connectWallet({ publicKey: address })
                        goto('/dashboard')
                    }
                },
            })
        } catch (error) {
            console.error('Error connecting wallet:', error)
        }
    }

    export { connectWallet }
</script>

<!-- You can provide a button or any UI elements if needed -->
<button type="button" class="btn btn-secondary" onclick={connectWallet}>
    {buttonText}
</button>
