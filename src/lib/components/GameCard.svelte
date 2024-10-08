<!-- src/lib/components/GameCard.svelte -->
<script lang="ts">
    import { fade, scale } from 'svelte/transition';
  
    export let game: {
      name: string;
      description: string;
      image: string;
      route: string;
    };
  </script>
  
  <a href={game.route} class="game-card" in:scale="{{ duration: 500, delay: 300 }}">
    <div class="image-container">
      <img src={game.image} alt={game.name} />
    </div>
    <div class="content">
      <h2>{game.name}</h2>
      <p>{game.description}</p>
    </div>
  </a>
  
  <style>
    .game-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
    }
  
    .game-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
  
    .image-container {
      height: 200px;
      overflow: hidden;
    }
  
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  
    .game-card:hover img {
      transform: scale(1.1);
    }
  
    .content {
      padding: 1rem;
    }
  
    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      color: #00ffff;
    }
  
    p {
      margin: 0;
      font-size: 0.9rem;
      color: #a0a0a0;
    }
  </style>
  