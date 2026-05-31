<script>
	import { Users, CalendarDays, AlertTriangle, Wallet } from 'lucide-svelte';

	let { leads, viewFilter = $bindable('all') } = $props();

	// All `leads` arriving here are already status='confirmed' (server-side filter).
	// Each metric computes against that scoped set.

	function monStartOfWeek(d) {
		const x = new Date(d);
		x.setHours(0, 0, 0, 0);
		const day = x.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
		const offset = day === 0 ? -6 : 1 - day;
		x.setDate(x.getDate() + offset);
		return x;
	}

	function startOfMonth(d) {
		const x = new Date(d);
		x.setHours(0, 0, 0, 0);
		x.setDate(1);
		return x;
	}

	let totalPatients = $derived(leads.length);

	let thisWeekCount = $derived.by(() => {
		const monday = monStartOfWeek(new Date()).getTime();
		const nextMon = monday + 7 * 24 * 60 * 60 * 1000;
		return leads.filter((l) => {
			if (!l.datetime) return false;
			const t = new Date(l.datetime).getTime();
			return t >= monday && t < nextMon;
		}).length;
	});

	let needsAttentionCount = $derived.by(() => {
		const now = Date.now();
		return leads.filter((l) => {
			if (!l.datetime) return false;
			const t = new Date(l.datetime).getTime();
			return t < now && (l.attendance ?? 'scheduled') === 'scheduled';
		}).length;
	});

	// Revenue: count only payment_amount on rows whose payment cleared in the window.
	// status_updated_at is when the row was last touched; for a confirmed row that's the
	// moment payment confirmed (the only legal transition into 'confirmed').
	function paidIn(startMs) {
		return leads
			.filter((l) => {
				const stamp = l.status_updated_at || l.created_at;
				return stamp && new Date(stamp).getTime() >= startMs;
			})
			.reduce((sum, l) => sum + (Number(l.payment_amount) || 0), 0);
	}

	let weeklyRevenue = $derived(paidIn(monStartOfWeek(new Date()).getTime()));
	let monthlyRevenue = $derived(paidIn(startOfMonth(new Date()).getTime()));

	function peso(n) {
		return `₱${Number(n || 0).toLocaleString('en-PH')}`;
	}

	const cards = $derived([
		{
			id: 'total',
			label: 'Total Patients',
			value: totalPatients,
			subline: 'lifetime confirmed',
			Icon: Users,
			filter: 'all'
		},
		{
			id: 'week',
			label: 'This Week',
			value: thisWeekCount,
			subline: 'appointments Mon–Sun',
			Icon: CalendarDays,
			filter: 'this_week'
		},
		{
			id: 'attention',
			label: 'Needs Attention',
			value: needsAttentionCount,
			subline:
				needsAttentionCount === 0
					? 'all marked'
					: needsAttentionCount === 1
						? '1 past appt unmarked'
						: `${needsAttentionCount} past appts unmarked`,
			Icon: AlertTriangle,
			filter: 'needs_attention',
			tone: needsAttentionCount > 0 ? 'warn' : 'neutral'
		},
		{
			id: 'revenue',
			label: 'Revenue',
			value: peso(weeklyRevenue),
			subline: `${peso(monthlyRevenue)} this month`,
			Icon: Wallet,
			filter: null
		}
	]);

	function handleClick(filter) {
		if (!filter) return;
		viewFilter = viewFilter === filter ? 'all' : filter;
	}
</script>

<div class="mb-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
	{#each cards as card}
		{@const isActive = card.filter && viewFilter === card.filter}
		{@const warn = card.tone === 'warn'}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			role={card.filter ? 'button' : 'article'}
			tabindex={card.filter ? 0 : undefined}
			onclick={() => handleClick(card.filter)}
			onkeydown={(e) => e.key === 'Enter' && handleClick(card.filter)}
			class="rounded-2xl border bg-white p-6 shadow-sm select-none transition-all duration-200
				{card.filter ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0' : ''}
				{isActive
					? 'border-Primary/40 ring-2 ring-Primary/15 shadow-md -translate-y-0.5'
					: warn
						? 'border-amber-300 ring-1 ring-amber-200/60'
						: 'border-Mist/60 hover:border-Mist'}"
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="font-mono text-[11px] uppercase tracking-widest text-Dark/45">{card.label}</h3>
				<card.Icon
					class="h-4 w-4 transition-colors {isActive
						? 'text-Primary'
						: warn
							? 'text-amber-600'
							: 'text-Dark/30'}"
				/>
			</div>
			<p class="font-sans text-3xl font-medium text-Dark mb-3 leading-none">{card.value}</p>
			<p class="font-mono text-[10px] uppercase tracking-wider {warn ? 'text-amber-700' : 'text-Dark/40'}">
				{card.subline}
			</p>
		</div>
	{/each}
</div>
