<script>
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	let { leads } = $props();

	const TIMEZONE = 'Asia/Manila';
	const PT_SLUGS = ['reyes', 'santos', 'dizon'];
	const PT_LABELS = { reyes: 'Reyes', santos: 'Santos', dizon: 'Dizon' };
	const PT_COLORS = {
		reyes: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
		santos: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
		dizon: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
	};

	let weekOffset = $state(0);

	const weekDays = $derived.by(() => {
		const now = new Date();
		const dayOfWeek = now.getDay(); // 0=Sun
		const monday = new Date(now);
		monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
		monday.setHours(0, 0, 0, 0);
		return Array.from({ length: 6 }, (_, i) => {
			const d = new Date(monday);
			d.setDate(monday.getDate() + i);
			return d;
		});
	});

	const weekLabel = $derived.by(() => {
		const opts = { month: 'short', day: 'numeric' };
		const start = weekDays[0].toLocaleDateString('en-US', opts);
		const end = weekDays[5].toLocaleDateString('en-US', { ...opts, year: 'numeric' });
		return `${start} – ${end}`;
	});

	function dayStr(d) {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	const weekLeads = $derived.by(() => {
		const first = dayStr(weekDays[0]);
		const last = dayStr(weekDays[5]);
		return leads.filter((l) => {
			if (!l.datetime || !['pending_payment', 'confirmed'].includes(l.status) || !l.assigned_pt)
				return false;
			const d = new Date(l.datetime).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
			return d >= first && d <= last;
		});
	});

	function getLeadsForPtDay(pt, day) {
		const ds = dayStr(day);
		return weekLeads
			.filter((l) => {
				const ld = new Date(l.datetime).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
				return l.assigned_pt?.toLowerCase() === pt && ld === ds;
			})
			.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
	}

	function formatTime(datetimeStr) {
		return new Date(datetimeStr).toLocaleTimeString('en-US', {
			timeZone: TIMEZONE,
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function isToday(d) {
		const today = new Date();
		return (
			d.getDate() === today.getDate() &&
			d.getMonth() === today.getMonth() &&
			d.getFullYear() === today.getFullYear()
		);
	}
</script>

<div class="mx-auto w-full max-w-6xl px-8 py-8">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="font-serif text-2xl italic text-Dark mb-1">PT Schedules</h1>
			<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">
				Patient Management
			</p>
		</div>
		<div class="flex items-center gap-1">
			<button
				onclick={() => weekOffset--}
				class="rounded-lg p-2 text-Dark/40 hover:bg-Mist/50 hover:text-Dark transition-colors"
				aria-label="Previous week"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>
			<span class="font-mono text-xs text-Dark/60 min-w-[180px] text-center">{weekLabel}</span>
			<button
				onclick={() => weekOffset++}
				class="rounded-lg p-2 text-Dark/40 hover:bg-Mist/50 hover:text-Dark transition-colors"
				aria-label="Next week"
			>
				<ChevronRight class="h-4 w-4" />
			</button>
			{#if weekOffset !== 0}
				<button
					onclick={() => (weekOffset = 0)}
					class="ml-1 rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-Dark/40 hover:bg-Mist/50 hover:text-Dark transition-colors"
				>
					Today
				</button>
			{/if}
		</div>
	</div>

	<!-- Schedule grid -->
	<div class="overflow-x-auto rounded-2xl border border-Mist/60 bg-white shadow-sm">
		<div class="min-w-[640px]">
			<!-- PT column headers -->
			<div class="grid grid-cols-[72px_1fr_1fr_1fr] border-b border-Mist/60 bg-Mist/10">
				<div class="px-3 py-3"></div>
				{#each PT_SLUGS as pt}
					<div class="px-4 py-3 text-center border-l border-Mist/60">
						<span
							class="font-mono text-[11px] uppercase tracking-widest font-semibold {PT_COLORS[pt].text}"
						>
							{PT_LABELS[pt]}
						</span>
					</div>
				{/each}
			</div>

			<!-- Day rows -->
			{#each weekDays as day}
				{@const today = isToday(day)}
				<div
					class="grid grid-cols-[72px_1fr_1fr_1fr] border-b border-Mist/60 last:border-b-0 {today
						? 'bg-Accent/[0.03]'
						: ''}"
				>
					<!-- Day label -->
					<div
						class="flex flex-col items-center justify-start px-3 py-4 pt-4 border-r border-Mist/40"
					>
						<span class="font-mono text-[10px] uppercase tracking-wider text-Dark/35">
							{day.toLocaleDateString('en-US', { weekday: 'short' })}
						</span>
						<span
							class="font-mono text-sm font-semibold mt-1 {today ? 'text-Accent' : 'text-Dark/60'}"
						>
							{day.getDate()}
						</span>
					</div>

					<!-- Per-PT cells -->
					{#each PT_SLUGS as pt}
						{@const dayLeads = getLeadsForPtDay(pt, day)}
						<div class="px-3 py-3 border-l border-Mist/40 min-h-[72px]">
							{#if dayLeads.length === 0}
								<div class="flex h-full min-h-[48px] items-center justify-center">
									<span class="font-mono text-[10px] text-Dark/15">—</span>
								</div>
							{:else}
								<div class="space-y-1.5">
									{#each dayLeads as lead}
										<div
											class="rounded-lg border px-2.5 py-2 {PT_COLORS[pt].bg} {PT_COLORS[pt].border}"
										>
											<div class="font-mono text-[10px] font-semibold {PT_COLORS[pt].text}">
												{formatTime(lead.datetime)}
											</div>
											<div class="text-xs font-medium text-Dark/80 mt-0.5 truncate">
												{lead.full_name}
											</div>
											<div class="font-mono text-[10px] text-Dark/40 truncate">{lead.service}</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
