// stores/blockchainStore.ts
import { writable, get } from 'svelte/store';
import { BrowserProvider, Contract, ethers, parseUnits } from 'ethers';

import BigNumber from "bignumber.js";

import type { Stage, Cell, BlockchainState, BlockchainStore, Layer } from '../interfaces';
import contractConfig from '../config/contracts.json';
import { getProvider, contractABIs, getWebsocketProvider, onboard } from '../blockchainProvider';
import { canvasStore } from './canvasStore';
import { showNotification } from './notificationStore';
import { fromMaticToWei } from '../utils';
import { walletStore } from './walletStore';

const initialState: BlockchainState = {
  stages: [],
  totalValues: [],
  loading: true,
  loadingProgress: 0,
  loadingText: 'Initializing...',
  contracts: [],
  websocketContracts: [],
};

function createBlockchainStore(): BlockchainStore {
  const { subscribe, set, update } = writable<BlockchainState>(initialState);

  const BASE_GAS = 500000;
  const GAS_PER_EXISTING_LAYER = 20000;
  const GAS_PER_NEW_LAYER = 15000;
  const BUFFER_MULTIPLIER = 1.20;

  function setupEventListeners(wssContract: Contract, jsonContract: Contract, index: number) {
    wssContract.on('LayerPurchased', async (buyer: string, x: number, y: number, numLayers: number, color: string) => {
      const updatedTotalValue = new BigNumber(await jsonContract.calculateTotalValue());
      update(state => {
        const newTotalValues = [...state.totalValues];
        newTotalValues[index] = updatedTotalValue;
        updateCanvasCell(buyer, x, y, numLayers, color, index, newTotalValues);
        return {
          ...state,
          totalValues: newTotalValues
        };
      });
    });

    if (index !== 0) {
      try {
        wssContract.on('ContractEnabled', async () => {
          await fetchStages();
        });
      } catch (error) {
        console.error(`Failed to set up ContractEnabled listener for contract ${index}:`, error);
      }
    }
  }

  function updateCanvasCell(buyer: string, x: number, y: number, numLayers: number, color: string, stageIndex: number, updatedTotalValues: BigNumber[]) {
    canvasStore.updateCell(buyer, x, y, numLayers, color, stageIndex);
  }

  async function fetchStages() {
    try {
      const provider = await getProvider();
      if (!provider) {
        throw new Error('Failed to get a provider.');
      }
      const wssProvider = getWebsocketProvider();
      const stages: Stage[] = [];
      const totalValues: BigNumber[] = [];
      const contracts: Contract[] = [];
      const websocketContracts: Contract[] = [];

      const contractAddresses = contractConfig.polygon.Polyflux;
      for (const [index, address] of contractAddresses.entries()) {
        const jsonContract = new Contract(address, contractABIs[index], provider);
        const wssContract = new Contract(address, contractABIs[index], wssProvider);

        contracts.push(jsonContract);
        websocketContracts.push(wssContract);

        setupEventListeners(wssContract, jsonContract, index);

        const isEnabled = await jsonContract.isContractEnabled();
        const cells: Cell[][] = isEnabled ? await jsonContract.getAllCellStates() : [];
        const stageData: Stage = {
          isEnabled,
          cells
        };
        const totalValue = new BigNumber(await jsonContract.calculateTotalValue());
        totalValues.push(totalValue);

        const progressPercentage = ((index + 1) / contractAddresses.length) * 100;
        update(state => ({
          ...state,
          loadingProgress: progressPercentage,
          loadingText: `Loading stage ${index + 1} of ${contractAddresses.length}...`
        }));

        stages.push(stageData);
      }
      set({
        stages,
        totalValues,
        loading: false,
        loadingProgress: 100,
        loadingText: 'Loading complete',
        contracts,
        websocketContracts,
      });

      return { stages, totalValues };
    } catch (error) {
      console.error('Error fetching stages:', error);
      showNotification('Error fetching data from provider. Please retry again later.');
      throw error;
    }
  }
  function calculateTotalValueToSend(numLayersToAdd: BigNumber | number, baseValue: BigNumber | number | string): BigNumber {
    const state = get({ subscribe });
    const selectedSquare = canvasStore.getSelectedSquare();
    if (!selectedSquare) return new BigNumber(0);
    
    const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
    const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
    const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);
  
    const currentLayersCount = state.stages[stage]?.cells[y]?.[x]?.layers.length || 0;
  
    // Ensure numLayersToAdd and baseValue are BigNumber instances
    const numLayersBN = new BigNumber(numLayersToAdd);
    const baseValueBN = new BigNumber(baseValue);
  
    // Ensure baseValue is in wei
    const baseValueInWei = new BigNumber(fromMaticToWei(baseValueBN.toString()));
    
    const sumOfSeries = numLayersBN
      .multipliedBy(new BigNumber(2).multipliedBy(currentLayersCount).plus(numLayersBN).minus(1))
      .dividedBy(2);
    const refundAmount = baseValueInWei
      .multipliedBy(numLayersBN.multipliedBy(numLayersBN.minus(1)))
      .dividedBy(2);
    const totalValue = baseValueInWei.multipliedBy(sumOfSeries).minus(refundAmount);
  
    console.log('Calculated total value:', totalValue.toFixed(0));
  
    return totalValue;
  }

  function estimateGas(numLayersToAdd: number): number {
    const state = get({ subscribe });
    const selectedSquare = canvasStore.getSelectedSquare();
    if (!selectedSquare) return 0;
    
    const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
    const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
    const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);

    const currentLayersCount = state.stages[stage]?.cells[y]?.[x]?.layers.length || 0;

    return Math.ceil((
      BASE_GAS +
      (GAS_PER_EXISTING_LAYER * currentLayersCount) +
      (GAS_PER_NEW_LAYER * numLayersToAdd)
    ) * BUFFER_MULTIPLIER);
  }
  async function buyLayers(x: number, y: number, numLayersToAdd: number, color: string, stage: number) {
    try {
      const walletState = get(walletStore);
      if (!walletState.isConnected || !walletState.address) {
        throw new Error('Wallet not connected');
      }
  
      const wallets = onboard.state.get().wallets;
      if (wallets.length === 0) {
        throw new Error('No wallet connected');
      }
  
      const provider = new BrowserProvider(wallets[0].provider);
      const signer = await provider.getSigner();
  
      const contract = new Contract(contractConfig.polygon.Polyflux[stage], contractABIs[stage], signer);
  
      const state = get({ subscribe });
      const baseValue = state.stages[stage]?.cells[y]?.[x]?.baseValue || '0';
      console.log('Base value:', baseValue);
      const totalValueToSend = calculateTotalValueToSend(new BigNumber(numLayersToAdd), baseValue);
      console.log('Total value to send (BigNumber):', totalValueToSend.toFixed(0));
  
      // Convert the BigNumber to a BigInt
      const valueInWei = BigInt(totalValueToSend.toFixed(0));
      console.log('Value in Wei (BigInt):', valueInWei.toString());
  
      let gasEstimation;
      try {
        gasEstimation = await contract.buyMultipleLayers.estimateGas(x, y, numLayersToAdd, color, { value: valueInWei });
      } catch (error) {
        console.log('Could not estimate gas', error);
        
        // Check if the error is due to insufficient funds
        if (error.code === 'INSUFFICIENT_FUNDS' || (error.error && error.error.message && error.error.message.includes('insufficient funds'))) {
          showNotification('Insufficient funds to complete this transaction. Please add more MATIC to your wallet.');
          return; // Exit the function early
        }
        
        gasEstimation = estimateGas(numLayersToAdd);
      }
  
      const txOptions = { value: valueInWei, gasLimit: gasEstimation };
  
      if (numLayersToAdd === 1) {
        await contract.buyLayer(x, y, color, txOptions);
      } else {
        await contract.buyMultipleLayers(x, y, numLayersToAdd, color, txOptions);
      }
  
      showNotification('Layer purchase successful!');
    } catch (error) {
      console.error('Error buying layers:', error);
      
      // Check for insufficient funds error here as well
      if (error.code === 'INSUFFICIENT_FUNDS' || (error.error && error.error.message && error.error.message.includes('insufficient funds'))) {
        showNotification('Insufficient funds to complete this transaction. Please add more MATIC to your wallet.');
      } else {
        showNotification('Error purchasing layers. Please try again.');
      }
      
      throw error;
    }
  }

  function getSelectedCellLayers(): Layer[] {
    const state = get({ subscribe });
    const selectedSquare = canvasStore.getSelectedSquare();
    if (!selectedSquare) return [];
    
    const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
    const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
    const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);

    return state.stages[stage]?.cells[y]?.[x]?.layers || [];
  }

  function getSelectedCellValue(): BigNumber {
    const state = get({ subscribe });
    const selectedSquare = canvasStore.getSelectedSquare();
    if (!selectedSquare) return new BigNumber(0);
    
    const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
    const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
    const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);

    return state.stages[stage]?.cells[y]?.[x]?.baseValue || new BigNumber(0);
  }

  return {
    subscribe,
    set,
    update,
    fetchStages,
    buyLayers,
    getSelectedCellLayers,
    getSelectedCellValue,
    calculateTotalValueToSend
  };
}

export const blockchainStore = createBlockchainStore();