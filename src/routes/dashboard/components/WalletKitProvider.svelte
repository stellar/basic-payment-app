<script lang="ts">
    import { onMount } from 'svelte';
    import { StellarWalletsKit, WalletNetwork } from '@creit.tech/stellar-wallets-kit';
  
    let walletsKit;
  
    onMount(() => {
      walletsKit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        selectedWallet: 'freighter'
      });
    });
  </script>


<slot>{walletsKit}</slot>