// stores/blockchainStore.ts
import { writable, get } from 'svelte/store';
import { Contract } from 'ethers';
import BigNumber from "bignumber.js";

import type { Stage, Cell, BlockchainState, BlockchainStore, Layer } from '../interfaces';
import contractConfig from '../config/contracts.json';
import { getProvider, contractABIs, getWebsocketProvider } from '../blockchainProvider';
import { canvasStore } from './canvasStore';
import { showNotification } from './notificationStore';
import { showWalletModal } from './walletModalStore';
import { fromMaticToWei } from '../utils';

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

  async function getConnectedPolygonAccounts(): Promise<string[]> {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isConnected()) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts;
      } catch (error) {
        console.error('Error getting connected accounts:', error);
        showNotification('Error getting connected accounts. Please check your wallet connection.');
        return [];
      }
    }
    return [];
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

      const contractAddresses = contractConfig.polygon.Pixelflux;
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

  function calculateTotalValueToSend(numLayersToAdd: BigNumber, baseValue: BigNumber): BigNumber {
    const state = get({ subscribe });
    const selectedSquare = canvasStore.getSelectedSquare();
    if (!selectedSquare) return new BigNumber(0);
    
    const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
    const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
    const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);

    const currentLayersCount = state.stages[stage]?.cells[y]?.[x]?.layers.length || 0;

    const baseValueInWei = new BigNumber(fromMaticToWei(baseValue.toNumber()));
    const sumOfSeries = numLayersToAdd
      .multipliedBy(new BigNumber(2).multipliedBy(currentLayersCount).plus(numLayersToAdd).minus(1))
      .dividedBy(2);
    const refundAmount = baseValueInWei
      .multipliedBy(numLayersToAdd.multipliedBy(numLayersToAdd.minus(1)))
      .dividedBy(2);
    return baseValueInWei.multipliedBy(sumOfSeries).minus(refundAmount);
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
      const provider = await getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }

      const accounts = await getConnectedPolygonAccounts();
      if (accounts.length === 0) {
        throw new Error('No connected accounts');
      }

      const userAddress = accounts[0];
      const signer = provider.getSigner(userAddress);
      const contract = new Contract(contractConfig.polygon.Pixelflux[stage], contractABIs[stage], await signer);

      const state = get({ subscribe });
      const baseValue = state.stages[stage]?.cells[y]?.[x]?.baseValue || new BigNumber(0);
      const totalValueToSend = calculateTotalValueToSend(new BigNumber(numLayersToAdd), baseValue);

      let gasEstimation;
      try {
        gasEstimation = await contract.buyMultipleLayers.estimateGas(x, y, numLayersToAdd, color, { value: totalValueToSend.toString() });
      } catch (error) {
        console.log('Could not estimate gas', error);
        gasEstimation = estimateGas(numLayersToAdd);
      }

      const txOptions = { value: totalValueToSend.toString(), gasLimit: gasEstimation };

      if (numLayersToAdd === 1) {
        await contract.buyLayer(x, y, color, txOptions);
      } else {
        await contract.buyMultipleLayers(x, y, numLayersToAdd, color, txOptions);
      }

      showNotification('Layer purchase successful!');
    } catch (error) {
      console.error('Error buying layers:', error);
      showNotification('Error purchasing layers. Please try again.');
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
    getConnectedPolygonAccounts,
    calculateTotalValueToSend
  };
}

export const blockchainStore = createBlockchainStore();