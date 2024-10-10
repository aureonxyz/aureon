<script lang="ts">
  import { onMount } from 'svelte';
  import { blockchainStore } from '$pixelflux/stores/blockchainStore';
  import { canvasStore } from '$pixelflux/stores/canvasStore';
  import { showNotification } from '$pixelflux/stores/notificationStore';
  import { showWalletModal } from '$pixelflux/stores/walletModalStore';
  import { sidebarStore } from '$pixelflux/stores/sidebarStore';
  import ResponsiveSidebar from '$pixelflux/components/ResponsiveSidebar.svelte';
  import Canvas from '$pixelflux/components/Canvas.svelte';
  import Notification from '$pixelflux/components/Notification.svelte';
  import WalletModal from '$pixelflux/components/WalletModal.svelte';
 
  let loadingError = '';
 
  onMount(async () => {
    try {
      await blockchainStore.fetchStages();
    } catch (error: any) {
      if (error.message === 'Failed to get a provider.') {
        loadingError = 'No wallet provider found.';
        showWalletModal('Please connect your wallet to continue.');
      } else {
        loadingError = 'Failed to fetch data from the provider.';
        showNotification('Error fetching data from provider. Please retry again later.');
      }
    }
  });
 
  $: ({ loading, loadingProgress, loadingText, stages, totalValues } = $blockchainStore);
  $: if (stages && totalValues) {
    canvasStore.update(state => ({ ...state, stages, totalValues }));
  }
 
  function retryLoading() {
    loadingError = '';
    blockchainStore.fetchStages();
  }
 </script>
 
 <div id="wrapper" class:sidebar-open={$sidebarStore.isOpen}>
   <ResponsiveSidebar />
   <div id="main-content">
     {#if loading}
       <div id="loading">
         <div id="progress-bar">
           <div class="progress-fill" style="width: {loadingProgress}%"></div>
         </div>
         <div id="loading-text">{loadingText}</div>
       </div>
     {:else if loadingError}
       <div id="error">
         <p>{loadingError}</p>
         <button on:click={retryLoading}>Retry</button>
       </div>
     {:else}
       <Canvas />
     {/if}
   </div>
 </div>
 
 <WalletModal />
 <Notification />
 
 <style>
   #wrapper {
     display: flex;
     height: 100vh;
     width: 100vw;
     overflow: hidden;
   }
 
   #main-content {
     flex-grow: 1;
     height: 100%;
     display: flex;
     justify-content: center;
     align-items: center;
     transition: margin-left 0.3s ease;
   }
 
   .sidebar-open #main-content {
     margin-left: 260px; /* Width of the sidebar */
   }
 
   #loading, #error {
     display: flex;
     flex-direction: column;
     justify-content: center;
     align-items: center;
   }
 
   #progress-bar {
     width: 80%;
     height: 20px;
     background-color: #232335;
     margin: 0 auto;
   }
 
   .progress-fill {
     height: 100%;
     width: 0%;
     background-color: #a8a8f8;
     transition: width 0.5s ease;
   }
 
   #loading-text, #error {
     margin-top: 10px;
     color: #a8a8f8;
     font-size: 16px;
   }
 
   button {
     margin-top: 10px;
     padding: 5px 10px;
     background-color: #a8a8f8;
     color: #232335;
     border: none;
     border-radius: 5px;
     cursor: pointer;
   }
 
   button:hover {
     background-color: #8a8ad8;
   }
 
   @media (max-width: 768px) {
     #wrapper {
       flex-direction: column;
     }
 
     .sidebar-open #main-content {
       margin-left: 0;
     }
   }
 </style>