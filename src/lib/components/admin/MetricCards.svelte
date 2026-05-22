<script>
	import { Users, CheckCircle2, BarChart2, TrendingUp, Activity } from 'lucide-svelte';

	let { leads, filterStatus = $bindable('All') } = $props();

	let totalLeads = $derived(leads.length);
	let confirmedLeads = $derived(
		leads.filter((l) => l.status === 'Confirmed' || l.status === 'Showed Up').length
	);
	let conversionRate = $derived(
		totalLeads > 0 ? Math.round((confirmedLeads / totalLeads) * 100) : 0
	);
	let bookedLeads = $derived(leads.filter((l) => l.status === 'Booked').length);

	const cards = $derived([
		{
			label: 'Total Submissions',
			value: totalLeads,
			trend: '+12% this week',
			Icon: Users,
			filter: 'All'
		},
		{
			label: 'Confirmed Patients',
			value: confirmedLeads,
			trend: '+15% this week',
			Icon: CheckCircle2,
			filter: 'Confirmed'
		},
		{
			label: 'Conversion Rate',
			value: `${conversionRate}%`,
			trend: '+3% this week',
			Icon: BarChart2,
			filter: null
		}
	]);

	function handleClick(filter) {
		if (!filter) return;
		filterStatus = filterStatus === filter ? 'All' : filter;
	}
</script>

<div class="mb-8 grid grid-cols-3 gap-5">
	{#each cards as card}
		{@const isActive = card.filter && filterStatus === card.filter}
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
					: 'border-Mist/60 hover:border-Mist'}"
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="font-mono text-[11px] uppercase tracking-widest text-Dark/45">{card.label}</h3>
				<card.Icon
					class="h-4 w-4 transition-colors {isActive ? 'text-Primary' : 'text-Dark/30'}"
				/>
			</div>
			<p class="font-sans text-3xl font-medium text-Dark mb-3 leading-none">{card.value}</p>
			<div class="flex items-center gap-1.5">
				<TrendingUp class="h-3 w-3 text-green-500" />
				<span class="font-mono text-[10px] text-green-600">{card.trend}</span>
			</div>
		</div>
	{/each}
</div>
