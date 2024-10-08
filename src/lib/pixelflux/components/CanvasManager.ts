import { fabric } from 'fabric';
import { CANVAS_CONFIG, STAGE_DISABLED_HEIGHT, STAGE_THRESHOLDS } from '../canvasConfig';
import type { Stage, CustomRectOptions, Cell, TextLabelWithId } from '../interfaces';
import { fromGweiToMatic } from '../utils';
import stage2LockedImage from '../assets/stage2_locked.jpg';
import stage3LockedImage from '../assets/stage3_locked.jpg';
import { canvasStore } from '../stores/canvasStore';
import { get } from 'svelte/store';

export class CanvasManager {
  canvas: fabric.Canvas;
  canvasContainer: HTMLDivElement;

  constructor(canvasContainer: HTMLDivElement) {
    this.canvasContainer = canvasContainer;
    this.canvas = this.createCanvas();
  }

  createCanvas(): fabric.Canvas {
    const canvas = new fabric.Canvas('pixelflux-canvas');
    canvas.backgroundColor = CANVAS_CONFIG.BACKGROUND_COLOR;
    canvas.renderAll();
    return canvas;
  }

  updateCanvas(stages: Stage[], totalValues: any[]): void {
    this.canvas.clear();
    this.setCanvasDimensions(stages);

    let yOffset = 0;
    for (const [index, stage] of stages.entries()) {
      if (stage.isEnabled) {
        this.setupCanvasContent(stage.cells, yOffset, index);
        yOffset += stage.cells.length;
      } else {
        this.setupDisabledStageContent(index, yOffset, totalValues);
        break;
      }
    }
    this.resizeCanvas();
  }

  setCanvasDimensions(stages: Stage[]): void {
    const gridWidth = this.getGridWidth(stages);
    const totalHeight = this.getTotalHeight(stages);
    this.canvas.setWidth(gridWidth * CANVAS_CONFIG.CELL_SIZE);
    this.canvas.setHeight(totalHeight * CANVAS_CONFIG.CELL_SIZE);
  }

