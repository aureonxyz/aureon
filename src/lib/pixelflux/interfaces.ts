// src/lib/pixelflux/interfaces.ts
import type { fabric } from "fabric";
import type { Contract } from "ethers";
import type BigNumber from "bignumber.js";

export interface CustomRectOptions extends fabric.IRectOptions {
  gridX: number;
  gridY: number;
  stage: number;
  squareValue: number; 
  squareLayers: Layer[];
  originalFill: string;
  fill?: string; 
}



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

export interface TextLabelWithId extends fabric.Text {
  id?: string;
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
export interface CanvasState {
  stages: Stage[];
  totalValues: BigNumber[];
  selectedSquare: CustomRectOptions | null;
  canvas: fabric.Canvas | null;
}