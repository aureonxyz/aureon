<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { canvasStore } from '../stores/canvasStore';
  import { blockchainStore } from '../stores/blockchainStore';
  import { CanvasManager } from './CanvasManager';
 
  let canvasContainer: HTMLDivElement;
  let canvasManager: CanvasManager;
 
  $: stages = $canvasStore.stages;
  $: totalValues = $canvasStore.totalValues;
  $: if (canvasManager && stages && totalValues) {
    canvasManager.updateCanvas(stages, totalValues);
  }
 
  function handleResize() {
    if (canvasManager) {
      canvasManager.resizeCanvas();
    }
  }
 
  onMount(() => {
    canvasManager = new CanvasManager(canvasContainer);
    canvasStore.setCanvas(canvasManager.canvas);
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
   <canvas id="pixelflux-canvas"></canvas>
 </div>
 <style>
  #canvas-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>