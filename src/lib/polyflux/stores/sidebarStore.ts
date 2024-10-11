// stores/sidebarStore.ts
import { writable } from 'svelte/store';

function createSidebarStore() {
  const { subscribe, set, update } = writable({
    isOpen: true,
    width: 230 // This should match the width in your CSS
  });

  return {
    subscribe,
    toggle: () => update(state => ({ ...state, isOpen: !state.isOpen })),
    open: () => set({ isOpen: true, width: 230 }),
    close: () => set({ isOpen: false, width: 0 })
  };
}

export const sidebarStore = createSidebarStore();
