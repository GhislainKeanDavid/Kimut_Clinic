<script>
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { captureUTMs } from '$lib/analytics.js';
	import { PUBLIC_UMAMI_SCRIPT_URL, PUBLIC_UMAMI_WEBSITE_ID } from '$env/static/public';

	let { children } = $props();

	onMount(() => {
		if (!page.url.pathname.startsWith('/admin')) {
			captureUTMs(page.url.href);
		}
	});
</script>

<svelte:head>
	{#if !page.url.pathname.startsWith('/admin') && PUBLIC_UMAMI_SCRIPT_URL}
		<script defer src={PUBLIC_UMAMI_SCRIPT_URL} data-website-id={PUBLIC_UMAMI_WEBSITE_ID}></script>
	{/if}
</svelte:head>

{@render children()}
