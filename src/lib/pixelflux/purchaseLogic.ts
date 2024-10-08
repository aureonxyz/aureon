// purchaseLogic.ts

import { Contract } from 'ethers';
import { getBrowserProvider, contractABIs } from './blockchainProvider';
import { canvasStore } from './stores/canvasStore';
import contractConfig from './config/contracts.json';
import { showNotification } from './stores/notificationStore';
import { fromMaticToWei } from './utils';
import BigNumber from 'bignumber.js';

const BASE_GAS = 500000;
const GAS_PER_EXISTING_LAYER = 20000;
const GAS_PER_NEW_LAYER = 15000;
const BUFFER_MULTIPLIER = 1.20;

export const calculateTotalValueToSend = (numLayersToAdd: BigNumber, baseValue: BigNumber): BigNumber => {
  const currentLayersCount = canvasStore.getSelectedSquareLayers().length;
  const baseValueInWei = new BigNumber(fromMaticToWei(baseValue.toNumber()));
  const sumOfSeries = numLayersToAdd
    .multipliedBy(new BigNumber(2).multipliedBy(currentLayersCount).plus(numLayersToAdd).minus(1))
    .dividedBy(2);
  const refundAmount = baseValueInWei
    .multipliedBy(numLayersToAdd.multipliedBy(numLayersToAdd.minus(1)))
    .dividedBy(2);
  return baseValueInWei.multipliedBy(sumOfSeries).minus(refundAmount);
};

const estimateGas = (numLayersToAdd: number): number => {
  const currentLayersCount = canvasStore.getSelectedSquareLayers().length;
  return Math.ceil((
    BASE_GAS +
    (GAS_PER_EXISTING_LAYER * currentLayersCount) +
    (GAS_PER_NEW_LAYER * numLayersToAdd)
  ) * BUFFER_MULTIPLIER);
};

const buyLayers = async (provider: any, userAddress: string, contractAddress: string, x: number, y: number, numLayersToAdd: number, color: string, stage: number) => {
  try {
    const signer = await provider.getSigner(userAddress);
    const contract = new Contract(contractAddress, contractABIs[stage], signer);
    const totalValueToSend = calculateTotalValueToSend(new BigNumber(numLayersToAdd), canvasStore.getSelectedSquareValue());
    let gasEstimation;
    try {
      gasEstimation = await contract.buyMultipleLayers.estimateGas(x, y, numLayersToAdd, color, { value: totalValueToSend.toString() });
    } catch (error) {
      console.log('Could not estimate gas', error);
    }
    if (!gasEstimation) {
      gasEstimation = estimateGas(numLayersToAdd);
    }
    if (numLayersToAdd === 1) {
      await contract.buyLayer(x, y, color, { value: totalValueToSend.toString(), gasLimit: gasEstimation, gas: gasEstimation });
    } else {
      await contract.buyMultipleLayers(x, y, numLayersToAdd, color, { value: totalValueToSend.toString(), gasLimit: gasEstimation, gas: gasEstimation });
    }
  } catch (error: any) {
    if (error.info && error.info.error && error.info.error.code === 4001) {
      console.log("User cancelled the transaction.");
    } else {
      console.error("Contract interaction error:", error);
    }
    throw error;
  }
};

export const handlePurchaseClick = async (numLayersToAdd: number, color: string) => {
  const provider = getBrowserProvider();
  let userAddress = '';
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      userAddress = accounts[0];
    }
  }
  if (!userAddress) {
    showNotification("No user address found. Please connect to a wallet.");
    return;
  }
  const selectedSquare = canvasStore.getSelectedSquare();
  if (!selectedSquare) {
    showNotification("No square selected. Please select a square first.");
    return;
  }
  const contractAddress = contractConfig.polygon.Pixelflux[selectedSquare.stage];
  const x = selectedSquare.gridX;
  const y = selectedSquare.gridY;
  const stage = selectedSquare.stage;
  await buyLayers(provider, userAddress, contractAddress, x, y, numLayersToAdd, color, stage);
};
