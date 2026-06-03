<script>
	import { env } from '$env/dynamic/public';
</script>

<div class="flex flex-1 flex-col px-8 py-8">
	<div class="mb-6">
		<h1 class="font-serif text-2xl italic text-Dark mb-1">Funnel Analytics</h1>
		<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">Patient Management</p>
	</div>

	<iframe
		src={env.PUBLIC_UMAMI_SHARE_URL}
		title="Umami Analytics"
		class="w-full flex-1 rounded-2xl border border-Mist/60"
		style="min-height: 500px;"
		sandbox="allow-scripts allow-same-origin"
	></iframe>
</div>
