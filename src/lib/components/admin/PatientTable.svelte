<script>
	import {
		Search,
		ChevronDown,
		ChevronUp,
		ChevronLeft,
		ChevronRight,
		ArrowUpDown,
		Filter,
		Check,
		Globe,
		Phone,
		MoreVertical,
		FileText,
		Pencil
	} from 'lucide-svelte';
	import { colorForService } from '$lib/serviceColors.js';

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
		reyes: { label: 'Dr. Reyes', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
		santos: { label: 'Dr. Santos', badge: 'bg-green-50 text-green-700 border-green-200' },
		dizon: { label: 'Dr. Dizon', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
	};
	const ptFilters = [
		{ id: 'all', label: 'All Therapists' },
		{ id: 'reyes', label: 'Dr. Reyes' },
		{ id: 'santos', label: 'Dr. Santos' },
		{ id: 'dizon', label: 'Dr. Dizon' },
		{ id: 'unassigned', label: 'Unassigned' }
	];

	const PAGE_SIZE = 10;

	let searchQuery = $state('');
	let sortField = $state('date');
	let sortDir = $state('desc');
	let openActionRow = $state(null);
	let filterPT = $state('all');
	let therapistMenuOpen = $state(false);
	let currentPage = $state(1);

	let filterPTLabel = $derived(
		ptFilters.find((f) => f.id === filterPT)?.label ?? 'All Therapists'
	);

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
				filterPT === 'all' ||
				(filterPT === 'unassigned'
					? !l.assigned_pt
					: l.assigned_pt?.toLowerCase() === filterPT);
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
	let totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE)));

	// Snap currentPage back into range when the filtered set shrinks (e.g. after filter changes)
	$effect(() => {
		if (currentPage > totalPages) currentPage = totalPages;
		if (currentPage < 1) currentPage = 1;
	});

	// Reset to first page whenever filters/search change
	$effect(() => {
		searchQuery;
		viewFilter;
		filterPT;
		currentPage = 1;
	});

	let pagedLeads = $derived(
		processedLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);
	let emptyRowCount = $derived(Math.max(0, PAGE_SIZE - pagedLeads.length));
	let rangeStart = $derived(totalFiltered === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1);
	let rangeEnd = $derived(Math.min(currentPage * PAGE_SIZE, totalFiltered));

	function goToPage(p) {
		if (p < 1 || p > totalPages) return;
		currentPage = p;
	}

	let pageList = $derived.by(() => {
		// Compact pager: shows first, last, current, neighbors, with ellipses
		const pages = [];
		const window = 1;
		const add = (v) => pages.push(v);
		for (let i = 1; i <= totalPages; i++) {
			if (
				i === 1 ||
				i === totalPages ||
				(i >= currentPage - window && i <= currentPage + window)
			) {
				add(i);
			} else if (pages[pages.length - 1] !== '…') {
				add('…');
			}
		}
		return pages;
	});

	function selectTherapist(id) {
		filterPT = id;
		therapistMenuOpen = false;
	}

	function closeTherapistMenu() {
		therapistMenuOpen = false;
	}

	function daysAgo(dateStr) {
		const diff = Date.now() - new Date(dateStr).getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'today';
		if (days === 1) return '1d ago';
		return `${days}d ago`;
	}

	const MS_PER_DAY = 1000 * 60 * 60 * 24;
	const PH_TZ = 'Asia/Manila';

	function daysUntilAppt(datetimeStr) {
		if (!datetimeStr) return null;
		const apptYmd = new Date(datetimeStr).toLocaleDateString('en-CA', { timeZone: PH_TZ });
		const todayYmd = new Date().toLocaleDateString('en-CA', { timeZone: PH_TZ });
		const appt = new Date(apptYmd + 'T00:00:00Z').getTime();
		const today = new Date(todayYmd + 'T00:00:00Z').getTime();
		return Math.round((appt - today) / MS_PER_DAY);
	}

	function daysUntilLabel(days) {
		if (days === null) return '—';
		if (days < 0) {
			const n = -days;
			return n === 1 ? '1 day ago' : `${n} days ago`;
		}
		if (days === 0) return 'Today';
		if (days === 1) return '1 day';
		return `${days} days`;
	}

	function daysUntilColor(days) {
		if (days === null) return 'text-Dark/40';
		if (days < 0) return 'text-red-700';
		if (days === 0) return 'text-amber-700';
		if (days <= 3) return 'text-green-700';
		return 'text-blue-700';
	}

	function daysUntilBg(days) {
		if (days === null) return 'bg-Mist/20 border-Mist/60';
		if (days < 0) return 'bg-red-50 border-red-200';
		if (days === 0) return 'bg-amber-50 border-amber-200';
		if (days <= 3) return 'bg-green-50 border-green-200';
		return 'bg-blue-50 border-blue-200';
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

<!-- Single white container wrapping title + toolbar + table + pagination -->
<div class="overflow-hidden rounded-2xl border border-Mist/60 bg-white shadow-sm">
	<!-- Title row -->
	<div class="border-b border-Mist/60 px-5 py-4">
		<h2 class="font-serif text-lg italic text-Dark">Patient List</h2>
	</div>

	<!-- Toolbar: search + view filter pills -->
	<div class="flex flex-wrap items-center gap-2 border-b border-Mist/60 px-5 py-3">
		<!-- Search -->
		<div class="relative w-48">
			<Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-Dark/35" />
			<input
				type="text"
				placeholder="Search patients…"
				bind:value={searchQuery}
				class="w-full rounded-lg border border-Mist/60 bg-white pl-7 pr-3 py-1.5 font-mono text-[11px] text-Dark placeholder:text-Dark/30 outline-none focus:border-Primary/50 focus:ring-1 focus:ring-Primary/20 transition-colors"
			/>
		</div>

		<!-- View filter pills (matches the MetricCards click targets) -->
		<div class="flex flex-wrap items-center gap-1">
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
	</div>
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
					<th class="w-[130px] px-5 py-3">
						<div class="relative inline-block">
							<button
								onclick={(e) => {
									e.stopPropagation();
									therapistMenuOpen = !therapistMenuOpen;
								}}
								class="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest transition-colors group
									{filterPT !== 'all'
										? 'text-Primary'
										: 'text-Dark/40 hover:text-Dark/70'}"
								aria-haspopup="listbox"
								aria-expanded={therapistMenuOpen}
							>
								Therapist
								<Filter
									class="h-3 w-3 transition-opacity {filterPT !== 'all'
										? 'opacity-100'
										: 'opacity-0 group-hover:opacity-60'}"
								/>
								<ChevronDown
									class="h-3 w-3 transition-transform {therapistMenuOpen ? 'rotate-180' : ''}"
								/>
							</button>

							{#if therapistMenuOpen}
								<div
									class="fixed inset-0 z-40"
									role="presentation"
									onclick={closeTherapistMenu}
								></div>
								<div
									role="listbox"
									class="absolute left-0 top-7 z-50 w-44 rounded-xl border border-Mist/70 bg-white shadow-xl shadow-Dark/10 overflow-hidden"
								>
									<div class="p-1">
										{#each ptFilters as f}
											<button
												role="option"
												aria-selected={filterPT === f.id}
												onclick={() => selectTherapist(f.id)}
												class="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 font-mono text-[11px] transition-colors text-left
													{filterPT === f.id
														? 'bg-Primary/10 text-Primary'
														: 'text-Dark/70 hover:bg-Mist/30 hover:text-Dark'}"
											>
												<span>{f.label}</span>
												{#if filterPT === f.id}
													<Check class="h-3 w-3 flex-shrink-0" />
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</th>
					<th class="w-[140px] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
						>Days Until Appt</th
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
				{#each pagedLeads as lead (lead.id)}
					{@const days = daysUntilAppt(lead.datetime)}
					{@const isVoice = isVoiceSource(lead)}
					{@const ptSlug = lead.assigned_pt?.toLowerCase()}
					{@const pc = ptCfg[ptSlug]}
					{@const ac = attendanceCfg[lead.attendance] ?? attendanceCfg.scheduled}
					{@const past = isAppointmentPast(lead.datetime)}
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
										<option value="" disabled>Assign therapist…</option>
										<option value="reyes">Dr. Reyes</option>
										<option value="santos">Dr. Santos</option>
										<option value="dizon">Dr. Dizon</option>
									</select>
									<ChevronDown
										class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-amber-600 opacity-60"
									/>
								</div>
							{/if}
						</td>

						<!-- Days Until Appointment -->
						<td class="px-5 py-4">
							<span
								class="inline-flex items-center rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold {daysUntilColor(days)} {daysUntilBg(days)}"
							>
								{daysUntilLabel(days)}
							</span>
						</td>

						<!-- Service -->
						<td class="px-5 py-4">
							{#if lead.service}
								{@const sc = colorForService(lead.service)}
								<span
									class="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium {sc.bgClass} {sc.textClass} {sc.borderClass}"
								>
									<span class="h-1.5 w-1.5 rounded-full {sc.dotClass}"></span>
									{lead.service}
								</span>
							{:else}
								<span class="font-mono text-xs text-Dark/30">—</span>
							{/if}
						</td>

						<!-- Attendance -->
						<td class="px-5 py-4">
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

				<!-- Empty filler rows: keep table height constant so it always fits 10 rows -->
				{#each Array(emptyRowCount) as _, i}
					{@const isFirstFiller = i === 0 && pagedLeads.length === 0}
					<tr class="h-[76px]" aria-hidden={isFirstFiller ? undefined : 'true'}>
						{#if isFirstFiller}
							<td
								colspan="7"
								class="text-center align-middle font-mono text-xs text-Dark/30"
							>
								{searchQuery || viewFilter !== 'all' || filterPT !== 'all'
									? 'No matching records.'
									: 'No confirmed patients yet.'}
							</td>
						{:else}
							<td colspan="7"></td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination footer -->
	<div
		class="flex flex-wrap items-center justify-between gap-3 border-t border-Mist/60 px-5 py-3"
	>
		<span class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">
			{#if totalFiltered === 0}
				0 of 0
			{:else}
				{rangeStart}–{rangeEnd} of {totalFiltered}
			{/if}
		</span>

		<div class="flex items-center gap-1">
			<button
				onclick={() => goToPage(currentPage - 1)}
				disabled={currentPage <= 1}
				class="rounded-lg p-1.5 text-Dark/40 hover:bg-Mist/50 hover:text-Dark transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-Dark/40 disabled:cursor-not-allowed"
				aria-label="Previous page"
			>
				<ChevronLeft class="h-3.5 w-3.5" />
			</button>

			{#each pageList as p}
				{#if p === '…'}
					<span class="px-1.5 font-mono text-[10px] text-Dark/30">…</span>
				{:else}
					<button
						onclick={() => goToPage(p)}
						class="min-w-[28px] rounded-lg px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors
							{currentPage === p
								? 'bg-Primary text-white'
								: 'text-Dark/40 hover:bg-Mist/50 hover:text-Dark'}"
						aria-current={currentPage === p ? 'page' : undefined}
					>
						{p}
					</button>
				{/if}
			{/each}

			<button
				onclick={() => goToPage(currentPage + 1)}
				disabled={currentPage >= totalPages}
				class="rounded-lg p-1.5 text-Dark/40 hover:bg-Mist/50 hover:text-Dark transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-Dark/40 disabled:cursor-not-allowed"
				aria-label="Next page"
			>
				<ChevronRight class="h-3.5 w-3.5" />
			</button>
		</div>
	</div>
</div>
