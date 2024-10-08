<script lang="ts">
  import Sidebar from '$pixelflux/components/Sidebar.svelte';
  import Notification from '$pixelflux/components/Notification.svelte';
  import WalletModal from '$pixelflux/components/WalletModal.svelte';
  import StageLoader from '$pixelflux/components/StageLoader.svelte';
  </script>
  
  <div id="wrapper">
      <Sidebar />
      <StageLoader />
  </div>
  
  <WalletModal />
  <Notification />
  
  <style>
      #wrapper {
          display: flex;
          height: 100%;
      }
  </style>