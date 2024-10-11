<script lang="ts">
  import { onMount } from 'svelte';
  import { walletStore } from '../stores/walletStore';
  import { showNotification } from '../stores/notificationStore';
  import { onboard } from '../blockchainProvider';

  let isWalletConnected = false;
  let accountAddress = '';

  $: {
    isWalletConnected = $walletStore.isConnected;
    accountAddress = $walletStore.address || '';
  }

  async function connectWallet() {
    try {
      await walletStore.connect();
      if (isWalletConnected) {
        await switchToPolygonNetwork();
        showNotification(`Connected: ${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`);
      }
    } catch (err) {
      console.error("Error connecting to wallet:", err);
      showNotification("Failed to connect wallet. Please try again.");
    }
  }

  async function switchToPolygonNetwork() {
    try {
      await onboard.setChain({ chainId: '0x89' });
    } catch (switchError) {
      console.error("Error switching to Polygon:", switchError);
      showNotification("Failed to switch to Polygon network. Please switch manually.");
    }
  }

  onMount(() => {
    const unsubscribe = walletStore.subscribe(state => {
      if (state.isConnected && state.chainId !== '0x89') {
        switchToPolygonNetwork();
      }
    });

    return () => {
      unsubscribe();
    };
  });
</script>

<div id="wallet-connection">
  <button id="connect-wallet" on:click={connectWallet}>
    {#if isWalletConnected}
      <span id="address-text">{accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}</span>
    {:else}
      <span id="connect-text">Connect Wallet</span>
    {/if}
  </button>
</div>

  
  <style>
    #wallet-connection {
      margin-bottom: 15px;
    }
  
    #connect-wallet {
      width: 100%;
      padding: 10px;
      background-color: #535;
      color: #e0e0e0;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 1em;
    }
  
    #connect-wallet:hover {
      background-color: #747;
      transform: translateY(-2px);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
  
    #address-text, #connect-text {
      display: inline-block;
      width: 100%;
      text-align: center;
    }
  
    @media screen and (max-width: 520px) {
      #connect-wallet {
        font-size: 0.9em;
        padding: 8px;
      }
    }
  </style>
  