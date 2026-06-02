<script>
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { captureUTMs } from '$lib/analytics.js';
	import { env } from '$env/dynamic/public';

	let { children } = $props();

	onMount(() => {
		if (!page.url.pathname.startsWith('/admin')) {
			captureUTMs(page.url.href);
		}
	});
</script>

<svelte:head>
	{#if !page.url.pathname.startsWith('/admin') && env.PUBLIC_UMAMI_SCRIPT_URL}
		<script defer src={env.PUBLIC_UMAMI_SCRIPT_URL} data-website-id={env.PUBLIC_UMAMI_WEBSITE_ID}></script>
	{/if}
</svelte:head>

{@render children()}
