<script>
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { Search, ChevronRight, MoreVertical } from 'lucide-svelte';

	let { children } = $props();

	const admin = getContext('admin');

	let searchQuery = $state('');
	// 'all' | 'oldest' | 'newest'
	let sortMode = $state('all');

	const sortTabs = [
		{ id: 'all', label: 'All' },
		{ id: 'oldest', label: 'Oldest' },
		{ id: 'newest', label: 'Newest' }
	];

	// Patient queue is derived from confirmed leads, grouped by phone number.
	// Latest-by-created_at row wins for name/email/age (people occasionally update
	// these between bookings).
	let patients = $derived.by(() => {
		const byPhone = new Map();
		for (const lead of admin.leads) {
			if (!lead.phone_number) continue;
			const key = lead.phone_number;
			const created = new Date(lead.created_at).getTime();
			if (!byPhone.has(key)) {
				byPhone.set(key, {
					phone: key,
					full_name: lead.full_name,
					email: lead.email,
					age: lead.age,
					sources: new Set([lead.source ?? 'web']),
					first_seen: lead.created_at,
					last_seen: lead.created_at,
					booking_count: 1
				});
			} else {
				const p = byPhone.get(key);
				p.sources.add(lead.source ?? 'web');
				p.booking_count++;
				if (new Date(p.first_seen).getTime() > created) {
					p.first_seen = lead.created_at;
				}
				if (new Date(p.last_seen).getTime() < created) {
					p.last_seen = lead.created_at;
					p.full_name = lead.full_name ?? p.full_name;
					p.email = lead.email ?? p.email;
					p.age = lead.age ?? p.age;
				}
			}
		}
		return [...byPhone.values()];
	});

	let filteredPatients = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		let list = patients;
		if (q) {
			list = list.filter(
				(p) =>
					p.full_name?.toLowerCase().includes(q) ||
					p.phone?.toLowerCase().includes(q) ||
					p.email?.toLowerCase().includes(q)
			);
		}
		const sorted = [...list];
		if (sortMode === 'oldest') {
			sorted.sort((a, b) => new Date(a.first_seen) - new Date(b.first_seen));
		} else if (sortMode === 'newest') {
			sorted.sort((a, b) => new Date(b.first_seen) - new Date(a.first_seen));
		} else {
			// 'all' — most-recent activity first
			sorted.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));
		}
		return sorted;
	});

	function initials(name) {
		if (!name) return '?';
		return name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((s) => s[0]?.toUpperCase() ?? '')
			.join('');
	}

	// Stable avatar color per patient — derived from phone (the canonical patient id).
	const avatarPalette = [
		'bg-blue-100 text-blue-700',
		'bg-green-100 text-green-700',
		'bg-amber-100 text-amber-700',
		'bg-rose-100 text-rose-700',
		'bg-purple-100 text-purple-700',
		'bg-teal-100 text-teal-700'
	];
	function avatarColor(phone) {
		if (!phone) return avatarPalette[0];
		let hash = 0;
		for (let i = 0; i < phone.length; i++) hash = (hash * 31 + phone.charCodeAt(i)) >>> 0;
		return avatarPalette[hash % avatarPalette.length];
	}

	function formatRegisterDate(iso) {
		return new Date(iso).toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	let selectedPhone = $derived(page.params.phone ?? null);
</script>

<div class="flex flex-1 overflow-hidden">
	<!-- Patient Queue -->
	<aside
		class="w-[280px] flex-shrink-0 flex flex-col bg-white border-r border-Mist/60 overflow-hidden"
	>
		<!-- Header -->
		<div class="px-5 pt-6 pb-4 flex-shrink-0">
			<div class="flex items-center justify-between mb-3">
				<h2 class="font-serif text-lg italic text-Dark">Patient Queue</h2>
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

		<!-- Sort tabs -->
		<div class="px-5 pb-3 flex items-center gap-1 flex-shrink-0">
			{#each sortTabs as tab}
				<button
					onclick={() => (sortMode = tab.id)}
					class="rounded-lg px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors
						{sortMode === tab.id
						? 'bg-Primary text-white'
						: 'text-Dark/40 hover:bg-Mist/40 hover:text-Dark/70'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- Patient cards -->
		<div class="flex-1 overflow-y-auto px-3 pb-5 space-y-2">
			{#each filteredPatients as patient (patient.phone)}
				{@const isSelected = selectedPhone === patient.phone}
				<a
					href={`/admin/patients/${encodeURIComponent(patient.phone)}`}
					class="block rounded-xl border p-3 transition-all group
						{isSelected
						? 'border-Primary/40 bg-Primary/[0.04] shadow-sm'
						: 'border-Mist/60 bg-white hover:border-Mist hover:bg-Mist/10'}"
					aria-current={isSelected ? 'page' : undefined}
				>
					<div class="flex items-start gap-2.5">
						<div
							class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold {avatarColor(
								patient.phone
							)}"
						>
							{initials(patient.full_name)}
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[13px] font-medium text-Dark leading-tight truncate">
								{patient.full_name ?? 'Unnamed'}
							</p>
							<p class="font-mono text-[10px] text-Dark/45 mt-1 truncate">
								Since: {formatRegisterDate(patient.first_seen)}
							</p>
						</div>
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							class="rounded-md p-1 text-Dark/30 hover:bg-Mist/40 hover:text-Dark/60 transition-colors opacity-0 group-hover:opacity-100"
							aria-label="Patient options"
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
						{searchQuery ? 'No matches' : 'No patients yet'}
					</p>
				</div>
			{/each}
		</div>
	</aside>

	<!-- Patient detail (or empty state) -->
	<section class="flex-1 overflow-y-auto bg-Background">
		{@render children()}
	</section>
</div>
