<script lang="ts">
  import { canvasStore } from '../stores/canvasStore';
  import { roundToTwoSignificantFigures } from '../utils';
  import type { CustomRectOptions } from '$pixelflux/interfaces';

  $: selectedSquare = $canvasStore.selectedSquare as CustomRectOptions | null;
  $: currentLayerNumber = selectedSquare?.squareLayers?.length ?? 0;
  $: currentValue = selectedSquare
    ? roundToTwoSignificantFigures((selectedSquare.squareValue ?? 0) * currentLayerNumber)
    : 0;
  $: coordinates = selectedSquare
    ? `x: ${selectedSquare.gridX}, y: ${selectedSquare.gridY + selectedSquare.yOffset}`
    : 'No pixel selected';

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
      style="background-color: {selectedSquare?.originalFill || '#000'}"
      on:mouseenter={() => handleHover('current', true)}
      on:mouseleave={() => handleHover('current', false)}
      role="img"
      aria-label="Current pixel color"
    ></div>
    <span class="arrow" aria-hidden="true">&rarr;</span>
    <div
      class="pixel-preview"
      style="background-color: {selectedSquare?.fill || '#000'}"
      on:mouseenter={() => handleHover('preview', true)}
      on:mouseleave={() => handleHover('preview', false)}
      role="img"
      aria-label="Preview pixel color"
    ></div>
  </div>
  <div class="pixel-properties">
    <p>Layer: <span class="highlight">{currentLayerNumber - 1}</span></p>
    <p>Value: <span class="highlight">{currentValue} Matic</span></p>
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