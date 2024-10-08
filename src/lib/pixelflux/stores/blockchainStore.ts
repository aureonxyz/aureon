// stores/blockchainStore.ts
import { writable, get } from 'svelte/store';
import { Contract } from 'ethers';
import BigNumber from "bignumber.js";

import type { Stage, CustomRectOptions, Cell, BlockchainState, Layer } from '../interfaces';
import contractConfig from '../config/contracts.json';
import { getProvider, contractABIs, getWebsocketProvider } from '../blockchainProvider';
import { canvasStore } from './canvasStore';
import { showNotification } from './notificationStore';
import { showWalletModal } from './walletModalStore';
import type { fabric } from 'fabric';

const initialState: BlockchainState = {
  stages: [],
  totalValues: [],
  loading: true,
  loadingProgress: 0,
  loadingText: 'Initializing...',
  contracts: [],
  websocketContracts: [],
};

function createBlockchainStore() {
  const { subscribe, set, update } = writable<BlockchainState>(initialState);

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
    canvasStore.update(state => {
      const canvas = state.canvas;
      if (!canvas) {
        console.warn('Canvas not found in canvasStore');
        return state;
      }

      const square = canvas.getObjects().find((obj: any) => 
        obj.gridX === x && obj.gridY === y && obj.stage === stageIndex
      ) as fabric.Rect & CustomRectOptions;

      if (square) {
        square.set('fill', color);
        square.originalFill = color;
        const updatedLayers: Layer[] = [...(square.squareLayers || [])];

        for (let i = 0; i < numLayers; i++) {
          updatedLayers.push({
            owner: buyer,
            color: color
          });
        }
        square.set('squareLayers', updatedLayers);
      
        if (state.selectedSquare && state.selectedSquare.gridX === x && state.selectedSquare.gridY === y && state.selectedSquare.stage === stageIndex) {
          state.selectedSquare = square;
        }
      } else {
        console.warn(`Square not found:`, { x, y, stageIndex });
      }

      canvas.renderAll();

      return state;
    });
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

  async function buyLayer(x: number, y: number, stage: number, color: string) {
    try {
      const accounts = await getConnectedPolygonAccounts();
      if (accounts.length === 0) {
        showWalletModal('Please connect your wallet to continue.');
        return;
      }

      update(state => {
        if (state.contracts.length <= stage) {
          throw new Error('Invalid stage number');
        }
        return {
          ...state,
          loading: true,
          loadingText: 'Purchasing layer...'
        };
      });

      const state = get({ subscribe });
      const contract = state.contracts[stage];
      const tx = await contract.buyLayer(x, y, color);
      await tx.wait();

      showNotification('Layer purchased successfully!');
    } catch (error) {
      console.error('Error buying layer:', error);
      showNotification('Error purchasing layer. Please try again.');
    } finally {
      update(state => ({
        ...state,
        loading: false,
        loadingText: ''
      }));
    }
  }

  return {
    subscribe,
    fetchStages,
    buyLayer,
    getConnectedPolygonAccounts
  };
}

export const blockchainStore = createBlockchainStore();