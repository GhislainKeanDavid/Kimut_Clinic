<script>
	import { UserSearch } from 'lucide-svelte';
</script>

<div class="flex h-full items-center justify-center px-8 py-12">
	<div class="flex flex-col items-center text-center max-w-sm">
		<div class="rounded-full bg-Mist/30 p-4 mb-4">
			<UserSearch class="h-6 w-6 text-Dark/40" />
		</div>
		<p class="font-serif text-xl italic text-Dark/70 mb-1">Select a patient</p>
		<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">
			Choose someone from the queue to view their profile
		</p>
	</div>
</div>
