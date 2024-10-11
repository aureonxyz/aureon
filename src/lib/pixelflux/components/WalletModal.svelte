<!-- src/lib/pixelflux/components/WalletModal.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { walletModalStore, hideWalletModal } from '../stores/walletModalStore';
  import { walletStore } from '../stores/walletStore';
  import { showNotification } from '../stores/notificationStore';

  let show: boolean;
  let message: string;
  let isConnecting: boolean = false;

  $: walletModalStore.subscribe(value => {
    show = value.show;
    message = value.message;
  });

  async function connectWallet() {
    isConnecting = true;
    try {
      await walletStore.connect();
      hideWalletModal();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showNotification('Failed to connect wallet. Please try again.');
    } finally {
      isConnecting = false;
    }
  }

  onMount(() => {
    const unsubscribe = walletStore.subscribe(state => {
      if (state.isConnected && state.chainId !== '0x89') {
        walletStore.switchToPolygon();
      }
    });

    return () => {
      unsubscribe();
    };
  });
</script>

{#if show}
  <div class="wallet-modal-overlay">
    <div class="wallet-modal">
      <h2>Connect to a Wallet</h2>
      <p>{message}</p>
      <button on:click={connectWallet} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      <button on:click={hideWalletModal}>Close</button>
    </div>
  </div>
{/if}


<style>
  .wallet-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .wallet-modal {
    background-color: #2c2c2c;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    width: 90%;
  }

  h2 {
    margin-top: 0;
    color: #e0e0e0;
  }

  p {
    color: #a0a0a0;
    margin-bottom: 1.5rem;
  }

  button {
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    background-color: #535;
    color: #e0e0e0;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
  }

  button:hover {
    background-color: #747;
    transform: translateY(-2px);
  }

  button:disabled {
    background-color: #444;
    cursor: not-allowed;
    transform: none;
  }
</style>