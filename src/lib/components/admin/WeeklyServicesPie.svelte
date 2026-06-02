<script>
	let { leads } = $props();

	const TIMEZONE = 'Asia/Manila';

	function monStartOfWeek() {
		const x = new Date();
		x.setHours(0, 0, 0, 0);
		const day = x.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
		x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
		return x;
	}

	const PALETTE = [
		'#6366f1', // indigo
		'#ec4899', // pink
		'#10b981', // emerald
		'#f59e0b', // amber
		'#3b82f6', // blue
		'#8b5cf6', // violet
		'#14b8a6', // teal
		'#ef4444' // red
	];

	const weekData = $derived.by(() => {
		const monday = monStartOfWeek().getTime();
		const nextMon = monday + 7 * 24 * 60 * 60 * 1000;

		const inWeek = leads.filter((l) => {
			if (!l.datetime) return false;
			const t = new Date(l.datetime).getTime();
			return t >= monday && t < nextMon;
		});

		const byService = new Map();
		let done = 0;
		let pending = 0;
		for (const l of inWeek) {
			const svc = l.service || 'Unspecified';
			byService.set(svc, (byService.get(svc) || 0) + 1);
			if (l.attendance === 'attended') done++;
			else pending++;
		}

		const total = inWeek.length;
		const slices = Array.from(byService.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([name, count], i) => ({
				name,
				count,
				percent: total ? count / total : 0,
				color: PALETTE[i % PALETTE.length]
			}));

		return { total, done, pending, slices };
	});

	const RADIUS = 42;
	const STROKE = 14;
	const CIRC = 2 * Math.PI * RADIUS;

	const segments = $derived.by(() => {
		let offset = 0;
		const segs = [];
		for (const s of weekData.slices) {
			const len = s.percent * CIRC;
			segs.push({
				...s,
				dasharray: `${len} ${CIRC - len}`,
				dashoffset: -offset
			});
			offset += len;
		}
		return segs;
	});
</script>

<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="font-serif text-base italic text-Dark">Services This Week</h3>
		<span class="font-mono text-[9px] uppercase tracking-widest text-Dark/35">
			Mon – Sun
		</span>
	</div>

	<!-- Donut chart -->
	<div class="relative mx-auto mb-5 h-36 w-36">
		<svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
			<!-- Track ring -->
			<circle
				cx="50"
				cy="50"
				r={RADIUS}
				fill="none"
				stroke="#F3F0EC"
				stroke-width={STROKE}
			/>
			{#if weekData.total > 0}
				{#each segments as seg}
					<circle
						cx="50"
						cy="50"
						r={RADIUS}
						fill="none"
						stroke={seg.color}
						stroke-width={STROKE}
						stroke-dasharray={seg.dasharray}
						stroke-dashoffset={seg.dashoffset}
						stroke-linecap="butt"
					/>
				{/each}
			{/if}
		</svg>
		<!-- Center label -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<span class="font-sans text-2xl font-semibold leading-none text-Dark">
				{weekData.total}
			</span>
			<span class="mt-1 font-mono text-[8px] uppercase tracking-wider text-Dark/40">
				services
			</span>
		</div>
	</div>

	<!-- Legend -->
	{#if weekData.slices.length > 0}
		<ul class="mb-4 space-y-1.5">
			{#each weekData.slices as s}
				<li class="flex items-center gap-2 text-[11px]">
					<span
						class="h-2 w-2 flex-shrink-0 rounded-full"
						style="background:{s.color}"
					></span>
					<span class="flex-1 truncate text-Dark/70">{s.name}</span>
					<span class="font-mono text-[10px] text-Dark/40">{s.count}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mb-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-Dark/30">
			No appointments this week
		</p>
	{/if}

	<!-- Totals strip -->
	<div class="grid grid-cols-3 gap-2 rounded-xl border border-Mist/40 bg-Mist/15 p-3">
		<div>
			<p class="font-mono text-[9px] uppercase tracking-wider text-Dark/40">Total</p>
			<p class="font-sans text-lg font-semibold leading-tight text-Dark">{weekData.total}</p>
		</div>
		<div>
			<p class="font-mono text-[9px] uppercase tracking-wider text-emerald-700">Done</p>
			<p class="font-sans text-lg font-semibold leading-tight text-emerald-700">
				{weekData.done}
			</p>
		</div>
		<div>
			<p class="font-mono text-[9px] uppercase tracking-wider text-amber-700">Pending</p>
			<p class="font-sans text-lg font-semibold leading-tight text-amber-700">
				{weekData.pending}
			</p>
		</div>
	</div>
</div>
