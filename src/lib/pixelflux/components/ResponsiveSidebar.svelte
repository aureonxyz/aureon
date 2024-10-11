<!-- ResponsiveSidebar.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PixelCard from './PixelCard.svelte';
  import PurchaseCard from './PurchaseCard.svelte';
  import HistoryCard from './HistoryCard.svelte';
  import { canvasStore } from '../stores/canvasStore';
  import { sidebarStore } from '../stores/sidebarStore';
  import { showWalletModal } from '../stores/walletModalStore';
  import { showNotification } from '../stores/notificationStore';
  import { walletStore } from '../stores/walletStore';

  let isMobile: boolean;

  $: showPixelDetails = !!$canvasStore.selectedSquare;
  $: ({ isConnected, address } = $walletStore);

  function checkMobile() {
    isMobile = window.innerWidth <= 768;
    if (isMobile) {
      sidebarStore.close();
    } else {
      sidebarStore.open();
    }
  }

  function connectWallet() {
      if (!isConnected) {
        showWalletModal('Please connect your wallet to continue.');
      } else {
        walletStore.disconnect();
      }
    }


  function closeSidebar() {
    $canvasStore.selectedSquare = null;
    if (!isMobile) {
      sidebarStore.close();
    }
  }

  function goHome() {
    window.location.href = '/';
  }

  function openInfoModal() {
    showNotification('Info modal opened');
    // Implement the logic to open the info modal
  }

  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
</script>

{#if isMobile}
  {#if showPixelDetails}
    <div class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Pixel Details</h2>
          <button class="close-button" on:click={closeSidebar}>&times;</button>
        </div>
        <div class="modal-body">
          <PixelCard />
          <PurchaseCard />
          <HistoryCard />
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="sidebar" style="width: {$sidebarStore.width}px; transform: translateX({$sidebarStore.isOpen ? '0' : '-100%'});">
    <div class="sidebar-header">
      <div class="flex">
        <button class="home-button" on:click={goHome}>Home</button>
        <button class="info-button" on:click={openInfoModal}>Info</button>
      </div>

      <button class="connect-wallet" on:click={connectWallet}>
        {#if isConnected}
          <span class="address-text">{address.slice(0, 6)}...{address.slice(-4)}</span>
        {:else}
          <span class="connect-text">Connect Wallet</span>
        {/if}
      </button>

    </div>
    {#if showPixelDetails}
      <PixelCard />
      <PurchaseCard />
      <HistoryCard />
    {:else}
      <h2>PixelFlux</h2>
      <p>Select a pixel to view its details.</p>
    {/if}
  </div>
{/if}

<style>
  .sidebar {
    width: 230px;
    height: 100%;
    padding: 15px;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);
    overflow-y: auto;
    overflow-x: hidden;
    color: #e0e0e0;
    background: linear-gradient(45deg, #232335, #141414);
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transition: transform 0.3s ease-in-out;
  }

  .sidebar-header {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .modal {
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

  .modal-content {
    width: 90%;
    max-height: 90%;
    border-radius: 10px;
    background: linear-gradient(45deg, rgba(35, 35, 53, 0.95), rgba(20, 20, 20, 0.95));
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #444;
  }

  .modal-body {
    padding: 15px;
  }

  .close-button {
    background: none;
    border: none;
    color: #e0e0e0;
    font-size: 1.5em;
    cursor: pointer;
  }

  .home-button, .info-button, .connect-wallet {
    background: none;
    border: none;
    color: #a8a8f8;
    font-size: 1em;
    cursor: pointer;
    padding: 5px 10px;
    width: 100%;
    text-align: left;
    transition: background-color 0.3s;
  }

  .connect-wallet {
    background-color: #535;
    border-radius: 5px;
    text-align: center;
  }

  .home-button:hover, .info-button:hover, .connect-wallet:hover {
    opacity: 0.8;
  }

  .address-text, .connect-text {
    display: inline-block;
    width: 100%;
    text-align: center;
  }

  .flex {
    display: flex;
    justify-content: center;

  }
</style>