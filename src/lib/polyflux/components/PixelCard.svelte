<script lang="ts">
  import { canvasStore } from '../stores/canvasStore';
  import { colorStore } from '../stores/colorStore';
  import { blockchainStore } from '../stores/blockchainStore';
  import { fromGweiToMatic } from '../utils';
  import BigNumber from 'bignumber.js';
  import type { Layer } from '../interfaces';

  let squareLayers: Layer[] = [];
  
  $: selectedSquare = $canvasStore.selectedSquare;
  $: selectedColor = $colorStore;
  $: squareValue = new BigNumber(0);
  $: currentLayerNumber = 0;
  $: currentValue = '0';
  $: coordinates = 'No pixel selected';
  $: originalFill = '#000';
  $: currentFill = '#000';

  $: {

    if (selectedSquare) {
      const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
      const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
      const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);

      squareLayers = $blockchainStore.stages[stage]?.cells[y]?.[x]?.layers || [];
      squareValue = $blockchainStore.stages[stage]?.cells[y]?.[x]?.baseValue || new BigNumber(0);
      currentLayerNumber = squareLayers.length;

      const valueInMatic = new BigNumber(fromGweiToMatic(squareValue));
      const totalValue = valueInMatic.multipliedBy(currentLayerNumber || 1);
      currentValue = totalValue.toFixed(4);  // Display 4 decimal places

      coordinates = `x: ${x}, y: ${y}`;
      originalFill = selectedSquare.getAttribute('data-originalFill') || '#000';
      currentFill = selectedColor ? selectedColor : '#000';  // Use the selected color from the store

    } else {
      squareLayers = [];
      currentValue = '0';
      coordinates = 'No pixel selected';
      originalFill = '#000';
      currentFill = '#000';
    }
  }
  function handleHover(element: 'current' | 'preview', isHovered: boolean): void {
    const selector = element === 'current' ? '.pixel-current' : '.pixel-preview';
    const pixelElement = document.querySelector(selector) as HTMLElement | null;
    if (pixelElement) {
      pixelElement.classList.toggle('hovered', isHovered);
    }
  }
</script>

<div class="pixel-card">
  <h3>Selected Pixel</h3>
  <div class="pixel-display-container">
    <div
      class="pixel-current"
      style="background-color: {originalFill}"
      on:mouseenter={() => handleHover('current', true)}
      on:mouseleave={() => handleHover('current', false)}
      role="img"
      aria-label="Current pixel color"
    ></div>
    <span class="arrow" aria-hidden="true">&rarr;</span>
    <div
      class="pixel-preview"
      style="background-color: {currentFill}"
      on:mouseenter={() => handleHover('preview', true)}
      on:mouseleave={() => handleHover('preview', false)}
      role="img"
      aria-label="Preview pixel color"
    ></div>
  </div>
  <div class="pixel-properties">
    <p>Layer: <span class="highlight">{currentLayerNumber}</span></p>
    <p>Value: <span class="highlight">{currentValue} Matic</p>
    <p>Coordinates: <span class="highlight">{coordinates}</span></p>
  </div>
</div>

<style>
  .pixel-card {
    border: 1px solid rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.3s;
    background: linear-gradient(135deg, rgba(34, 34, 60, 1) 0%, rgba(47, 47, 77, 1) 100%);
  }
  .pixel-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
  }
  h3 {
    text-align: center;
    color: #e0e0e0;
    margin-bottom: 15px;
  }
  .pixel-display-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto 1rem auto;
  }
  .pixel-current, .pixel-preview {
    width: 3rem;
    height: 3rem;
    border: 3px solid #333;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.3s;
    cursor: pointer;
  }
  .pixel-current.hovered, .pixel-preview.hovered {
    border: 3px solid #a8a8f8;
    transform: scale(1.1);
  }
  .arrow {
    margin: 0 1rem;
    color: #e0e0e0;
    font-size: 1.5rem;
  }
  .pixel-properties {
    color: #e0e0e0;
    text-align: center;
  }
  .pixel-properties p {
    margin: 5px 0;
    font-weight: 300;
  }
  .highlight {
    color: #a8a8f8;
    font-weight: 600;
  }
</style>