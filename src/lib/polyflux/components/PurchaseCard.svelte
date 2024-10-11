<script lang="ts">
  import { canvasStore } from '../stores/canvasStore';
  import { blockchainStore } from '../stores/blockchainStore';
  import { fromGweiToMatic } from '../utils';
  import { showNotification } from '../stores/notificationStore';
  import { walletStore } from '../stores/walletStore';
  import BigNumber from 'bignumber.js';
  import { default as defaultColors } from '../config/colors.json';
  import { colorStore } from '../stores/colorStore';
  
  let layerSliderValue = 0;
  let currentCost: BigNumber;
  let selectedSquare: SVGRectElement | null = null;
  let selectedColor = '#000000';

  $: selectedSquare = $canvasStore.selectedSquare;
  $: isWalletConnected = $walletStore.isConnected;

  $: {
    if (layerSliderValue > 0 && selectedSquare) {
      const squareValue = new BigNumber(selectedSquare.getAttribute('data-squareValue') || '0');
      const valueInMatic = new BigNumber(fromGweiToMatic(squareValue));
      currentCost = valueInMatic.multipliedBy(layerSliderValue);
    } else {
      currentCost = new BigNumber(0);
    }
  }

  function handleLayerSliderUpdate() {
    if (layerSliderValue === 0 && selectedSquare) {
      const originalFill = selectedSquare.getAttribute('data-originalFill');
      if (originalFill && selectedSquare.getAttribute('fill') !== originalFill) {
        selectedSquare.setAttribute('fill', originalFill);
        canvasStore.setSelectedSquare(selectedSquare);
      }
    }
  }
  

  function decreaseLayer() {
    if (layerSliderValue > 0) {
      layerSliderValue--;
      handleLayerSliderUpdate();
    }
  }

  function increaseLayer() {
    if (layerSliderValue < 10) {
      layerSliderValue++;
      handleLayerSliderUpdate();
    }
  }

  function setColor(color: string) {
    selectedColor = color;
    colorStore.set(color)
  }

  async function buyLayer() {
    if (!isWalletConnected) {
      showNotification('Please connect your wallet first.');
      return;
    }
    if (!selectedSquare) {
      showNotification('Please select a pixel first.');
      return;
    }
    try {
      const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
      const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
      const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);

      await blockchainStore.buyLayers(x, y, layerSliderValue, selectedColor, stage);
      showNotification(`Successfully purchased ${layerSliderValue} layers!`);
      
      layerSliderValue = 0;
      handleLayerSliderUpdate();
    } catch (error) {
      console.error('Purchase failed:', error);
      showNotification('Purchase failed. Please try again.');
    }
  }
</script>

<div class="purchase-card">
  <h2>Purchase</h2>
  <div class="color-selection">
    <h3>Select Color</h3>
    <div class="color-options">
      {#each defaultColors as color}
        <div
          class="color-option"
          style="background-color: {color}"
          on:click={() => setColor(color)}
        ></div>
      {/each}
    </div>
  </div>
  <div class="layer-selection">
    <h3>Select Layers</h3>
    <div class="layer-controls">
      <button on:click={decreaseLayer} class="layer-button">-</button>
      <div class="layer-display">{layerSliderValue}</div>
      <button on:click={increaseLayer} class="layer-button">+</button>
    </div>
    <input
      type="range"
      min="0"
      max="10"
      bind:value={layerSliderValue}
      on:input={handleLayerSliderUpdate}
    />
  </div>
  <span id="current-cost-container">
    <p>Total Cost</p>
    <span id="current-cost">{currentCost.toFixed(4)} MATIC</span>
  </span>
  <button on:click={buyLayer} disabled={!isWalletConnected || !selectedSquare || layerSliderValue === 0}>
    Buy {layerSliderValue > 1 ? 'Layers' : 'Layer'}
  </button>
</div>

<style>
  .purchase-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, rgba(40, 30, 60, 1) 0%, rgba(60, 40, 80, 1) 100%);
  }

  h2, h3 {
    text-align: center;
    margin-bottom: 20px;
    color: #f0f0f0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .color-selection, .layer-selection {
    margin-bottom: 25px;
  }

  .color-options {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-bottom: 15px;
  }

  .color-option {
    width: 35px;
    height: 35px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .color-option:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .layer-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 15px;
  }

  .layer-button {
    background-color: rgba(255, 255, 255, 0.1);
    color: #f0f0f0;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .layer-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  .layer-display {
    font-size: 24px;
    font-weight: bold;
    color: #f0f0f0;
    margin: 0 20px;
    width: 40px;
    text-align: center;
  }

  input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    outline: none;
    border-radius: 3px;
    margin-top: 10px;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    background: #a8a8f8;
    cursor: pointer;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  input[type="range"]::-moz-range-thumb {
    width: 22px;
    height: 22px;
    background: #a8a8f8;
    cursor: pointer;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  #current-cost-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
  }

  #current-cost-container p {
    color: #e0e0e0;
    margin-bottom: 5px;
  }

  #current-cost {
    font-size: 1.4em;
    font-weight: bold;
    color: #a8a8f8;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  button {
    width: 100%;
    padding: 12px;
    background-color: #6a5acd;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.1s;
    font-size: 1.1rem;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  button:hover:not(:disabled) {
    background-color: #7b68ee;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>