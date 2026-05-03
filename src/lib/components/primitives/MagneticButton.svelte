<script>
	let { children, class: className = '', href = null, ...rest } = $props();
</script>

{#if href}
	<a
		{href}
		class="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-Accent text-Background transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-[1.025] hover:-translate-y-[1px] group {className}"
		{...rest}
	>
		<span class="absolute inset-0 translate-y-full bg-Primary transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-y-0"></span>
		<span class="relative z-10 px-8 py-4 font-sans font-medium">{@render children()}</span>
	</a>
{:else}
	<button
		class="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-Accent text-Background transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-[1.025] hover:-translate-y-[1px] group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 {className}"
		{...rest}
	>
		<span class="absolute inset-0 translate-y-full bg-Primary transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-y-0"></span>
		<span class="relative z-10 px-8 py-4 font-sans font-medium">{@render children()}</span>
	</button>
{/if}
