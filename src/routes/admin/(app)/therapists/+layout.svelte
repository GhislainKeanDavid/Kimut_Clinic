<script>
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { Search, ChevronRight, MoreVertical, BadgeCheck } from 'lucide-svelte';
	import { colorForTherapist } from '$lib/therapistColors.js';

	let { children } = $props();

	const admin = getContext('admin');

	let searchQuery = $state('');

	let filteredTherapists = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		const list = admin.therapists ?? [];
		if (!q) return list;
		return list.filter(
			(t) =>
				t.full_name?.toLowerCase().includes(q) ||
				t.specialty?.toLowerCase().includes(q) ||
				t.slug?.toLowerCase().includes(q)
		);
	});

	function initials(name) {
		if (!name) return '?';
		// Strip 'Dr.' prefix so "Dr. Reyes" → "R", not "DR"
		const cleaned = name.replace(/^Dr\.?\s+/i, '').trim();
		return cleaned
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((s) => s[0]?.toUpperCase() ?? '')
			.join('');
	}

	let selectedSlug = $derived(page.params.slug ?? null);
</script>

<div class="flex flex-1 overflow-hidden">
	<!-- Therapist roster -->
	<aside
		class="w-[280px] flex-shrink-0 flex flex-col bg-white border-r border-Mist/60 overflow-hidden"
	>
		<!-- Header -->
		<div class="px-5 pt-6 pb-4 flex-shrink-0">
			<div class="flex items-center justify-between mb-3">
				<h2 class="font-serif text-lg italic text-Dark">Therapists</h2>
				<button
					class="rounded-md p-1 text-Dark/30 hover:bg-Mist/40 hover:text-Dark/60 transition-colors"
					aria-label="Search"
				>
					<Search class="h-3.5 w-3.5" />
				</button>
			</div>
			<div class="relative">
				<Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-Dark/35" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search…"
					class="w-full rounded-lg border border-Mist/60 bg-Mist/10 pl-7 pr-3 py-1.5 font-mono text-[11px] text-Dark placeholder:text-Dark/30 outline-none focus:border-Primary/50 focus:ring-1 focus:ring-Primary/20 transition-colors"
				/>
			</div>
		</div>

		<!-- Roster -->
		<div class="flex-1 overflow-y-auto px-3 pb-5 space-y-2">
			{#each filteredTherapists as therapist (therapist.id)}
				{@const isSelected = selectedSlug === therapist.slug}
				{@const c = colorForTherapist(therapist)}
				<a
					href={`/admin/therapists/${therapist.slug}`}
					class="block rounded-xl border p-3 transition-all group
						{isSelected
						? 'border-Primary/40 bg-Primary/[0.04] shadow-sm'
						: 'border-Mist/60 bg-white hover:border-Mist hover:bg-Mist/10'}"
					aria-current={isSelected ? 'page' : undefined}
				>
					<div class="flex items-start gap-2.5">
						<div class="relative flex-shrink-0">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold {c.softBg} {c.softText}"
							>
								{initials(therapist.full_name)}
							</div>
							{#if therapist.active}
								<BadgeCheck class="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-green-500 fill-white" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[13px] font-medium text-Dark leading-tight truncate">
								{therapist.full_name}
							</p>
							<p class="font-mono text-[10px] text-Dark/45 mt-1 truncate">
								{therapist.specialty ?? '—'}
							</p>
						</div>
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							class="rounded-md p-1 text-Dark/30 hover:bg-Mist/40 hover:text-Dark/60 transition-colors opacity-0 group-hover:opacity-100"
							aria-label="Therapist options"
						>
							<MoreVertical class="h-3 w-3" />
						</button>
					</div>
					<div class="flex justify-end mt-1.5 -mr-1">
						<ChevronRight
							class="h-3.5 w-3.5 transition-colors {isSelected
								? 'text-Primary'
								: 'text-Dark/25 group-hover:text-Dark/50'}"
						/>
					</div>
				</a>
			{:else}
				<div class="px-3 py-10 text-center">
					<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/35">
						{searchQuery ? 'No matches' : 'No therapists yet'}
					</p>
				</div>
			{/each}
		</div>
	</aside>

	<!-- Therapist detail (or empty state) -->
	<section class="flex-1 overflow-y-auto bg-Background">
		{@render children()}
	</section>
</div>
