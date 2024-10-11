// src/lib/polyflux/interfaces.ts
import type { Contract } from "ethers";
import type { Writable } from 'svelte/store';
import type BigNumber from "bignumber.js";

export interface Layer {
  owner: string;
  color: string;
}

export interface Cell {
  baseValue: BigNumber;
  layers: Layer[];
}

export interface Stage {
  isEnabled: boolean;
  cells: Cell[][];
}

export interface BlockchainState {
  stages: Stage[];
  totalValues: BigNumber[];
  loading: boolean;
  loadingProgress: number;
  loadingText: string;
  contracts: Contract[];
  websocketContracts: Contract[];
}


export interface BlockchainStore extends Writable<BlockchainState> {
  fetchStages: () => Promise<{ stages: Stage[], totalValues: BigNumber[] }>;
  buyLayers: (x: number, y: number, numLayersToAdd: number, color: string, stage: number) => Promise<void>;
  getSelectedCellLayers: () => Layer[];
  getSelectedCellValue: () => BigNumber;
  calculateTotalValueToSend: (numLayersToAdd: BigNumber, baseValue: BigNumber) => BigNumber;
}

export interface CanvasState {
  stages: Stage[];
  totalValues: BigNumber[];
  selectedSquare: SVGRectElement | null;
  svg: SVGSVGElement | null;
}


export interface CanvasStore extends Writable<CanvasState> {
  updateCellColor(x: number, y: number, stage: number, selectedColor: string): unknown;
  setSvg: (svg: SVGSVGElement | null) => void;
  setSelectedSquare: (square: SVGRectElement | null) => void;
  updateCell: (buyer: string, x: number, y: number, numLayers: number, color: string, stageIndex: number) => void;
  updateTotalValues: (newTotalValues: BigNumber[]) => void;
  getSelectedSquare: () => SVGRectElement | null;
}