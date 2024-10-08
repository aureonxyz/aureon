<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import GameCard from '../lib/components/GameCard.svelte';
  import PixelfluxScreenshot from '../assets/pixelflux-screenshot.jpg'
  let visible = false;

  onMount(() => {
    visible = true;
  });

  const games = [
    {
      name: 'PixelFlux',
      description: 'A simple canvas on Polygon that lets users buy the top layers of pixels, choose the color, and earn anytime someone buys a pixel layer on top of yours.',
      image: PixelfluxScreenshot,
      route: '/pixelflux'
    }
    // Add more games here as needed
  ];
</script>

<svelte:head>
  <title>Aureon - Exploring Cosmic Digital Frontiers</title>
</svelte:head>

<main>
  {#if visible}
    <header in:fly="{{ y: -50, duration: 1000 }}">
      <h1>Aureon</h1>
      <p class="tagline">Exploring Cosmic Digital Frontiers</p>
    </header>

    <section class="game-grid" in:fade="{{ duration: 1500, delay: 500 }}">
      {#each games as game}
        <GameCard {game} />
      {/each}
    </section>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    color: #ffffff;
    min-height: 100vh;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 4rem;
  }

  h1 {
    font-size: 4rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(to right, #00ffff, #ff00ff);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  .tagline {
    font-size: 1.5rem;
    color: #a0a0a0;
  }

  .game-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 3rem;
    }

    .tagline {
      font-size: 1.2rem;
    }
  }
</style>