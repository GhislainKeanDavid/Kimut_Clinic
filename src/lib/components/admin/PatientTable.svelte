<script>
	import {
		Search,
		ChevronDown,
		ChevronUp,
		ArrowUpDown,
		Globe,
		Phone,
		MoreVertical,
		FileText,
		Pencil
	} from 'lucide-svelte';

	let {
		leads,
		viewFilter = $bindable('all'),
		onAssignPt,
		onAttendanceChange
	} = $props();

	// Every row in `leads` is status='confirmed' (filtered server-side in +page.server.js).
	// The dashboard's view filter slices that list by clinic-relevant lenses, not by status.
	const viewFilters = [
		{ id: 'all', label: 'All Patients' },
		{ id: 'this_week', label: 'This Week' },
		{ id: 'needs_attention', label: 'Needs Attention' }
	];

	const attendanceOptions = ['scheduled', 'attended', 'no_show'];
	const attendanceCfg = {
		scheduled: {
			label: 'Scheduled',
			badge: 'bg-Mist/30 text-Dark/60 border-Mist/60'
		},
		attended: {
			label: 'Attended',
			badge: 'bg-green-50 text-green-700 border-green-200'
		},
		no_show: {
			label: 'No-show',
			badge: 'bg-red-50 text-red-700 border-red-200'
		}
	};

	function attendanceLabel(a) {
		return attendanceCfg[a]?.label ?? attendanceCfg.scheduled.label;
	}

	function isAppointmentPast(datetime) {
		if (!datetime) return false;
		return new Date(datetime).getTime() < Date.now();
	}

	const ptCfg = {
		reyes: { label: 'Reyes', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
		santos: { label: 'Santos', badge: 'bg-green-50 text-green-700 border-green-200' },
		dizon: { label: 'Dizon', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
	};
	const ptFilters = ['All PTs', 'Reyes', 'Santos', 'Dizon', 'Unassigned'];

	let searchQuery = $state('');
	let sortField = $state('date');
	let sortDir = $state('desc');
	let openActionRow = $state(null);
	let filterPT = $state('All PTs');

	function toggleSort(field) {
		if (sortField === field) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDir = 'desc';
		}
	}

	function matchesView(lead, view) {
		if (view === 'all') return true;
		if (!lead.datetime) return false;
		const apptMs = new Date(lead.datetime).getTime();
		if (view === 'this_week') {
			// Monday → Sunday window anchored on today (PH locale; client clock is fine here
			// because the cutoff is day-level, not minute-level).
			const now = new Date();
			const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
			const offsetToMon = day === 0 ? -6 : 1 - day;
			const monday = new Date(now);
			monday.setHours(0, 0, 0, 0);
			monday.setDate(now.getDate() + offsetToMon);
			const nextMonday = new Date(monday);
			nextMonday.setDate(monday.getDate() + 7);
			return apptMs >= monday.getTime() && apptMs < nextMonday.getTime();
		}
		if (view === 'needs_attention') {
			return apptMs < Date.now() && (lead.attendance ?? 'scheduled') === 'scheduled';
		}
		return true;
	}

	let processedLeads = $derived.by(() => {
		const q = searchQuery.toLowerCase();
		let result = leads.filter((l) => {
			const matchesPT =
				filterPT === 'All PTs' ||
				(filterPT === 'Unassigned'
					? !l.assigned_pt
					: l.assigned_pt?.toLowerCase() === filterPT.toLowerCase());
			const matchesSearch =
				!q ||
				l.full_name?.toLowerCase().includes(q) ||
				l.email?.toLowerCase().includes(q) ||
				l.service?.toLowerCase().includes(q);
			return matchesView(l, viewFilter) && matchesPT && matchesSearch;
		});

		result = [...result].sort((a, b) => {
			if (sortField === 'date') {
				const av = new Date(a.created_at).getTime();
				const bv = new Date(b.created_at).getTime();
				return sortDir === 'asc' ? av - bv : bv - av;
			}
			if (sortField === 'appointment') {
				const av = a.datetime ? new Date(a.datetime).getTime() : 0;
				const bv = b.datetime ? new Date(b.datetime).getTime() : 0;
				return sortDir === 'asc' ? av - bv : bv - av;
			}
			return 0;
		});

		return result;
	});

	let totalFiltered = $derived(processedLeads.length);
	let totalAll = $derived(leads.length);

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

	function daysColor(days) {
		if (days <= 1) return 'text-green-700';
		if (days <= 3) return 'text-amber-700';
		return 'text-red-700';
	}

	function daysBg(days) {
		if (days <= 1) return 'bg-green-50 border-green-200';
		if (days <= 3) return 'bg-amber-50 border-amber-200';
		return 'bg-red-50 border-red-200';
	}

	function isVoiceSource(lead) {
		const src = lead.source?.toLowerCase() ?? '';
		return src === 'retell' || src === 'voice' || src === 'phone';
	}

	function closeActionMenu() {
		openActionRow = null;
	}

	const rowActions = [
		{ Icon: FileText, label: 'View Notes' },
		{ Icon: Pencil, label: 'Edit Details' }
	];
</script>

<!-- Toolbar -->
<div class="mb-0 flex flex-wrap items-center gap-2 border-b border-Mist/60 pb-0">
	<!-- Search -->
	<div class="relative w-48 mb-2.5">
		<Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-Dark/35" />
		<input
			type="text"
			placeholder="Search patients…"
			bind:value={searchQuery}
			class="w-full rounded-lg border border-Mist/60 bg-white/70 pl-7 pr-3 py-1.5 font-mono text-[11px] text-Dark placeholder:text-Dark/30 outline-none focus:border-Primary/50 focus:ring-1 focus:ring-Primary/20 transition-colors"
		/>
	</div>

	<!-- View filter pills (matches the MetricCards click targets) -->
	<div class="flex flex-wrap items-center gap-1 mb-2.5">
		{#each viewFilters as f}
			<button
				onclick={() => (viewFilter = f.id)}
				class="rounded-lg px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors
					{viewFilter === f.id
						? 'bg-Primary text-white'
						: 'text-Dark/40 hover:bg-Mist/50 hover:text-Dark'}"
			>
				{f.label}
			</button>
		{/each}
	</div>

	<span class="mb-2.5 font-mono text-[10px] tracking-widest text-Dark/30">
		{totalFiltered}/{totalAll}
	</span>
</div>

<!-- PT filter pills row -->
<div class="flex flex-wrap items-center gap-1 py-2 border-b border-Mist/60">
	<span class="font-mono text-[9px] uppercase tracking-[0.2em] text-Dark/30 mr-1">PT:</span>
	{#each ptFilters as f}
		<button
			onclick={() => (filterPT = f)}
			class="rounded-lg px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors
				{filterPT === f
					? 'bg-Dark/80 text-white'
					: 'text-Dark/40 hover:bg-Mist/50 hover:text-Dark'}"
		>
			{f}
		</button>
	{/each}
</div>

<!-- Table -->
<div
	class="overflow-hidden rounded-b-2xl rounded-t-none border border-t-0 border-Mist/60 bg-white shadow-sm"
>
	<div class="overflow-x-auto">
		<table class="w-full table-fixed text-left text-sm">
			<thead class="bg-Mist/20">
				<tr>
					<!-- Date — sortable -->
					<th class="w-[130px] px-5 py-3">
						<button
							onclick={() => toggleSort('date')}
							class="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-Dark/40 hover:text-Dark/70 transition-colors group"
						>
							Date
							{#if sortField === 'date'}
								{#if sortDir === 'asc'}
									<ChevronUp class="h-3 w-3 text-Primary" />
								{:else}
									<ChevronDown class="h-3 w-3 text-Primary" />
								{/if}
							{:else}
								<ArrowUpDown class="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
							{/if}
						</button>
					</th>
					<th class="w-[200px] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
						>Patient</th
					>
					<th class="w-[100px] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
						>Assigned PT</th
					>
					<th class="w-[90px] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
						>Lead Age</th
					>
					<th class="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
						>Service</th
					>
					<th
						class="w-[140px] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
						>Attendance</th
					>
					<th class="w-10 px-3 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-Mist/40">
				{#if processedLeads.length === 0}
					<tr>
						<td colspan="7" class="py-16 text-center font-mono text-xs text-Dark/30">
							{searchQuery || viewFilter !== 'all' || filterPT !== 'All PTs'
								? 'No matching records.'
								: 'No confirmed patients yet.'}
						</td>
					</tr>
				{/if}
				{#each processedLeads as lead (lead.id)}
					{@const days = daysSince(lead.created_at)}
					{@const isVoice = isVoiceSource(lead)}
					{@const ptSlug = lead.assigned_pt?.toLowerCase()}
					{@const pc = ptCfg[ptSlug]}
					<tr class="relative transition-colors hover:bg-Mist/10 group">
						<!-- Date -->
						<td class="whitespace-nowrap px-5 py-4">
							<div class="font-mono text-xs text-Dark/70">
								{new Date(lead.created_at).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: '2-digit'
								})}
							</div>
							<div class="font-mono text-[10px] text-Dark/32 mt-0.5">{daysAgo(lead.created_at)}</div>
						</td>

						<!-- Patient -->
						<td class="px-5 py-4">
							<div class="flex items-start gap-2">
								<div
									class="mt-0.5 flex-shrink-0 rounded-md p-1 {isVoice
										? 'bg-purple-50 text-purple-500'
										: 'bg-teal-50 text-teal-600'}"
									title={isVoice ? 'Retell AI Voice' : 'Web Intake'}
								>
									{#if isVoice}
										<Phone class="h-3 w-3" />
									{:else}
										<Globe class="h-3 w-3" />
									{/if}
								</div>
								<div>
									<div class="text-sm font-medium text-Dark leading-tight">{lead.full_name}</div>
									{#if lead.age}
										<div class="font-mono text-[10px] text-Dark/45 mt-0.5">{lead.age} yrs</div>
									{/if}
									<div class="font-mono text-[10px] text-Dark/35 mt-0.5">{lead.phone_number}</div>
								</div>
							</div>
						</td>

						<!-- Assigned PT (also where the admin assigns when 'any' was picked at intake) -->
						<td class="px-5 py-4">
							{#if pc}
								<span
									class="inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium {pc.badge}"
								>
									{pc.label}
								</span>
							{:else}
								<div class="relative inline-block">
									<select
										class="appearance-none rounded-lg border border-amber-200 bg-amber-50 pl-2.5 pr-6 py-1 font-mono text-[10px] font-medium text-amber-700 outline-none cursor-pointer transition-all hover:brightness-95 focus:ring-1 focus:ring-amber-300"
										value=""
										onchange={(e) => {
											if (e.target.value) onAssignPt(lead.id, e.target.value);
											e.target.value = '';
										}}
									>
										<option value="" disabled>Assign PT…</option>
										<option value="reyes">Reyes</option>
										<option value="santos">Santos</option>
										<option value="dizon">Dizon</option>
									</select>
									<ChevronDown
										class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-amber-600 opacity-60"
									/>
								</div>
							{/if}
						</td>

						<!-- Lead Age -->
						<td class="px-5 py-4">
							<span
								class="inline-flex items-center rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold {daysColor(days)} {daysBg(days)}"
							>
								{days === 0 ? '<1d' : `${days}d`}
							</span>
						</td>

						<!-- Service -->
						<td class="px-5 py-4 font-mono text-xs text-Dark/60">{lead.service}</td>

						<!-- Attendance -->
						<td class="px-5 py-4">
							{@const ac = attendanceCfg[lead.attendance] ?? attendanceCfg.scheduled}
							{@const past = isAppointmentPast(lead.datetime)}
							<div class="relative inline-block">
								<select
									class="appearance-none rounded-lg border pl-2.5 pr-7 py-1.5 font-mono text-[11px] font-medium outline-none cursor-pointer transition-all hover:brightness-95 focus:ring-1 focus:ring-Primary/25 {ac.badge} {past && (lead.attendance ?? 'scheduled') === 'scheduled' ? 'ring-1 ring-amber-300' : ''}"
									value={lead.attendance ?? 'scheduled'}
									title={past
										? 'Appointment is in the past — please mark the outcome'
										: 'Attendance (set after the appointment)'}
									onchange={(e) => onAttendanceChange(lead.id, e.target.value)}
								>
									{#each attendanceOptions as a}
										<option value={a}>{attendanceLabel(a)}</option>
									{/each}
								</select>
								<ChevronDown
									class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40"
								/>
							</div>
						</td>

						<!-- Row actions -->
						<td class="px-3 py-4 relative">
							<div class="relative">
								<button
									onclick={(e) => {
										e.stopPropagation();
										openActionRow = openActionRow === lead.id ? null : lead.id;
									}}
									class="rounded-lg p-1.5 text-Dark/30 hover:bg-Mist/50 hover:text-Dark/70 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
									aria-label="Row actions"
								>
									<MoreVertical class="h-3.5 w-3.5" />
								</button>

								{#if openActionRow === lead.id}
									<div class="fixed inset-0 z-40" role="presentation" onclick={closeActionMenu}></div>

									<div
										class="absolute right-0 top-8 z-50 w-36 rounded-xl border border-Mist/70 bg-white shadow-xl shadow-Dark/10 overflow-hidden"
									>
										<div class="p-1">
											{#each rowActions as action}
												<button
													class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-[11px] text-Dark/60 hover:bg-Mist/30 hover:text-Dark transition-colors text-left"
													onclick={() => closeActionMenu()}
												>
													<action.Icon class="h-3 w-3 flex-shrink-0 text-Dark/40" />
													{action.label}
												</button>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
