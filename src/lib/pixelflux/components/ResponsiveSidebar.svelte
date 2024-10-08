<!-- ResponsiveSidebar.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PixelCard from './PixelCard.svelte';
  import PurchaseCard from './PurchaseCard.svelte';
  import HistoryCard from './HistoryCard.svelte';
  import { canvasStore } from '../stores/canvasStore';
  
  let isMobile: boolean;
  $: showPixelDetails = !!$canvasStore.selectedSquare;
  
  function checkMobile() {
    isMobile = window.innerWidth <= 768; // Adjust this breakpoint as needed
  }
  
  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
  
  function closeSidebar() {
    $canvasStore.selectedSquare = null;
  }
  
  function goHome() {
    window.location.href = '/';
  }
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
    <div class="sidebar">
      <button class="home-button" on:click={goHome}>Home</button>
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
  
  .home-button {
    background: none;
    border: none;
    color: #a8a8f8;
    font-size: 1em;
    cursor: pointer;
    margin-bottom: 15px;
    padding: 5px 10px;
  }
  
  button:hover {
    opacity: 0.8;
  }
  </style>