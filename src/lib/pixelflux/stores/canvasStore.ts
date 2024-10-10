// stores/canvasStore.ts
import { writable, get } from 'svelte/store';
import type { CanvasState, CanvasStore, Layer } from '../interfaces';
import BigNumber from 'bignumber.js';

function createCanvasStore(): CanvasStore {
  const { subscribe, set, update } = writable<CanvasState>({
    stages: [],
    totalValues: [],
    selectedSquare: null,
    svg: null,
  });

  function setSvg(svg: SVGSVGElement) {
    update(state => ({ ...state, svg }));
  }

  function setSelectedSquare(square: SVGRectElement | null) {
    update(state => {
      console.log('Updating selected square:', square);
      return { ...state, selectedSquare: square };
    });
  }

  function updateCell(buyer: string, x: number, y: number, numLayers: number, color: string, stageIndex: number) {
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
  }

  function updateTotalValues(newTotalValues: BigNumber[]) {
    update(state => ({ ...state, totalValues: newTotalValues }));
  }

  function getSelectedSquare(): SVGRectElement | null {
    const state = get({ subscribe });
    return state.selectedSquare;
  }

  return {
    subscribe,
    set,
    update,
    setSvg,
    setSelectedSquare,
    updateCell,
    updateTotalValues,
    getSelectedSquare,
  };
}

export const canvasStore = createCanvasStore();
