// CanvasManager.ts
import { get } from 'svelte/store';
import { canvasStore } from '../stores/canvasStore';
import { CANVAS_CONFIG, STAGE_DISABLED_HEIGHT, STAGE_THRESHOLDS } from '../canvasConfig';
import { fromGweiToMatic } from '../utils';
import stage2LockedImage from '../assets/stage2_locked.jpg';
import stage3LockedImage from '../assets/stage3_locked.jpg';
import type { Cell, Stage } from '$lib/polyflux/interfaces';
import { colorStore } from '$lib/polyflux/stores/colorStore';

export class CanvasManager {
  svg: SVGSVGElement;
  canvasContainer: HTMLDivElement;
  private unsubscribeColorStore: () => void;


  constructor(canvasContainer: HTMLDivElement) {
    this.canvasContainer = canvasContainer;
    this.svg = this.createSVG();
    this.canvasContainer.appendChild(this.svg);
    canvasStore.setSvg(this.svg);

    // Subscribe to colorStore changes
    this.unsubscribeColorStore = colorStore.subscribe(() => {
      this.updateSelectedSquareColor();
    });
  }

  createSVG(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "polyflux-svg");
    svg.style.backgroundColor = CANVAS_CONFIG.BACKGROUND_COLOR;
    return svg;
  }

  updateCanvas(): void {
    const { stages, totalValues } = get(canvasStore);
    this.svg.innerHTML = '';  // Clear the SVG
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
  }

  setCanvasDimensions(stages: Stage[]): void {
    const gridWidth = this.getGridWidth(stages);
    const totalHeight = this.getTotalHeight(stages);
    this.svg.setAttribute("width", `${gridWidth * CANVAS_CONFIG.CELL_SIZE}`);
    this.svg.setAttribute("height", `${totalHeight * CANVAS_CONFIG.CELL_SIZE}`);
  }
  setupCanvasContent(allCells: Cell[][], yOffset: number, stage: number): void {
    const gridHeight = allCells.length;
    const gridWidth = allCells[0].length;
  
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        let cell = allCells[y][x];
        let fillColor = cell.layers.length > 0 ? cell.layers[cell.layers.length - 1].color : "#000";
  
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", `${x * CANVAS_CONFIG.CELL_SIZE}`);
        rect.setAttribute("y", `${(y + yOffset) * CANVAS_CONFIG.CELL_SIZE}`);
        rect.setAttribute("width", `${CANVAS_CONFIG.CELL_SIZE}`);
        rect.setAttribute("height", `${CANVAS_CONFIG.CELL_SIZE}`);
        rect.setAttribute("fill", fillColor);
        rect.setAttribute("stroke", CANVAS_CONFIG.GRID_COLOR);
        rect.setAttribute("data-gridX", x.toString());
        rect.setAttribute("data-gridY", y.toString());
        rect.setAttribute("data-stage", stage.toString());
        rect.setAttribute("data-yOffset", yOffset.toString());
        rect.setAttribute("data-originalFill", fillColor);
        
        // Check if baseValue exists before setting it as an attribute
        if (cell.baseValue !== undefined) {
          rect.setAttribute("data-squareValue", cell.baseValue.toString());
        } else {
          rect.setAttribute("data-squareValue", "0");
        }
        
        rect.setAttribute("data-squareLayers", JSON.stringify(cell.layers));

        rect.addEventListener('mousedown', (e) => this.handleSquareClick(e, x, y, stage));
        rect.addEventListener('mouseover', () => this.handleSquareHover(rect));
        rect.addEventListener('mouseout', () => this.handleSquareHoverOut(rect));
        this.svg.appendChild(rect);
      }
    }
  }
  setupDisabledStageContent(stageIndex: number, yOffset: number, totalValues: any[]): void {
    const imageUrl = stageIndex === 1 ? stage2LockedImage : stage3LockedImage;
    const gridWidth = this.getGridWidth(get(canvasStore).stages);
  
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttribute("href", imageUrl);
    img.setAttribute("x", "0");
    img.setAttribute("y", `${yOffset * CANVAS_CONFIG.CELL_SIZE}`);
    img.setAttribute("width", `${gridWidth * CANVAS_CONFIG.CELL_SIZE}`);
    img.setAttribute("height", `${STAGE_DISABLED_HEIGHT * CANVAS_CONFIG.CELL_SIZE}`);
    this.svg.appendChild(img);

    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    overlay.setAttribute("x", "0");
    overlay.setAttribute("y", `${yOffset * CANVAS_CONFIG.CELL_SIZE}`);
    overlay.setAttribute("width", `${gridWidth * CANVAS_CONFIG.CELL_SIZE}`);
    overlay.setAttribute("height", `${STAGE_DISABLED_HEIGHT * CANVAS_CONFIG.CELL_SIZE}`);
    overlay.setAttribute("fill", "rgba(0, 0, 0, 0.5)");
    this.svg.appendChild(overlay);

    const middleY = yOffset * CANVAS_CONFIG.CELL_SIZE + (STAGE_DISABLED_HEIGHT * CANVAS_CONFIG.CELL_SIZE / 2);
    const labelLeftPosition = gridWidth * CANVAS_CONFIG.CELL_SIZE * 0.5;
    
    this.createTextLabel(`STAGE ${stageIndex + 1}`, {
      x: labelLeftPosition,
      y: middleY - 140,
      fontSize: 60,
      fill: 'white'
    }, 'stageLabel');

    const notEnabledLabel = this.createTextLabel('Locked', {
      x: labelLeftPosition,
      y: middleY + 60,
      fontSize: 60,
      fill: 'red'
    }, 'lockedLabel');

    const stage1Value = Number(fromGweiToMatic(totalValues[0]));
    const stage2Value = Number(fromGweiToMatic(totalValues[1]));
    const requiredTotalValueText = this.getRequiredTotalValueText(stageIndex, stage1Value, stage2Value);
    if (this.isStageCompleted(stageIndex, stage1Value, stage2Value)) {
      notEnabledLabel.textContent = 'Waiting for owner unlock';
      notEnabledLabel.setAttribute('fill', 'green');
    }

    this.createTextLabel(requiredTotalValueText, {
      x: labelLeftPosition,
      y: middleY - 50,
      fontSize: 30,
      fill: 'yellow'
    }, 'requiredLabel');
  }
  
  resizeCanvas = (sidebarWidth: number): void => {
    if (this.canvasContainer && this.svg) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      const gridWidth = this.getGridWidth(get(canvasStore).stages);
      const gridHeight = this.getTotalHeight(get(canvasStore).stages);
      
      const canvasWidth = gridWidth * CANVAS_CONFIG.CELL_SIZE;
      const canvasHeight = gridHeight * CANVAS_CONFIG.CELL_SIZE;
  
      this.svg.setAttribute("width", `${canvasWidth}`);
      this.svg.setAttribute("height", `${canvasHeight}`);
  
      const availableWidth = windowWidth - sidebarWidth;
      const availableHeight = windowHeight;
  
      const scaleX = availableWidth / canvasWidth;
      const scaleY = availableHeight / canvasHeight;
      const scale = Math.min(scaleX, scaleY, 1);
  
      const translateX = (availableWidth - canvasWidth * scale) / 2;
      const translateY = (availableHeight - canvasHeight * scale) / 2;
  
      this.svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      this.svg.style.transformOrigin = "top left";
  
      this.canvasContainer.style.width = `${availableWidth}px`;
      this.canvasContainer.style.height = `${availableHeight}px`;
    }
  }



  handleSquareClick = (e: MouseEvent, x: number, y: number, stage: number): void => {

    const clickedSquare = e.target as SVGRectElement;
    if (!clickedSquare) return;
  
    // Remove the border from the previously selected square
    if (clickedSquare) {
      clickedSquare.setAttribute("stroke-width", "1");
      clickedSquare.setAttribute("stroke", CANVAS_CONFIG.GRID_COLOR);
    }
  
    clickedSquare.setAttribute("stroke-width", "3");
    clickedSquare.setAttribute("stroke", "#FFFF00");  // Yellow border for selected cell
  
    const cell = get(canvasStore).stages[stage].cells[y][x];
    const lastLayer = cell.layers[cell.layers.length - 1];
    const color = lastLayer ? lastLayer.color : "#000000";
  
    canvasStore.setSelectedSquare(clickedSquare);
    colorStore.set(color);  // Set the color to the last layer's color
  }
  
  handleSquareHover = (square: SVGRectElement): void => {
    const selectedSquare = get(canvasStore).selectedSquare;

    if (square !== selectedSquare) {
      square.setAttribute("stroke-width", "2");
      square.setAttribute("stroke", "#FFFF00");  // Hover color
    }
  }
  
  handleSquareHoverOut = (square: SVGRectElement): void => {
    const selectedSquare = get(canvasStore).selectedSquare;

    if (square !== selectedSquare) {
      square.setAttribute("stroke-width", "1");
      square.setAttribute("stroke", CANVAS_CONFIG.GRID_COLOR);
    }
  }

  updateSelectedSquareColor = (): void => {
    const selectedSquare = get(canvasStore).selectedSquare;
    const selectedColor = get(colorStore);
    if (selectedSquare) {
      const x = parseInt(selectedSquare.getAttribute('data-gridX') || '0', 10);
      const y = parseInt(selectedSquare.getAttribute('data-gridY') || '0', 10);
      const stage = parseInt(selectedSquare.getAttribute('data-stage') || '0', 10);
      
      try {
        // Update the canvasStore with the new color
        canvasStore.updateCellColor(x, y, stage, selectedColor);
        
        // After updating the store, redraw the entire canvas
        this.updateCanvas();
      } catch (error) {
        console.error('Error updating cell color:', error);
      }
    }
  }
  
  getGridWidth(stages: Stage[]): number {
    return stages[0]?.cells[0]?.length || 0;
  }

  getTotalHeight(stages: Stage[]): number {
    const contentHeight = stages.reduce((acc, stage) => acc + stage.cells.length, 0);
    const hasDisabledStage = stages.some(stage => !stage.isEnabled);
    return contentHeight + (hasDisabledStage ? STAGE_DISABLED_HEIGHT : 0);
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

  createTextLabel(text: string, options: { x: number, y: number, fontSize: number, fill: string }, id?: string): SVGTextElement {
    const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textElement.setAttribute("x", options.x.toString());
    textElement.setAttribute("y", options.y.toString());
    textElement.setAttribute("font-size", options.fontSize.toString());
    textElement.setAttribute("fill", options.fill);
    textElement.setAttribute("text-anchor", "middle");
    textElement.setAttribute("font-family", "kirbyss");
    textElement.textContent = text;
    if (id) {
      textElement.id = id;
    }
    this.svg.appendChild(textElement);
    return textElement;
  }

  getTextLabelById(id: string): SVGTextElement | null {
    return this.svg.querySelector(`#${id}`);
  }

  dispose(): void {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
    canvasStore.setSvg(null);
    
    // Unsubscribe from colorStore
    if (this.unsubscribeColorStore) {
      this.unsubscribeColorStore();
    }
  }
}