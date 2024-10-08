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
    console.log('Stages and totalValues updated. Updating canvas...');
    canvasManager.updateCanvas(stages, totalValues);
  }

  onMount(() => {
    console.log('Canvas component mounted');
    canvasManager = new CanvasManager(canvasContainer);
    canvasStore.setCanvas(canvasManager.canvas);
    window.addEventListener('resize', canvasManager.resizeCanvas);
    blockchainStore.fetchStages();
  });

  onDestroy(() => {
    console.log('Canvas component being destroyed');
    window.removeEventListener('resize', canvasManager.resizeCanvas);
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
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>