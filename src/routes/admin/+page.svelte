<script>
	import { enhance } from '$app/forms';
	import { parseNotes } from '$lib/parse-notes';
	import { Activity, Users, Calendar, LogOut, CheckCircle2, ChevronDown, BarChart2 } from 'lucide-svelte';

	let { data } = $props();
	let leads = $state(data.leads || []);
	let activeTab = $state('submissions'); // 'submissions' | 'analytics'

	const statusOptions = ['Booked', 'Confirmed', 'Showed Up', 'No Show', 'Lost'];

	// Basic analytics stats
	let totalLeads = $derived(leads.length);
	let confirmedLeads = $derived(leads.filter(l => l.status === 'Confirmed' || l.status === 'Showed Up').length);
	let conversionRate = $derived(totalLeads > 0 ? Math.round((confirmedLeads / totalLeads) * 100) : 0);

	async function handleStatusChange(lead_id, new_status, email) {
		// Optimistic update
		const leadIndex = leads.findIndex(l => l.id === lead_id);
		if (leadIndex !== -1) {
			leads[leadIndex].status = new_status;
		}

		try {
			const res = await fetch('/admin/update-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lead_id, new_status, email })
			});
			if (!res.ok) {
				console.error('Failed to update status');
				// In a real app, revert the optimistic update here
			}
		} catch (e) {
			console.error('Failed to update status', e);
		}
	}
</script>

<div class="min-h-screen bg-Mist/10">
	<!-- Navbar -->
	<header class="sticky top-0 z-40 w-full border-b border-Mist/60 bg-white/80 px-6 py-4 backdrop-blur-md">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<div class="flex items-center gap-4">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-Primary/10">
					<Activity class="h-5 w-5 text-Primary" />
				</div>
				<h1 class="font-sans text-xl font-semibold text-Dark">Kimut Admin</h1>
			</div>
			
			<div class="flex items-center gap-6">
				<div class="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-Dark/50 sm:flex">
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
					</span>
					LIVE PIPELINE
				</div>
				<form action="/admin/logout" method="POST" use:enhance>
					<button type="submit" class="flex items-center gap-2 rounded-lg p-2 text-sm text-Dark/60 transition-colors hover:bg-Mist/30 hover:text-Dark">
						<LogOut size={16} />
						<span class="hidden sm:inline">Sign Out</span>
					</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-6 py-12">
		<!-- Header Stats -->
		<div class="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
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

		<!-- Tabs -->
		<div class="mb-8 flex border-b border-Mist/60">
			<button
				class="border-b-2 px-6 py-3 font-medium transition-colors {activeTab === 'submissions' ? 'border-Accent text-Accent' : 'border-transparent text-Dark/60 hover:text-Dark'}"
				onclick={() => activeTab = 'submissions'}
			>
				Submissions Table
			</button>
			<button
				class="border-b-2 px-6 py-3 font-medium transition-colors {activeTab === 'analytics' ? 'border-Accent text-Accent' : 'border-transparent text-Dark/60 hover:text-Dark'}"
				onclick={() => activeTab = 'analytics'}
			>
				Funnel Analytics
			</button>
		</div>

		<!-- Content -->
		{#if activeTab === 'submissions'}
			<div class="overflow-hidden rounded-2xl border border-Mist/60 bg-white shadow-sm">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="bg-Mist/20 text-Dark/60">
							<tr>
								<th class="px-6 py-4 font-mono text-[11px] uppercase tracking-widest">Date</th>
								<th class="px-6 py-4 font-mono text-[11px] uppercase tracking-widest">Patient</th>
								<th class="px-6 py-4 font-mono text-[11px] uppercase tracking-widest">Condition</th>
								<th class="px-6 py-4 font-mono text-[11px] uppercase tracking-widest">Service</th>
								<th class="px-6 py-4 font-mono text-[11px] uppercase tracking-widest">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-Mist/40">
							{#if leads.length === 0}
								<tr>
									<td colspan="5" class="py-12 text-center text-Dark/50">No submissions found.</td>
								</tr>
							{/if}
							{#each leads as lead}
								{@const parsed = parseNotes(lead.additional_notes)}
								<tr class="transition-colors hover:bg-Mist/10">
									<td class="whitespace-nowrap px-6 py-4 text-Dark/80">
										{new Date(lead.created_at).toLocaleDateString()}
									</td>
									<td class="px-6 py-4">
										<div class="font-medium text-Dark">{lead.full_name}</div>
										<div class="text-xs text-Dark/50">{lead.email}</div>
										<div class="text-xs text-Dark/50">{lead.phone_number}</div>
									</td>
									<td class="px-6 py-4">
										<span class="inline-flex rounded-full bg-Accent/10 px-2.5 py-0.5 text-xs text-Accent">
											{parsed.concern}
										</span>
									</td>
									<td class="px-6 py-4 text-Dark/80">
										{lead.service}
									</td>
									<td class="px-6 py-4">
										<div class="relative">
											<select
												class="appearance-none rounded-lg border border-Mist/60 bg-transparent px-4 py-2 pr-8 text-sm outline-none transition-colors hover:border-Accent focus:border-Accent focus:ring-1 focus:ring-Accent 
												{lead.status === 'Booked' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
												{lead.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
												{lead.status === 'Showed Up' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : ''}
												{lead.status === 'No Show' ? 'bg-red-50 text-red-700 border-red-200' : ''}
												{lead.status === 'Lost' ? 'bg-gray-100 text-gray-600 border-gray-300' : ''}"
												value={lead.status}
												onchange={(e) => handleStatusChange(lead.id, e.target.value, lead.email)}
											>
												{#each statusOptions as status}
													<option value={status}>{status}</option>
												{/each}
											</select>
											<ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-Dark/40" />
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="rounded-2xl border border-Mist/60 bg-white p-8 shadow-sm">
				<h3 class="mb-6 font-serif text-2xl italic text-Dark">Funnel Performance</h3>
				<p class="mb-8 text-Dark/60">
					Detailed funnel events and drop-off analytics will be rendered here.
					Currently, {data.funnelEvents?.length || 0} event logs recorded.
				</p>
				<div class="h-64 rounded-xl bg-Mist/20 flex items-center justify-center border border-dashed border-Mist/60">
					<p class="font-mono text-sm uppercase tracking-widest text-Dark/40">[LayerChart Visualization Placeholder]</p>
				</div>
			</div>
		{/if}
	</main>
</div>
