<script lang="ts">
  import { canvasStore } from '../stores/canvasStore';
  import { roundToTwoSignificantFigures } from '../utils';
  import type { Writable } from 'svelte/store';
  
  const ITEMS_PER_PAGE = 5;
  let currentPage = 1;
 
  $: pixelData = $canvasStore.selectedSquare 
    ? [...$canvasStore.selectedSquare.squareLayers].reverse().map((layer, index) => ({
        color: layer.color || "#000",
        value: roundToTwoSignificantFigures(
          $canvasStore.selectedSquare 
            ? $canvasStore.selectedSquare.squareValue * ($canvasStore.selectedSquare.squareLayers.length - index)
            : 0
        ),
        contractAddress: layer.owner
      })) 
    : [];
 
  $: displayedItems = pixelData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  $: totalPages = Math.ceil(pixelData.length / ITEMS_PER_PAGE);
 
  function prevPage() {
    if (currentPage > 1) currentPage--;
  }
 
  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }
 </script>
 
 <div class="history-card">
   <h2>History</h2>
   <ul id="history">
     {#each displayedItems as item}
       <li>
         <div class="color-circle" style="background-color: {item.color};"></div>
         <div class="purchase-info">
           Value: {item.value} <br/>
           {item.contractAddress.slice(0, 4)}...{item.contractAddress.slice(-4)}
         </div>
       </li>
     {/each}
   </ul>
   <div class="pagination">
     <button on:click={prevPage} disabled={currentPage === 1}>&laquo; Prev</button>
     <button on:click={nextPage} disabled={currentPage === totalPages}>Next &raquo;</button>
   </div>
 </div>
  <style>
    .history-card {
      border: 1px solid rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      transition: all 0.3s;
      background: linear-gradient(135deg, rgba(66, 45, 70, 1) 0%, rgba(90, 52, 87, 1) 100%);
    }
  
    .history-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
    }
  
    h2 {
      text-align: center;
      margin-bottom: 15px;
    }
  
    #history {
      list-style: none;
      padding: 0;
      position: relative;
    }
  
    #history::before {
      content: '';
      position: absolute;
      top: 0;
      left: 10px;
      width: 2px;
      height: 100%;
      background-color: #535;
    }
  
    #history li {
      display: flex;
      align-items: center;
      margin: 20px 0;
      position: relative;
    }
  
    #history li .color-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #e0e0e0;
      margin-right: 10px;
      z-index: 1;
    }
  
    #history li .purchase-info {
      flex-grow: 1;
      background: rgba(42, 42, 42, 0.5);
      padding: 5px 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
  
    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
  
    .pagination button {
      margin: 0 5px;
      background-color: #535;
      border: none;
      color: #e0e0e0;
      padding: 5px 10px;
      border-radius: 5px;
      transition: background-color 0.3s;
      cursor: pointer;
    }
  
    .pagination button:hover:not(:disabled) {
      background-color: #747;
    }

    .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media screen and (max-width: 520px) {
    .history-card {
      padding: 15px;
    }

    #history::before {
      left: 8px;
    }

    #history li .color-circle {
      width: 20px;
      height: 20px;
    }

    #history li .purchase-info {
      font-size: 0.9em;
    }

    .pagination button {
      padding: 3px 8px;
      font-size: 0.9em;
    }
  }
</style>