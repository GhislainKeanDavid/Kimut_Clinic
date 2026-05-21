<script>
	import { enhance } from '$app/forms';
	import { parseNotes } from '$lib/parse-notes';
	import { Activity, LogOut, ChevronDown, Search } from 'lucide-svelte';
	import { PUBLIC_UMAMI_SHARE_URL } from '$env/static/public';

	let { data } = $props();
	let leads = $state(data.leads || []);
	let filterStatus = $state('All');
	let searchQuery = $state('');

	const statusOptions = ['Booked', 'Confirmed', 'Showed Up', 'No Show', 'Lost'];
	const statusFilters = ['All', ...statusOptions];

	let totalLeads = $derived(leads.length);
	let confirmedLeads = $derived(leads.filter(l => l.status === 'Confirmed' || l.status === 'Showed Up').length);
	let bookedLeads = $derived(leads.filter(l => l.status === 'Booked').length);
	let lostLeads = $derived(leads.filter(l => l.status === 'Lost' || l.status === 'No Show').length);
	let conversionRate = $derived(totalLeads > 0 ? Math.round((confirmedLeads / totalLeads) * 100) : 0);

	let statusCounts = $derived(
		statusOptions.map(s => ({
			status: s,
			count: leads.filter(l => l.status === s).length,
		}))
	);

	let filteredLeads = $derived(
		leads.filter(l => {
			const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
			const q = searchQuery.toLowerCase();
			const matchesSearch =
				!q ||
				l.full_name?.toLowerCase().includes(q) ||
				l.email?.toLowerCase().includes(q) ||
				l.service?.toLowerCase().includes(q);
			return matchesStatus && matchesSearch;
		})
	);

	async function handleStatusChange(lead_id, new_status, email) {
		const leadIndex = leads.findIndex(l => l.id === lead_id);
		if (leadIndex !== -1) leads[leadIndex].status = new_status;
		try {
			const res = await fetch('/admin/update-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lead_id, new_status, email })
			});
			if (!res.ok) console.error('Failed to update status');
		} catch (e) {
			console.error('Failed to update status', e);
		}
	}

	function daysAgo(dateStr) {
		const diff = Date.now() - new Date(dateStr).getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'today';
		if (days === 1) return '1d ago';
		return `${days}d ago`;
	}

	const statusCfg = {
		'Booked':    { dot: 'bg-blue-500',    text: 'text-blue-700',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
		'Confirmed': { dot: 'bg-green-500',   text: 'text-green-700',   badge: 'bg-green-50 text-green-700 border-green-200' },
		'Showed Up': { dot: 'bg-emerald-500', text: 'text-emerald-800', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
		'No Show':   { dot: 'bg-red-500',     text: 'text-red-700',     badge: 'bg-red-50 text-red-700 border-red-200' },
		'Lost':      { dot: 'bg-gray-400',    text: 'text-gray-500',    badge: 'bg-gray-100 text-gray-600 border-gray-200' },
	};
</script>

<div class="h-screen flex flex-col overflow-hidden bg-Background">

	<!-- ── Header ────────────────────────────────────────────────── -->
	<header class="flex-shrink-0 bg-Primary flex items-center justify-between px-5 h-12">
		<div class="flex items-center gap-2.5">
			<Activity class="h-4 w-4 text-white/70" />
			<span class="font-mono text-[11px] uppercase tracking-[0.18em] text-white/90 font-medium">Kimut Admin</span>
		</div>

		<!-- Inline stat strip -->
		<div class="hidden sm:flex items-stretch divide-x divide-white/10 h-full">
			{#each [
				{ label: 'Leads',     val: totalLeads },
				{ label: 'Confirmed', val: confirmedLeads },
				{ label: 'Booked',    val: bookedLeads },
				{ label: 'Conv.',     val: conversionRate + '%' },
			] as stat}
				<div class="flex flex-col items-center justify-center px-5 gap-0.5">
					<span class="font-mono text-[9px] uppercase tracking-widest text-white/40">{stat.label}</span>
					<span class="font-mono text-sm font-bold text-white leading-none">{stat.val}</span>
				</div>
			{/each}
		</div>

		<div class="flex items-center gap-4">
			<span class="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/50">
				<span class="relative flex h-1.5 w-1.5">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
					<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
				</span>
				Live
			</span>
			<form action="/admin/logout" method="POST" use:enhance>
				<button
					type="submit"
					class="flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/50 transition-colors hover:bg-white/10 hover:text-white"
				>
					<LogOut size={11} /> Sign out
				</button>
			</form>
		</div>
	</header>

	<!-- ── Body: table + sidebar ─────────────────────────────────── -->
	<div class="flex-1 flex overflow-hidden">

		<!-- Left: Submissions -->
		<div class="flex-1 flex flex-col overflow-hidden min-w-0">

			<!-- Toolbar -->
			<div class="flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 border-b border-Mist/70 bg-white/40">
				<div class="relative w-52">
					<Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-Dark/35" />
					<input
						type="text"
						placeholder="Search patients…"
						bind:value={searchQuery}
						class="w-full rounded border border-Mist/60 bg-white/70 pl-7 pr-3 py-1.5 font-mono text-[11px] text-Dark placeholder:text-Dark/30 outline-none focus:border-Primary/60 focus:ring-1 focus:ring-Primary/20 transition-colors"
					/>
				</div>

				<div class="flex items-center gap-1">
					{#each statusFilters as f}
						<button
							onclick={() => filterStatus = f}
							class="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors {filterStatus === f ? 'bg-Primary text-white' : 'text-Dark/45 hover:bg-Mist/50 hover:text-Dark'}"
						>
							{f}
						</button>
					{/each}
				</div>

				<span class="ml-auto font-mono text-[10px] tracking-widest text-Dark/35">
					{filteredLeads.length}/{totalLeads}
				</span>
			</div>

			<!-- Table -->
			<div class="flex-1 overflow-y-auto">
				<table class="w-full text-left text-sm">
					<thead class="sticky top-0 z-10 bg-Mist/25 backdrop-blur-sm border-b border-Mist/60">
						<tr>
							{#each ['Date', 'Patient', 'Concern', 'Service', 'Status'] as col}
								<th class="px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-Dark/40">{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-Mist/40">
						{#if filteredLeads.length === 0}
							<tr>
								<td colspan="5" class="py-16 text-center font-mono text-xs text-Dark/30">
									{searchQuery || filterStatus !== 'All' ? 'No matching records.' : 'No submissions yet.'}
								</td>
							</tr>
						{/if}
						{#each filteredLeads as lead}
							{@const parsed = parseNotes(lead.additional_notes)}
							{@const sc = statusCfg[lead.status] ?? statusCfg['Lost']}
							<tr class="transition-colors hover:bg-white/60">
								<td class="whitespace-nowrap px-5 py-3">
									<div class="font-mono text-xs text-Dark/75">
										{new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
									</div>
									<div class="font-mono text-[10px] text-Dark/35 mt-0.5">{daysAgo(lead.created_at)}</div>
								</td>
								<td class="px-5 py-3">
									<div class="text-sm font-medium text-Dark leading-tight">{lead.full_name}</div>
									<div class="font-mono text-[10px] text-Dark/40 mt-0.5">{lead.phone_number}</div>
								</td>
								<td class="px-5 py-3">
									<span class="inline-flex items-center rounded bg-Accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-Accent">
										{parsed.concern ?? '—'}
									</span>
								</td>
								<td class="px-5 py-3 font-mono text-xs text-Dark/65">{lead.service}</td>
								<td class="px-5 py-3">
									<div class="relative inline-block">
										<select
											class="appearance-none rounded border pl-5 pr-6 py-1.5 font-mono text-[11px] font-medium outline-none cursor-pointer transition-all hover:brightness-95 focus:ring-1 focus:ring-Primary/25 {sc.badge}"
											value={lead.status}
											onchange={(e) => handleStatusChange(lead.id, e.target.value, lead.email)}
										>
											{#each statusOptions as status}
												<option value={status}>{status}</option>
											{/each}
										</select>
										<span class="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full {sc.dot}"></span>
										<ChevronDown class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 opacity-40" />
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Right Sidebar -->
		<div class="w-64 xl:w-72 flex-shrink-0 flex flex-col overflow-hidden border-l border-Mist/70 bg-white/25">

			<!-- Pipeline breakdown -->
			<div class="flex-shrink-0 p-4 border-b border-Mist/60">
				<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40 mb-3">Pipeline</p>
				<div class="space-y-2.5">
					{#each statusCounts as { status, count }}
						{@const sc = statusCfg[status]}
						{@const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0}
						<div class="flex items-center gap-2">
							<span class="h-1.5 w-1.5 rounded-full flex-shrink-0 {sc.dot}"></span>
							<span class="font-mono text-[10px] text-Dark/55 flex-1 truncate">{status}</span>
							<span class="font-mono text-xs font-bold text-Dark w-4 text-right">{count}</span>
							<div class="w-14 h-1 bg-Mist/60 rounded-full overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500 {sc.dot}"
									style="width: {pct}%"
								></div>
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-4 pt-3 border-t border-Mist/40">
					<div class="flex items-center justify-between mb-1.5">
						<span class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">Conversion</span>
						<span class="font-mono text-sm font-bold text-Primary">{conversionRate}%</span>
					</div>
					<div class="h-1.5 w-full rounded-full bg-Mist/60 overflow-hidden">
						<div
							class="h-full rounded-full bg-Primary transition-all duration-700"
							style="width: {conversionRate}%"
						></div>
					</div>
				</div>
			</div>

			<!-- Funnel Analytics -->
			<div class="flex-1 flex flex-col overflow-hidden p-4 min-h-0">
				<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40 mb-3 flex-shrink-0">Funnel Analytics</p>
				<div class="flex-1 min-h-0 rounded border border-Mist/60 overflow-hidden bg-white/50">
					<iframe
						src={PUBLIC_UMAMI_SHARE_URL}
						title="Umami Analytics"
						class="w-full h-full"
						sandbox="allow-scripts allow-same-origin"
					></iframe>
				</div>
			</div>

		</div>
	</div>
</div>
