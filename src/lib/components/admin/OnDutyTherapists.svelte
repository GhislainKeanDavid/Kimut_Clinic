<script>
	import { getContext } from 'svelte';
	import { MoreVertical, BadgeCheck } from 'lucide-svelte';
	import { colorForTherapist } from '$lib/therapistColors.js';

	let { leads } = $props();

	const TIMEZONE = 'Asia/Manila';

	const admin = getContext('admin');

	// Hardcoded non-PT staff placeholder. Per the wave 3/4 plan we only have a
	// `therapists` table — non-PT roles can be promoted into the schema later.
	const staff = [
		{
			id: 'admin',
			name: 'Front Desk',
			role: 'Admin & Reception',
			initials: 'FD',
			color: 'bg-purple-100 text-purple-700'
		}
	];

	function initials(name) {
		if (!name) return '?';
		const cleaned = name.replace(/^Dr\.?\s+/i, '').trim();
		return cleaned
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 1)
			.map((s) => s[0]?.toUpperCase() ?? '')
			.join('');
	}

	function todayYmd() {
		return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
	}

	let todaysApptCountBySlug = $derived.by(() => {
		const t = todayYmd();
		const counts = {};
		for (const tx of admin.therapists ?? []) counts[tx.slug] = 0;
		for (const l of leads) {
			if (!l.datetime || !l.assigned_pt) continue;
			const d = new Date(l.datetime).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
			if (d !== t) continue;
			const slug = l.assigned_pt.toLowerCase();
			if (slug in counts) counts[slug]++;
		}
		return counts;
	});

	let therapists = $derived(admin.therapists ?? []);
</script>

<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="font-serif text-base italic text-Dark">On-Duty Today</h3>
		<span class="font-mono text-[9px] uppercase tracking-widest text-Dark/35">
			{therapists.length + staff.length} active
		</span>
	</div>

	<ul class="space-y-3">
		{#each therapists as t (t.id)}
			{@const count = todaysApptCountBySlug[t.slug] || 0}
			{@const c = colorForTherapist(t)}
			<li class="flex items-center gap-3">
				<div class="relative flex-shrink-0">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold {c.softBg} {c.softText}"
					>
						{initials(t.full_name)}
					</div>
					<BadgeCheck class="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-green-500 fill-white" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-[13px] font-medium text-Dark leading-tight truncate">{t.full_name}</p>
					<p class="font-mono text-[10px] text-Dark/45 mt-0.5">
						{t.specialty ?? 'PT'} · {count} appt{count === 1 ? '' : 's'}
					</p>
				</div>
				<a
					href={`/admin/therapists/${t.slug}`}
					class="rounded-md p-1 text-Dark/30 hover:bg-Mist/40 hover:text-Dark/60 transition-colors"
					aria-label="View {t.full_name}"
				>
					<MoreVertical class="h-3.5 w-3.5" />
				</a>
			</li>
		{/each}

		{#if staff.length > 0}
			<li class="pt-2 mt-1 border-t border-Mist/40">
				<p class="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-Dark/30">Staff</p>
			</li>
			{#each staff as s}
				<li class="flex items-center gap-3 -mt-1">
					<div class="relative flex-shrink-0">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold {s.color}"
						>
							{s.initials}
						</div>
						<BadgeCheck
							class="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-green-500 fill-white"
						/>
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-[13px] font-medium text-Dark leading-tight truncate">{s.name}</p>
						<p class="font-mono text-[10px] text-Dark/45 mt-0.5">{s.role}</p>
					</div>
				</li>
			{/each}
		{/if}
	</ul>
</div>
