<script lang="ts">
  import PixelCard from './PixelCard.svelte';
  import PurchaseCard from './PurchaseCard.svelte';
  import HistoryCard from './HistoryCard.svelte';
  import { canvasStore } from '../stores/canvasStore';

  $: showSidebar = !!$canvasStore.selectedSquare;
</script>

{#if showSidebar}
  <div id="sidebar">
    <PixelCard />
    <PurchaseCard />
    <HistoryCard />
  </div>
{/if}
<style>
  #sidebar {
    max-width: 230px;
    min-width: 230px;
    height: 100%;
    padding: 15px;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.3);
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 0 10px 10px 0;
    color: #e0e0e0;
    background: linear-gradient(45deg, #232335, #141414);
  }

  #sidebar #close-modal {
    display: none;
  }

  #sidebar .square-content {
    width: 100%;
    flex-direction: column;
  }

  #top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  #top-nav p {
    margin: 0;
    font-size: 1.2em;
    font-weight: bold;
  }

  @media screen and (max-width: 520px) {
    #sidebar {
      max-width: 100%;
      background: linear-gradient(45deg, rgba(35, 35, 53, 0.8), rgba(20, 20, 20, 0.8));
    }

    #sidebar #close-modal {
      display: block;
      background: none;
      border: none;
      color: #e0e0e0;
      font-size: 1em;
      cursor: pointer;
    }

    .modal-content {
      width: 100%;
      z-index: 999;
    }

    .square-content {
      display: flex;
      justify-content: center;
    }
  }
</style>
