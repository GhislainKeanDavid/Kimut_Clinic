<script>
	import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-svelte';
	import { colorForService } from '$lib/serviceColors.js';

	let { leads } = $props();

	const TIMEZONE = 'Asia/Manila';
	const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const START_HOUR = 8;
	const END_HOUR = 17; // exclusive — last visible column is 16:00
	const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

	const PT_LIST = [
		{ id: 'all', label: 'All Therapists' },
		{ id: 'reyes', label: 'Dr. Reyes' },
		{ id: 'santos', label: 'Dr. Santos' },
		{ id: 'dizon', label: 'Dr. Dizon' }
	];

	let selectedPt = $state('all');
	let weekOffset = $state(0);

	const weekDays = $derived.by(() => {
		const now = new Date();
		const dow = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
		const monday = new Date(now);
		monday.setHours(0, 0, 0, 0);
		monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
		return Array.from({ length: 6 }, (_, i) => {
			const d = new Date(monday);
			d.setDate(monday.getDate() + i);
			return d;
		});
	});

	const weekLabel = $derived.by(() => {
		const o = { month: 'short', day: 'numeric' };
		return `${weekDays[0].toLocaleDateString('en-US', o)} – ${weekDays[5].toLocaleDateString(
			'en-US',
			{ ...o, year: 'numeric' }
		)}`;
	});

	function dayStr(d) {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function isToday(d) {
		const today = new Date();
		return (
			d.getDate() === today.getDate() &&
			d.getMonth() === today.getMonth() &&
			d.getFullYear() === today.getFullYear()
		);
	}

	const visibleLeads = $derived.by(() =>
		leads.filter((l) => {
			if (!l.datetime) return false;
			if (selectedPt !== 'all' && l.assigned_pt?.toLowerCase() !== selectedPt) return false;
			return true;
		})
	);

	// Bucket leads by `${YYYY-MM-DD}|${hour}` for O(1) cell lookup
	const cellMap = $derived.by(() => {
		const map = new Map();
		for (const l of visibleLeads) {
			const dt = new Date(l.datetime);
			const localDate = dt.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
			const localHour = parseInt(
				dt.toLocaleTimeString('en-GB', {
					timeZone: TIMEZONE,
					hour: '2-digit',
					hour12: false
				})
			);
			if (localHour < START_HOUR || localHour >= END_HOUR) continue;
			const key = `${localDate}|${localHour}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key).push(l);
		}
		return map;
	});

	function apptsFor(day, hour) {
		return cellMap.get(`${dayStr(day)}|${hour}`) ?? [];
	}
</script>

<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
	<!-- Header -->
	<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
		<h3 class="font-serif text-lg italic text-Dark">Schedule</h3>

		<div class="flex items-center gap-1 rounded-lg border border-Mist/60 px-2 py-1">
			<button
				onclick={() => weekOffset--}
				class="rounded p-1 text-Dark/40 hover:bg-Mist/40 hover:text-Dark transition-colors"
				aria-label="Previous week"
			>
				<ChevronLeft class="h-3.5 w-3.5" />
			</button>
			<span class="font-mono text-[11px] text-Dark/60 min-w-[150px] text-center">
				{weekLabel}
			</span>
			<button
				onclick={() => weekOffset++}
				class="rounded p-1 text-Dark/40 hover:bg-Mist/40 hover:text-Dark transition-colors"
				aria-label="Next week"
			>
				<ChevronRight class="h-3.5 w-3.5" />
			</button>
		</div>
	</div>

	<!-- Therapist dropdown -->
	<div class="mb-4 flex items-center gap-2">
		<span class="font-mono text-[9px] uppercase tracking-[0.2em] text-Dark/30">Therapist</span>
		<div class="relative inline-block">
			<select
				bind:value={selectedPt}
				class="appearance-none rounded-lg border border-Mist/60 bg-white pl-3 pr-8 py-1.5 font-mono text-[11px] text-Dark outline-none cursor-pointer hover:bg-Mist/30 focus:border-Primary/50 focus:ring-1 focus:ring-Primary/20 transition-colors"
			>
				{#each PT_LIST as pt}
					<option value={pt.id}>{pt.label}</option>
				{/each}
			</select>
			<ChevronDown
				class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-Dark/40"
			/>
		</div>
	</div>

	<!-- Schedule grid -->
	<div class="overflow-x-auto">
		<div
			class="grid min-w-[760px] gap-0"
			style="grid-template-columns: 60px repeat({HOURS.length}, minmax(0, 1fr));"
		>
			<!-- Hour header row -->
			<div class="border-b border-Mist/40"></div>
			{#each HOURS as h}
				<div
					class="border-b border-l border-Mist/40 px-1 py-2 text-center font-mono text-[10px] text-Dark/40"
				>
					{String(h).padStart(2, '0')}:00
				</div>
			{/each}

			<!-- Day rows -->
			{#each weekDays as day, di}
				<div
					class="flex items-center border-Mist/40 px-2 py-3 font-mono text-[10px] uppercase tracking-[0.15em]
						{di === 0 ? '' : 'border-t'}
						{isToday(day) ? 'text-Primary font-medium' : 'text-Dark/50'}"
				>
					{DAY_LABELS[di]}
				</div>
				{#each HOURS as h}
					{@const appts = apptsFor(day, h)}
					<div
						class="border-l border-Mist/40 p-1 min-h-[52px]
							{di === 0 ? '' : 'border-t'}
							{isToday(day) ? 'bg-Primary/[0.02]' : ''}"
					>
						{#if appts.length > 0}
							<div class="flex h-full flex-col gap-1">
								{#each appts as a}
									{@const c = colorForService(a.service)}
									<div
										class="relative overflow-hidden rounded-md text-[10px] font-medium leading-tight text-Dark/85 {c.bgClass}"
										title={`${a.full_name ?? 'Patient'} · ${a.service ?? 'Service'} · ${a.assigned_pt ? 'Dr. ' + a.assigned_pt.charAt(0).toUpperCase() + a.assigned_pt.slice(1) : 'Unassigned'}`}
									>
										<span
											class="absolute inset-y-0 left-0 w-[3px]"
											style="background:{c.hex};"
										></span>
										<span class="block truncate py-1.5 pl-2.5 pr-1.5">
											{a.service ?? 'Service'}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/each}
		</div>
	</div>
</div>
