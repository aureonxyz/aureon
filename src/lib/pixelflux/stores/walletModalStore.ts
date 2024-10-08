import { writable } from 'svelte/store';

export const walletModalStore = writable({
  show: false,
  message: ''
});

export function showWalletModal(message: string) {
  walletModalStore.set({ show: true, message });
}

export function hideWalletModal() {
  walletModalStore.set({ show: false, message: '' });
}

