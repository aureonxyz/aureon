import { writable } from 'svelte/store';

export const notificationStore = writable({
  show: false,
  message: ''
});

export function showNotification(message: string) {
  notificationStore.set({ show: true, message });
}


export function hideNotification() {
  notificationStore.set({ show: false, message: '' });
}
