// stores/canvasStore.ts
import { writable, get } from 'svelte/store';
import type { CanvasState, CustomRectOptions, Cell, Layer } from '../interfaces';
import type { fabric } from 'fabric';
import BigNumber from 'bignumber.js';

const initialState: CanvasState = {
  stages: [],
  totalValues: [],
  selectedSquare: null,
  canvas: null,
};

function createCanvasStore() {
  const { subscribe, set, update } = writable<CanvasState>(initialState);

  return {
    subscribe,
    set,
    update,
    setCanvas: (canvas: fabric.Canvas) => update(state => ({ ...state, canvas })),
    setSelectedSquare: (square: CustomRectOptions | null) => update(state => ({ ...state, selectedSquare: square })),
    updateCell: (buyer: string, x: number, y: number, numLayers: number, color: string, stageIndex: number) => {
      update(state => {
        const newStages = [...state.stages];
        const stage = newStages[stageIndex];
        if (stage && stage.cells[y] && stage.cells[y][x]) {
          const cell = stage.cells[y][x];
          for (let i = 0; i < numLayers; i++) {
            cell.layers.push({ owner: buyer, color });
          }
        }
        return { ...state, stages: newStages };
      });
    },
    updateTotalValues: (newTotalValues: BigNumber[]) => {
      update(state => ({ ...state, totalValues: newTotalValues }));
    },
    getSelectedSquareLayers: (): Layer[] => {
      const state = get({ subscribe });
      return state.selectedSquare?.squareLayers || [];
    },
    getSelectedSquareValue: (): BigNumber => {
      const state = get({ subscribe });
      return state.selectedSquare?.squareValue ? new BigNumber(state.selectedSquare.squareValue) : new BigNumber(0);
    },
    getSelectedSquare: (): CustomRectOptions | null => {
      const state = get({ subscribe });
      return state.selectedSquare;
    }
  };
}

export const canvasStore = createCanvasStore();
