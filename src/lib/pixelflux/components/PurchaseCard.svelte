
<script lang="ts">
  import { canvasStore } from '../stores/canvasStore';
  import { blockchainStore } from '../stores/blockchainStore';
  import { fromWeiToMatic } from '../utils';
  import { showNotification } from '../stores/notificationStore';
  import { walletStore } from '../stores/walletStore';
  import BigNumber from 'bignumber.js';

  let layerSliderValue = 0;
  let currentCost: BigNumber;
  let selectedSquare: SVGRectElement | null = null;

  $: selectedSquare = $canvasStore.selectedSquare;
  $: {
    console.log('PurchaseCard: Selected square updated', selectedSquare);
    if (selectedSquare) {
      const squareValue = selectedSquare.getAttribute('data-squareValue');
      console.log('Square value:', squareValue);
    }
  }

  $: isWalletConnected = $walletStore.isConnected;

  $: {
    if (layerSliderValue > 0 && selectedSquare) {
      const squareValue = selectedSquare.getAttribute('data-squareValue');
      currentCost = blockchainStore.calculateTotalValueToSend(new BigNumber(layerSliderValue), new BigNumber(squareValue || '0'));
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

  function decreaseValue() {
    if (layerSliderValue > 0) {
      layerSliderValue--;
      handleLayerSliderUpdate();
    }
  }

  function increaseValue() {
    if (layerSliderValue < 10) {
      layerSliderValue++;
      handleLayerSliderUpdate();
    }
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
      const currentFill = selectedSquare.getAttribute('fill') || '#000';
      const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
      const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
      const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);

      await blockchainStore.buyLayers(x, y, layerSliderValue, currentFill, stage);
      showNotification(`Successfully purchased ${layerSliderValue} layers!`);
      
      // Reset the slider after purchase
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
  <div class="slider-controls">
    <button on:click={decreaseValue}>-</button>
    <div id="slider-value">{layerSliderValue}</div>
    <button on:click={increaseValue}>+</button>
  </div>
  <input
    type="range"
    min="0"
    max="10"
    bind:value={layerSliderValue}
    on:input={handleLayerSliderUpdate}
  />
  <span id="current-cost-container">
    <p>Total Cost</p>
    <span id="current-cost">{fromWeiToMatic(currentCost)} MATIC</span>
  </span>
  <button on:click={buyLayer} disabled={!isWalletConnected || !selectedSquare || layerSliderValue === 0}>
    Buy {layerSliderValue > 1 ? 'Layers' : 'Layer'}
  </button>
</div>


<style>
  .purchase-card {
    border: 1px solid rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.3s;
    background: linear-gradient(135deg, rgba(60, 45, 80, 1) 0%, rgba(67, 52, 97, 1) 100%);
  }

  .purchase-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
  }

  h2 {
    text-align: center;
    margin-bottom: 15px;
    color: #e0e0e0;
  }

  .slider-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .slider-controls button {
    background-color: #535;
    color: #e0e0e0;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 1rem;
  }

  .slider-controls button:hover {
    background-color: #747;
  }

  input[type="range"] {
    width: 100%;
    margin-bottom: 15px;
    -webkit-appearance: none;
    background: transparent;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #a8a8f8;
    cursor: pointer;
    margin-top: -5px;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    background: #535;
    border-radius: 3px;
  }

  #current-cost-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
  }

  #current-cost-container p {
    color: #e0e0e0;
    margin-bottom: 5px;
  }

  #current-cost {
    font-size: 1.2em;
    font-weight: bold;
    color: #a8a8f8;
  }

  button {
    width: 100%;
    padding: 10px;
    background-color: #535;
    color: #e0e0e0;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 1rem;
  }

  button:hover:not(:disabled) {
    background-color: #747;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
