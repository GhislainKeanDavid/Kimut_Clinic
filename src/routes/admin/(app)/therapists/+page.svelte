<script>
	import { Stethoscope } from 'lucide-svelte';
</script>

<div class="flex flex-1 flex-col px-8 py-8">
	<div class="mb-6">
		<h1 class="font-serif text-2xl italic text-Dark mb-1">Therapists</h1>
		<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">Patient Management</p>
	</div>

	<div
		class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-Mist/60 bg-white/40 py-24 text-center"
	>
		<div class="rounded-full bg-Mist/30 p-4 mb-4">
			<Stethoscope class="h-6 w-6 text-Dark/40" />
		</div>
		<p class="font-serif text-lg italic text-Dark/70 mb-1">Therapist directory coming soon</p>
		<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest max-w-md">
			Roster, schedules, and per-therapist profiles
		</p>
	</div>
</div>
