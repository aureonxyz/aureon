<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { canvasStore } from '../stores/canvasStore';
  import { blockchainStore } from '../stores/blockchainStore';
  import { sidebarStore } from '../stores/sidebarStore';
  import { CanvasManager } from './CanvasManager';

  let canvasContainer: HTMLDivElement;
  let canvasManager: CanvasManager;

  $: if (canvasManager && $canvasStore.stages && $canvasStore.totalValues) {
    canvasManager.updateCanvas();
  }

  function handleResize() {
    if (canvasManager) {
      const sidebarWidth = $sidebarStore.isOpen ? $sidebarStore.width : 0;
      canvasManager.resizeCanvas(sidebarWidth);
    }
  }

  onMount(() => {
    canvasManager = new CanvasManager(canvasContainer);
    window.addEventListener('resize', handleResize);
    blockchainStore.fetchStages();
    handleResize(); // Initial resize
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    canvasManager.dispose();
  });
</script>
  
  <div id="canvas-container" bind:this={canvasContainer}>
    <!-- SVG will be inserted here by CanvasManager -->
  </div>
  
  <style>
    #canvas-container {
      width: 100%;
      height: 100%;
      overflow: hidden; /* Change from auto to hidden */
      position: relative; /* Add this line */
    }
  </style>