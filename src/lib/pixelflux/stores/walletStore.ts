// stores/walletStore.ts

import { writable } from 'svelte/store';
import type { ethers } from 'ethers';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  provider: null,
  signer: null,
};

function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>(initialState);

  return {
    subscribe,
    connect: async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          const network = await provider.getNetwork();

          update(state => ({
            ...state,
            isConnected: true,
            address,
            chainId: network.chainId,
            provider,
            signer,
          }));

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
              // User disconnected their wallet
              set(initialState);
            } else {
              // User switched to a different account
              update(state => ({ ...state, address: accounts[0] }));
            }
          });

          // Listen for chain changes
          window.ethereum.on('chainChanged', (chainId: string) => {
            update(state => ({ ...state, chainId: parseInt(chainId, 16) }));
          });

        } catch (error) {
          console.error('Failed to connect wallet:', error);
        }
      } else {
        console.error('No Ethereum provider found');
      }
    },
    disconnect: () => {
      // Note: There's no standard way to programmatically disconnect a wallet.
      // This just resets the store to its initial state.
      set(initialState);
    },
    updateChainId: (chainId: number) => {
      update(state => ({ ...state, chainId }));
    },
  };
}

export const walletStore = createWalletStore();