  setupCanvasContent(allCells: Cell[][], yOffset: number, stage: number): void {
    const gridHeight = allCells.length;
    const gridWidth = allCells[0].length;
    const gridImageUrl = this.generateGridImage(gridWidth, gridHeight);
    this.canvas.setBackgroundColor(gridImageUrl, () => this.canvas.renderAll());
    this.canvas.backgroundColor = "#000";

    const squares: fabric.Rect[] = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        let fillColor = "#000";
        let cell = allCells[y][x];
        let currentValue = Number(fromGweiToMatic(cell.baseValue));
        if (cell.layers.length > 0) {
          fillColor = cell.layers[cell.layers.length - 1].color;
        }
        const square = new fabric.Rect({
          width: CANVAS_CONFIG.CELL_SIZE,
          height: CANVAS_CONFIG.CELL_SIZE,
          stroke: CANVAS_CONFIG.GRID_COLOR,
          fill: fillColor,
          lockMovementX: true,
          lockMovementY: true,
          hasControls: false,
          hoverCursor: 'pointer',
          squareLayers: cell.layers,
          gridX: x,
          gridY: y,
          stage: stage,
          yOffset: yOffset,
          top: (CANVAS_CONFIG.CELL_SIZE * y) + (yOffset * CANVAS_CONFIG.CELL_SIZE),
          left: (CANVAS_CONFIG.CELL_SIZE * x),
          originalFill: fillColor,
          squareValue: currentValue,
        } as fabric.IRectOptions & CustomRectOptions);

        square.on('mousedown', (e) => this.handleSquareClick(e));
        squares.push(square);
      }
    }
    this.canvas.add(...squares);
    this.canvas.renderAll();
  }

  setupDisabledStageContent(stageIndex: number, yOffset: number, totalValues: any[]): void {
    const imageUrl = stageIndex === 1 ? stage2LockedImage : stage3LockedImage;
    const gridWidth = this.getGridWidth(get(canvasStore).stages);
  
    fabric.Image.fromURL(imageUrl, (img) => {
      if (!img) {
        console.error(`Failed to load image for stage ${stageIndex + 1}`);
        return;
      }
  
      const scaleFactor = (STAGE_DISABLED_HEIGHT * CANVAS_CONFIG.CELL_SIZE) / (img.height || 1);
  
      img.set({
        left: 0,
        top: yOffset * CANVAS_CONFIG.CELL_SIZE,
        selectable: false,
        scaleX: scaleFactor,
        scaleY: scaleFactor
      });
  
      const overlayRect = new fabric.Rect({
        left: -1,
        top: img.top ?? 0,
        width: ((img.width ?? 100) * scaleFactor) + 2,
        height: ((img.height ?? 100) * scaleFactor),
        fill: 'rgba(0, 0, 0, 0.5)',
        selectable: false
      });
  
      this.canvas.add(img, overlayRect);
  
      const middleY = (img.top ?? 0) + ((img.height ?? 100) * scaleFactor) / 2;
      const labelLeftPosition = gridWidth * CANVAS_CONFIG.CELL_SIZE * 0.5;
      
      const stageLabel = this.createTextLabel(`STAGE ${stageIndex + 1}`, {
        left: labelLeftPosition,
        top: middleY - 140,
        fontSize: 60,
        fill: 'white'
      }, 'stageLabel');
  
      const notEnabledLabel = this.createTextLabel('Locked', {
        left: labelLeftPosition,
        top: middleY + 60,
        fontSize: 60,
        fill: 'red'
      }, 'lockedLabel');
  
      const stage1Value = Number(fromGweiToMatic(totalValues[0]));
      const stage2Value = Number(fromGweiToMatic(totalValues[1]));
      const requiredTotalValueText = this.getRequiredTotalValueText(stageIndex, stage1Value, stage2Value);
      if (this.isStageCompleted(stageIndex, stage1Value, stage2Value)) {
        notEnabledLabel.text = 'Waiting for owner unlock';
        notEnabledLabel.fill = 'green';
      }
  
      const requiredValueLabel = this.createTextLabel(requiredTotalValueText, {
        left: labelLeftPosition,
        top: middleY - 50,
        fontSize: 30,
        fill: 'yellow'
      }, 'requiredLabel');
  
      this.canvas.add(stageLabel, notEnabledLabel, requiredValueLabel);
      this.canvas.renderAll();
  
      console.log(`Disabled stage ${stageIndex + 1} content added to canvas`);
    });
  }
  resizeCanvas = (): void => {
    if (this.canvasContainer && this.canvas) {
      const { clientWidth: containerWidth, clientHeight: containerHeight } = this.canvasContainer;
      const sidebarWidth = 260; // Width of the sidebar
      
      const gridWidth = this.getGridWidth(get(canvasStore).stages);
      const gridHeight = this.getTotalHeight(get(canvasStore).stages);
      
      // Calculate available width for canvas
      const availableWidth = containerWidth - sidebarWidth;
      
      // Calculate scale based on available width
      const scale = availableWidth / (gridWidth * CANVAS_CONFIG.CELL_SIZE);
      
      // Set canvas dimensions
      const canvasWidth = availableWidth;
      const canvasHeight = Math.min(containerHeight, gridHeight * CANVAS_CONFIG.CELL_SIZE * scale);
      
      this.canvas.setWidth(canvasWidth);
      this.canvas.setHeight(canvasHeight);
      this.canvas.setZoom(scale);
      
      // Align top-left
      const vpt = this.canvas.viewportTransform;
      if (vpt) {
        vpt[4] = 0; // Left align
        vpt[5] = 0; // Top align
      }
      
      this.canvas.renderAll();
      
      console.log(`Canvas resized to ${canvasWidth}x${canvasHeight} with zoom ${scale}`);
    }
  }
  handleSquareClick = (e: fabric.IEvent): void => {
    if (!e.target) return;
    const clickedSquare = e.target as fabric.Rect & CustomRectOptions;

    const currentState = get(canvasStore);
    if (currentState.selectedSquare && currentState.selectedSquare !== clickedSquare) {
      (currentState.selectedSquare as unknown as fabric.Rect).set('strokeWidth', 1);
      (currentState.selectedSquare as unknown as fabric.Rect).set('fill', currentState.selectedSquare.originalFill);
    }
    (clickedSquare as fabric.Rect).set('strokeWidth', 4);
    canvasStore.update(state => ({ ...state, selectedSquare: clickedSquare }));
  }

  getGridWidth(stages: Stage[]): number {
    const width = stages[0]?.cells[0]?.length || 0;
    return width;
  }

  getTotalHeight(stages: Stage[]): number {
    const contentHeight = stages.reduce((acc, stage) => acc + stage.cells.length, 0);
    const hasDisabledStage = stages.some(stage => !stage.isEnabled);
    const totalHeight = contentHeight + (hasDisabledStage ? STAGE_DISABLED_HEIGHT : 0);
    return totalHeight;
  }

  generateGridImage(gridWidth: number, gridHeight: number): string {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gridWidth * CANVAS_CONFIG.CELL_SIZE;
    tempCanvas.height = gridHeight * CANVAS_CONFIG.CELL_SIZE;

    const ctx = tempCanvas.getContext('2d')!; 

    for (let x = 0; x <= gridWidth; x += CANVAS_CONFIG.CELL_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridWidth);
    }

    for (let y = 0; y <= gridHeight; y += CANVAS_CONFIG.CELL_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(gridHeight, y);
    }

    ctx.stroke();

    return tempCanvas.toDataURL();
  }

  isStageCompleted(stageIndex: number, stage1Value: number, stage2Value: number): boolean {
    if (stageIndex === 1) {
      return stage1Value >= STAGE_THRESHOLDS.STAGE2_ACTIVATION;
    } else if (stageIndex === 2) {
      return stage1Value >= STAGE_THRESHOLDS.STAGE3_STAGE1_ACTIVATION && stage2Value >= STAGE_THRESHOLDS.STAGE3_STAGE2_ACTIVATION;
    }
    return false;
  }

  getRequiredTotalValueText(stageIndex: number, stage1Value: number, stage2Value: number): string {
    if (stageIndex === 1) {
      return this.isStageCompleted(stageIndex, stage1Value, stage2Value) ?
        "Requirement Completed" : 
        `Stage 1 Total Value: ${stage1Value}/${STAGE_THRESHOLDS.STAGE2_ACTIVATION} Matic`;
    } else if (stageIndex === 2) {
      const stage1Text = this.isStageCompleted(1, stage1Value, 0) ? 
        "Requirement 1 Completed" : 
        `Stage 1 Total Value: ${stage1Value}/${STAGE_THRESHOLDS.STAGE3_STAGE1_ACTIVATION} Matic`;

      const stage2Text = this.isStageCompleted(2, stage1Value, stage2Value) ?
        "Requirement 2 Completed" : 
        `Stage 2 Total Value: ${stage2Value}/${STAGE_THRESHOLDS.STAGE3_STAGE2_ACTIVATION} Matic`;

      return `${stage1Text}\n${stage2Text}`;
    }

    return "";
  }

  createTextLabel(text: string, options: fabric.ITextOptions, id?: string): fabric.Text {
    const defaultOptions = {
      fontFamily: 'kirbyss',
      originX: 'center',
      selectable: false
    };

    const textLabel: TextLabelWithId = new fabric.Text(text, { ...defaultOptions, ...options }) as TextLabelWithId;
    if (id) {
      textLabel.id = id;
    }
    return textLabel;
  }

  getTextLabelById(id: string): TextLabelWithId | undefined {
    const label = this.canvas.getObjects().find((obj: any) => obj.type === 'text' && obj.id === id) as TextLabelWithId;
    return label;
  }

  dispose(): void {
    console.log('CanvasManager: Disposing canvas');
    if (this.canvas) {
      this.canvas.dispose();
    }
  }
}