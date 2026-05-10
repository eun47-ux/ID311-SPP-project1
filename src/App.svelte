<script>
	import { onMount, onDestroy } from 'svelte';
	import { mountP5Game } from './p5/gameSketch.js';

	let host;
	/** @type {{ remove: () => void } | null} */
	let p5api = null;

	onMount(() => {
		if (host) {
			p5api = mountP5Game(host);
		}
	});

	onDestroy(() => {
		p5api?.remove();
		p5api = null;
	});
</script>

<main class="wrap">
	<p class="note">Full screen is the p5 canvas. Use START / RESTART on the canvas.</p>
	<div class="canvas-host" bind:this={host} />
</main>

<style>
	.wrap {
		min-height: 100vh;
		margin: 0;
		padding: 0.5rem;
		background: #1a1c1a;
		font-family: 'Press Start 2P', monospace;
	}

	.note {
		color: #9a9e96;
		font-size: 0.55rem;
		line-height: 1.5;
		max-width: 640px;
		margin: 0 auto 0.5rem;
		text-align: center;
	}

	.canvas-host {
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}

	.canvas-host :global(canvas) {
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
	}
</style>
