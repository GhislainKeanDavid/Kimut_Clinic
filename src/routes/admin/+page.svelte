<script>
	import { enhance } from '$app/forms';
	import { parseNotes } from '$lib/parse-notes';
	import { Activity, LogOut, ChevronDown, Search, BarChart2, Users, CheckCircle2 } from 'lucide-svelte';
	import { PUBLIC_UMAMI_SHARE_URL } from '$env/static/public';

	let { data } = $props();
	let leads = $state(data.leads || []);
	let filterStatus = $state('All');
	let searchQuery = $state('');
	let activeTab = $state('submissions');

	const statusOptions = ['Booked', 'Confirmed', 'Showed Up', 'No Show', 'Lost'];
	const statusFilters = ['All', ...statusOptions];

	let totalLeads = $derived(leads.length);
	let confirmedLeads = $derived(leads.filter(l => l.status === 'Confirmed' || l.status === 'Showed Up').length);
	let conversionRate = $derived(totalLeads > 0 ? Math.round((confirmedLeads / totalLeads) * 100) : 0);

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

	function daysSince(dateStr) {
		return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
	}

	// Color coding for days to contact urgency
	function daysColor(days) {
		if (days <= 1) return 'text-green-600';
		if (days <= 3) return 'text-amber-600';
		return 'text-red-600';
	}

	function daysBg(days) {
		if (days <= 1) return 'bg-green-50 border-green-200';
		if (days <= 3) return 'bg-amber-50 border-amber-200';
		return 'bg-red-50 border-red-200';
	}

	const statusCfg = {
		'Booked':    { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
		'Confirmed': { dot: 'bg-green-500',   badge: 'bg-green-50 text-green-700 border-green-200' },
		'Showed Up': { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
		'No Show':   { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200' },
		'Lost':      { dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-600 border-gray-200' },
	};
</script>

<div class="min-h-screen bg-Background flex flex-col">

	<!-- ── Header ───────────────────────────────────────────────── -->
	<header class="flex-shrink-0 bg-Primary flex items-center justify-between px-6 h-12">
		<div class="flex items-center gap-2.5">
			<Activity class="h-4 w-4 text-white/70" />
			<span class="font-mono text-[11px] uppercase tracking-[0.18em] text-white/90 font-medium">Kimut Admin</span>
		</div>
		<div class="flex items-center gap-4">
			<span class="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/50">
				<span class="relative flex h-1.5 w-1.5">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
					<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
				</span>
				Live Pipeline
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

	<main class="flex-1 mx-auto w-full max-w-7xl px-6 py-8">

		<!-- ── Stat Cards ────────────────────────────────────────── -->
		<div class="mb-8 grid grid-cols-3 gap-5">
			<div class="rounded-2xl border border-Mist/60 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="font-mono text-[11px] uppercase tracking-widest text-Dark/50">Total Submissions</h3>
					<Users class="h-4 w-4 text-Dark/40" />
				</div>
				<p class="font-sans text-3xl font-medium text-Dark">{totalLeads}</p>
			</div>
			<div class="rounded-2xl border border-Mist/60 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="font-mono text-[11px] uppercase tracking-widest text-Dark/50">Confirmed Patients</h3>
					<CheckCircle2 class="h-4 w-4 text-Dark/40" />
				</div>
				<p class="font-sans text-3xl font-medium text-Dark">{confirmedLeads}</p>
			</div>
			<div class="rounded-2xl border border-Mist/60 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="font-mono text-[11px] uppercase tracking-widest text-Dark/50">Conversion Rate</h3>
					<BarChart2 class="h-4 w-4 text-Dark/40" />
				</div>
				<p class="font-sans text-3xl font-medium text-Dark">{conversionRate}%</p>
			</div>
		</div>

		<!-- ── Toolbar ───────────────────────────────────────────── -->
		<div class="mb-0 flex items-center gap-2 border-b border-Mist/60 pb-0">
			<!-- Search -->
			<div class="relative w-48 mb-2.5">
				<Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-Dark/35" />
				<input
					type="text"
					placeholder="Search patients…"
					bind:value={searchQuery}
					class="w-full rounded border border-Mist/60 bg-white/70 pl-7 pr-3 py-1.5 font-mono text-[11px] text-Dark placeholder:text-Dark/30 outline-none focus:border-Primary/60 focus:ring-1 focus:ring-Primary/20 transition-colors"
				/>
			</div>

			<!-- Status filter pills -->
			<div class="flex items-center gap-1 mb-2.5">
				{#each statusFilters as f}
					<button
						onclick={() => { filterStatus = f; activeTab = 'submissions'; }}
						class="rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors
							{activeTab === 'submissions' && filterStatus === f
								? 'bg-Primary text-white'
								: 'text-Dark/45 hover:bg-Mist/50 hover:text-Dark'}"
					>
						{f}
					</button>
				{/each}
			</div>

			<span class="mb-2.5 font-mono text-[10px] tracking-widest text-Dark/35">
				{filteredLeads.length}/{totalLeads}
			</span>

			<!-- Funnel Analytics tab — pushed to far right -->
			<button
				onclick={() => activeTab = activeTab === 'analytics' ? 'submissions' : 'analytics'}
				class="ml-auto mb-0 flex items-center gap-1.5 border-b-2 px-4 py-3 font-medium text-sm transition-colors
					{activeTab === 'analytics'
						? 'border-Accent text-Accent'
						: 'border-transparent text-Dark/50 hover:text-Dark'}"
			>
				<BarChart2 size={14} />
				Funnel Analytics
			</button>
		</div>

		<!-- ── Content ───────────────────────────────────────────── -->
		{#if activeTab === 'submissions'}
			<div class="overflow-hidden rounded-b-2xl rounded-t-none border border-t-0 border-Mist/60 bg-white shadow-sm">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="bg-Mist/20">
							<tr>
								{#each ['Date', 'Patient', 'Days to Contact', 'Service', 'Status'] as col}
									<th class="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40">{col}</th>
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
								{@const sc = statusCfg[lead.status] ?? statusCfg['Lost']}
								{@const days = daysSince(lead.created_at)}
								<tr class="transition-colors hover:bg-Mist/10">
									<td class="whitespace-nowrap px-5 py-4">
										<div class="font-mono text-xs text-Dark/75">
											{new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
										</div>
										<div class="font-mono text-[10px] text-Dark/35 mt-0.5">{daysAgo(lead.created_at)}</div>
									</td>
									<td class="px-5 py-4">
										<div class="text-sm font-medium text-Dark leading-tight">{lead.full_name}</div>
										<div class="font-mono text-[10px] text-Dark/40 mt-0.5">{lead.phone_number}</div>
									</td>
									<td class="px-5 py-4">
										<span class="inline-flex items-center rounded border px-2.5 py-1 font-mono text-xs font-semibold {daysColor(days)} {daysBg(days)}">
											{days === 0 ? '&lt;1 day' : `${days}d`}
										</span>
									</td>
									<td class="px-5 py-4 font-mono text-xs text-Dark/65">{lead.service}</td>
									<td class="px-5 py-4">
										<div class="relative inline-block">
											<select
												class="appearance-none rounded border pl-5 pr-7 py-1.5 font-mono text-[11px] font-medium outline-none cursor-pointer transition-all hover:brightness-95 focus:ring-1 focus:ring-Primary/25 {sc.badge}"
												value={lead.status}
												onchange={(e) => handleStatusChange(lead.id, e.target.value, lead.email)}
											>
												{#each statusOptions as status}
													<option value={status}>{status}</option>
												{/each}
											</select>
											<span class="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full {sc.dot}"></span>
											<ChevronDown class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="rounded-b-2xl rounded-t-none border border-t-0 border-Mist/60 bg-white p-8 shadow-sm">
				<h3 class="mb-6 font-serif text-2xl italic text-Dark">Funnel Performance</h3>
				<iframe
					src={PUBLIC_UMAMI_SHARE_URL}
					title="Umami Analytics"
					class="w-full rounded-xl border border-Mist/60"
					style="height: 600px;"
					sandbox="allow-scripts allow-same-origin"
				></iframe>
			</div>
		{/if}
	</main>
</div>
