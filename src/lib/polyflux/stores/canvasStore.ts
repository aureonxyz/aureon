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

  function setSvg(svg: SVGSVGElement | null) {
    update(state => ({ ...state, svg }));
  }

  function updateCellColor(x: number, y: number, stage: number, color: string) {
    update(state => {
      const newStages = state.stages.map((s, i) => {
        if (i !== stage) return s;
        
        return {
          ...s,
          cells: s.cells.map((row, j) => {
            if (j !== y) return row;
            
            return row.map((cell, k) => {
              if (k !== x) return cell;
              
              const newLayers = cell.layers.length > 0
                ? [...cell.layers.slice(0, -1), { ...cell.layers[cell.layers.length - 1], color }]
                : [{ owner: '', color }];
              
              return { ...cell, layers: newLayers };
            });
          })
        };
      });
  
      return { ...state, stages: newStages };
    });
  }
  function setSelectedSquare(square: SVGRectElement | null) {
    update(state => {
      return { ...state, selectedSquare: square };
    });
  }

  function updateCell(buyer: string, x: number, y: number, numLayers: number, color: string, stageIndex: number) {
    update(state => {
      const newStages = state.stages.map((stage, i) => {
        if (i !== stageIndex) return stage;
  
        return {
          ...stage,
          cells: stage.cells.map((row, j) => {
            if (j !== y) return row;
  
            return row.map((cell, k) => {
              if (k !== x) return cell;
  
              const newLayers = [...cell.layers];
              for (let i = 0; i < numLayers; i++) {
                newLayers.push({ owner: buyer, color });
              }
  
              return { ...cell, layers: newLayers };
            });
          })
        };
      });
  
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
    updateCellColor
  };
}

export const canvasStore = createCanvasStore();
