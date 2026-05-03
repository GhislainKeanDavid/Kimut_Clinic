<script>
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { captureUTMs } from '$lib/analytics.js';

	let { children } = $props();

	onMount(() => {
		if (!page.url.pathname.startsWith('/admin')) {
			captureUTMs(page.url.href);
		}
	});
</script>

{@render children()}
