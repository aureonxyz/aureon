// stores/walletStore.ts
import { writable } from 'svelte/store';
import { onboard } from '../blockchainProvider';
import { showNotification } from './notificationStore';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
};

function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>(initialState);

  return {
    subscribe,
    set,
    update,
    reset: () => set(initialState),
    connect: async () => {
      const wallets = await onboard.connectWallet();
      if (wallets[0]) {
        const { accounts, chains } = wallets[0];
        update(state => ({
          ...state,
          isConnected: true,
          address: accounts[0].address,
          chainId: chains[0].id
        }));
        showNotification(`Connected: ${accounts[0].address.slice(0, 6)}...${accounts[0].address.slice(-4)}`);
      }
    },
    disconnect: async () => {
      const [primaryWallet] = onboard.state.get().wallets;
      if (primaryWallet) await onboard.disconnectWallet({ label: primaryWallet.label });
      set(initialState);
      showNotification('Wallet disconnected');
    },
    switchToPolygon: async () => {
      await onboard.setChain({ chainId: '0x89' });
    }
  };
}

export const walletStore = createWalletStore();