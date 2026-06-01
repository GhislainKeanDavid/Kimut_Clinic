<script>
	import { MoreVertical, BadgeCheck } from 'lucide-svelte';

	let { leads } = $props();

	const TIMEZONE = 'Asia/Manila';

	const therapists = [
		{
			id: 'reyes',
			name: 'Dr. Reyes',
			role: 'PT, Sports Rehab',
			initials: 'R',
			color: 'bg-blue-100 text-blue-700'
		},
		{
			id: 'santos',
			name: 'Dr. Santos',
			role: 'PT, Manual Therapy',
			initials: 'S',
			color: 'bg-green-100 text-green-700'
		},
		{
			id: 'dizon',
			name: 'Dr. Dizon',
			role: 'PT, Neuro Rehab',
			initials: 'D',
			color: 'bg-amber-100 text-amber-700'
		}
	];

	const staff = [
		{
			id: 'admin',
			name: 'Front Desk',
			role: 'Admin & Reception',
			initials: 'FD',
			color: 'bg-purple-100 text-purple-700'
		}
	];

	function todayYmd() {
		return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
	}

	const todaysApptCount = $derived.by(() => {
		const t = todayYmd();
		const counts = { reyes: 0, santos: 0, dizon: 0 };
		for (const l of leads) {
			if (!l.datetime || !l.assigned_pt) continue;
			const d = new Date(l.datetime).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
			if (d !== t) continue;
			const slug = l.assigned_pt.toLowerCase();
			if (slug in counts) counts[slug]++;
		}
		return counts;
	});
</script>

<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="font-serif text-base italic text-Dark">On-Duty Today</h3>
		<span class="font-mono text-[9px] uppercase tracking-widest text-Dark/35">
			{therapists.length + staff.length} active
		</span>
	</div>

	<ul class="space-y-3">
		{#each therapists as t}
			{@const count = todaysApptCount[t.id] || 0}
			<li class="flex items-center gap-3">
				<div class="relative flex-shrink-0">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold {t.color}"
					>
						{t.initials}
					</div>
					<BadgeCheck
						class="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-green-500 fill-white"
					/>
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-[13px] font-medium text-Dark leading-tight truncate">{t.name}</p>
					<p class="font-mono text-[10px] text-Dark/45 mt-0.5">
						{t.role} · {count} appt{count === 1 ? '' : 's'}
					</p>
				</div>
				<button
					class="rounded-md p-1 text-Dark/30 hover:bg-Mist/40 hover:text-Dark/60 transition-colors"
					aria-label="More options"
				>
					<MoreVertical class="h-3.5 w-3.5" />
				</button>
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
