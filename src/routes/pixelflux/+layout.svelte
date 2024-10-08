<script lang="ts">
</script>

<svelte:head>
    <title>Pixelflux - Own Your Pixel Layer</title>
    <meta charset="UTF-8">
    <meta name="description" content="Pixelflux allows you to buy and own pixels. Become a permanent owner and earn as layers are added to your pixel.">
    <meta name="keywords" content="Pixelflux, Buy Pixels, Pixel Ownership, Pixel Layers">
    <meta name="author" content="Satoru Tamashi">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <meta property="og:title" content="Pixelflux - Own Your Pixel Layer">
    <meta property="og:description" content="Pixelflux allows you to buy and own pixels. Become a permanent owner and earn as layers are added to your pixel.">
    <meta property="og:image" content="/social_logo.jpg">
    <meta property="og:url" content="https://polygon.pixelflux.io">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Pixelflux - Own Your Pixel Layer">
    <meta name="twitter:description" content="Pixelflux allows you to buy and own pixels. Become a permanent owner and earn as layers are added to your pixel.">
    <meta name="twitter:image" content="/social_logo.jpg">
</svelte:head>

<div id="wrapper">
    <slot></slot>
</div>

<style>
    @font-face {
        font-family: 'kirbyss';
        src: url('/fonts/kirby.ttf');
    }

    :global(*) {
        font-family: 'kirbyss', Arial, sans-serif;
        line-height: 1.5em;
        letter-spacing: 0.1em;
    }

    :global(body), :global(html) {
        margin: 0;
        padding: 0;
        color: #fff;
        background: linear-gradient(45deg, #232335, #141414);
        height: 100%;
        overflow-x: hidden;
    }

    :global(h1), :global(h2), :global(h3) {
        font-family: 'kirbyss', Arial, sans-serif;
    }

    :global(#wrapper) {
        display: flex;
        height: 100%;
    }

    :global(a) {
        cursor: pointer;
        text-decoration: none;
        color: #a8a8f8;
        position: relative;
        transition: color 0.3s, transform 0.3s;
    }

    :global(a:before) {
        content: '';
        position: absolute;
        width: 100%;
        height: 0.1em;
        background: #a8a8f8;
        bottom: 0;
        left: 0;
        transform: scaleX(0);
        transform-origin: right;
        transition: transform 0.3s;
    }

    :global(a:hover) {
        color: #c9c9ff;
        transform: scale(1.05);
    }

    :global(a:hover:before) {
        transform: scaleX(1);
        transform-origin: left;
    }

    :global(a:active), :global(a:focus) {
        outline: none;
        color: #e1e1ff;
    }

    :global(.center) {
        text-align: center;
    }

    :global(::-webkit-scrollbar-track) {
        border-radius: 10px;
        background-color: #2c2c2c;
    }

    :global(::-webkit-scrollbar-thumb) {
        border-radius: 10px;
        background-color: #535;
        border: 2px solid #4c2c4c;
    }

    :global(::-webkit-scrollbar) {
        width: 10px;
    }

    :global(::-webkit-scrollbar-thumb:hover) {
        background-color: #777;
    }

</style>
