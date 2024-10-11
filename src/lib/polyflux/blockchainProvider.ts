import { BrowserProvider, JsonRpcProvider, WebSocketProvider } from 'ethers';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import Polyflux1JSON from './build/contracts/Polyflux1.json';
import Polyflux2JSON from './build/contracts/Polyflux2.json';
import Polyflux3JSON from './build/contracts/Polyflux3.json';

// Initialize Web3-Onboard
const injected = injectedModule();
const onboard = Onboard({
  wallets: [injected],
  chains: [
    {
      id: '0x89', // Polygon Mainnet
      token: 'MATIC',
      label: 'Polygon',
      rpcUrl: `https://polygon-mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`
    }
  ]
});

const getBrowserProvider = async (): Promise<BrowserProvider | null> => {
  const wallets = await onboard.connectWallet();
  if (wallets[0]) {
    return new BrowserProvider(wallets[0].provider);
  }
  return null;
}

const getInfuraProvider = (): JsonRpcProvider | null => {
  const infuraUrl = `https://polygon-mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`;
  if (!import.meta.env.VITE_INFURA_API_KEY) {
    console.error('Infura API key is required.');
    return null;
  }
  return new JsonRpcProvider(infuraUrl);
}

const getAnkrProvider = (): JsonRpcProvider | null => {
  const ankrUrl = `https://rpc.ankr.com/polygon/${import.meta.env.VITE_ANKR_API_KEY}`;
  if (!import.meta.env.VITE_ANKR_API_KEY) {
    console.error('Ankr API key is required.');
    return null;
  }
  return new JsonRpcProvider(ankrUrl);
};

const getWebsocketProvider = (): WebSocketProvider | null => {
  const quikUrl = `wss://serene-dimensional-brook.matic.quiknode.pro/${import.meta.env.VITE_QUIKNODE_API_KEY}/`;
  if (!import.meta.env.VITE_QUIKNODE_API_KEY) {
    console.error('Quiknode API key is required.');
    return null;
  }
  return new WebSocketProvider(quikUrl);
}

const getProvider = async (): Promise<BrowserProvider | JsonRpcProvider | null> => {
  let provider: BrowserProvider | JsonRpcProvider | null = getInfuraProvider();
  if (provider) {
    try {
      await provider.getNetwork();
      return provider;
    } catch (error: any) {
      if (!error.message.includes('403')) {
        console.error('InfuraProvider not supported:', error);
      }
    }
  }
  
  provider = getAnkrProvider();
  if (provider) {
    try {
      await provider.getNetwork();
      return provider;
    } catch (error) {
      console.error('AnkrProvider not supported:', error);
    }
  }
  
  provider = await getBrowserProvider();
  if (provider) {
    try {
      await provider.getNetwork();
      return provider;
    } catch (error) {
      console.error('BrowserProvider not supported:', error);
    }
  }
  
  return null;
};

const contractABIs = [Polyflux1JSON.abi, Polyflux2JSON.abi, Polyflux3JSON.abi];

export { contractABIs, getProvider, getBrowserProvider, getAnkrProvider, getWebsocketProvider, onboard };
