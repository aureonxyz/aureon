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
    disconnect: async () => {
      const [primaryWallet] = onboard.state.get().wallets;
      if (primaryWallet) await onboard.disconnectWallet({ label: primaryWallet.label });
      set(initialState);
      showNotification('Wallet disconnected');
    },
    switchToPolygon: async () => {
      try {
        await onboard.setChain({ chainId: '0x89' });
        showNotification('Switched to Polygon network');
      } catch (error) {
        console.error('Failed to switch to Polygon:', error);
        showNotification('Failed to switch to Polygon network. Please switch manually.');
      }
    }
  };
}

export const walletStore = createWalletStore();

// Set up a subscription to Onboard's state
onboard.state.select('wallets').subscribe(wallets => {
  if (wallets.length > 0) {
    const { accounts, chains } = wallets[0];
    walletStore.set({
      isConnected: true,
      address: accounts[0].address,
      chainId: chains[0].id,
    });
    showNotification(`Connected: ${accounts[0].address.slice(0, 6)}...${accounts[0].address.slice(-4)}`);
  } else {
    walletStore.set(initialState);
  }
});