<script>
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import {
		Mail,
		Phone,
		Smartphone,
		Video,
		Pencil,
		Calendar,
		User,
		AtSign,
		Globe,
		PhoneCall,
		MoreHorizontal,
		FileText,
		Download,
		Check,
		X,
		Clock
	} from 'lucide-svelte';
	import { colorForService } from '$lib/serviceColors.js';

	const admin = getContext('admin');

	let phoneParam = $derived(page.params.phone);

	// All confirmed leads for this patient, sorted newest appointment first.
	let patientLeads = $derived.by(() => {
		return admin.leads
			.filter((l) => l.phone_number === phoneParam)
			.slice()
			.sort((a, b) => {
				const ad = a.datetime ? new Date(a.datetime).getTime() : 0;
				const bd = b.datetime ? new Date(b.datetime).getTime() : 0;
				return bd - ad;
			});
	});

	// Use the latest lead row as the canonical profile (name/email/age may evolve).
	let canonical = $derived.by(() => {
		const byCreated = patientLeads
			.slice()
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
		return byCreated[0] ?? null;
	});

	let firstSeen = $derived.by(() => {
		if (patientLeads.length === 0) return null;
		const earliest = patientLeads.reduce((acc, l) =>
			new Date(l.created_at) < new Date(acc.created_at) ? l : acc
		);
		return earliest.created_at;
	});

	let now = Date.now();
	let upcoming = $derived(
		patientLeads.filter((l) => l.datetime && new Date(l.datetime).getTime() >= now)
			.slice()
			.sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
	);
	let history = $derived(
		patientLeads.filter((l) => l.datetime && new Date(l.datetime).getTime() < now)
	);

	let sourceList = $derived.by(() => {
		const set = new Set();
		for (const l of patientLeads) set.add(l.source ?? 'web');
		return [...set];
	});

	function initials(name) {
		if (!name) return '?';
		return name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((s) => s[0]?.toUpperCase() ?? '')
			.join('');
	}

	const avatarPalette = [
		'bg-blue-100 text-blue-700',
		'bg-green-100 text-green-700',
		'bg-amber-100 text-amber-700',
		'bg-rose-100 text-rose-700',
		'bg-purple-100 text-purple-700',
		'bg-teal-100 text-teal-700'
	];
	function avatarColor(phone) {
		if (!phone) return avatarPalette[0];
		let hash = 0;
		for (let i = 0; i < phone.length; i++) hash = (hash * 31 + phone.charCodeAt(i)) >>> 0;
		return avatarPalette[hash % avatarPalette.length];
	}

	function formatLongDate(iso) {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatShortDate(iso) {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatTime(iso) {
		if (!iso) return '';
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
			timeZone: 'Asia/Manila'
		});
	}

	const ptLabels = { reyes: 'Dr. Reyes', santos: 'Dr. Santos', dizon: 'Dr. Dizon' };

	const attendanceCfg = {
		scheduled: { label: 'Scheduled', Icon: Clock, badge: 'bg-Mist/30 text-Dark/60 border-Mist/60', dot: 'bg-Dark/30' },
		attended: { label: 'Attended', Icon: Check, badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
		no_show: { label: 'No-show', Icon: X, badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' }
	};

	function attendanceFor(lead) {
		return attendanceCfg[lead.attendance] ?? attendanceCfg.scheduled;
	}

	function shortId(id) {
		if (!id) return '—';
		return '#' + String(id).replace(/-/g, '').slice(0, 5).toUpperCase();
	}

	function sourceLabel(s) {
		const k = (s ?? 'web').toLowerCase();
		if (k === 'retell' || k === 'voice' || k === 'phone') return 'Voice (Retell)';
		return 'Website';
	}

	function SourceIconFor(s) {
		const k = (s ?? 'web').toLowerCase();
		return k === 'retell' || k === 'voice' || k === 'phone' ? PhoneCall : Globe;
	}

	const actionIcons = [
		{ Icon: Mail, label: 'Email' },
		{ Icon: Phone, label: 'Call' },
		{ Icon: Smartphone, label: 'SMS' },
		{ Icon: Video, label: 'Telehealth' },
		{ Icon: Pencil, label: 'Edit' }
	];

	// Fake document list — placeholder until we wire real file storage.
	const fakeDocuments = [
		{ name: 'Intake_Form.pdf', size: '1.2 mb' },
		{ name: 'Consent_PT.pdf', size: '0.8 mb' },
		{ name: 'Insurance_Card.pdf', size: '2.3 mb' },
		{ name: 'Medical_History.pdf', size: '1.5 mb' }
	];
</script>

{#if !canonical}
	<div class="flex h-full items-center justify-center px-8 py-12">
		<div class="text-center">
			<p class="font-serif text-xl italic text-Dark/70 mb-1">Patient not found</p>
			<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">
				No confirmed bookings for this phone number
			</p>
		</div>
	</div>
{:else}
	<div class="mx-auto w-full max-w-[1100px] px-8 py-8 space-y-6">
		<!-- Header card -->
		<div class="rounded-2xl border border-Mist/60 bg-white px-6 py-5 shadow-sm">
			<div class="flex items-start justify-between gap-6">
				<div class="flex items-center gap-4 min-w-0">
					<div
						class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-base font-semibold {avatarColor(
							canonical.phone_number
						)}"
					>
						{initials(canonical.full_name)}
					</div>
					<div class="min-w-0">
						<h1 class="font-serif text-2xl italic text-Dark truncate">
							{canonical.full_name ?? 'Unnamed patient'}
						</h1>
						<div class="flex items-center gap-1.5 mt-1.5">
							<Calendar class="h-3 w-3 text-Dark/40" />
							<span class="font-mono text-[11px] text-Dark/50">
								Joined Since: {formatLongDate(firstSeen)}
							</span>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-1.5 flex-shrink-0">
					{#each actionIcons as a}
						<button
							class="rounded-xl border border-Mist/60 bg-white p-2.5 text-Dark/55 hover:bg-Mist/30 hover:text-Dark transition-colors"
							aria-label={a.label}
							title={a.label}
						>
							<a.Icon class="h-3.5 w-3.5" />
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Row: Basic Info + Appointment Schedule -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Basic Info -->
			<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
				<h3 class="font-serif text-base italic text-Dark mb-4">Basic Informational</h3>
				<div class="space-y-4">
					<!-- Age -->
					<div class="flex items-start gap-3">
						<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
							<User class="h-3 w-3 text-Dark/55" />
						</div>
						<div>
							<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">Age</p>
							<p class="text-sm text-Dark mt-0.5">
								{canonical.age ? `${canonical.age} years` : '—'}
							</p>
						</div>
					</div>

					<!-- Phone -->
					<div class="flex items-start gap-3">
						<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
							<Phone class="h-3 w-3 text-Dark/55" />
						</div>
						<div>
							<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">
								Phone Number
							</p>
							<p class="text-sm text-Dark mt-0.5">{canonical.phone_number ?? '—'}</p>
						</div>
					</div>

					<!-- Email -->
					<div class="flex items-start gap-3">
						<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
							<AtSign class="h-3 w-3 text-Dark/55" />
						</div>
						<div class="min-w-0">
							<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">Email</p>
							<p class="text-sm text-Dark mt-0.5 truncate">{canonical.email ?? '—'}</p>
						</div>
					</div>

					<!-- Sources -->
					<div class="flex items-start gap-3">
						<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
							<Globe class="h-3 w-3 text-Dark/55" />
						</div>
						<div>
							<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">Sources</p>
							<div class="flex flex-wrap items-center gap-1.5 mt-1.5">
								{#each sourceList as s}
									{@const SrcIcon = SourceIconFor(s)}
									<span
										class="inline-flex items-center gap-1 rounded-md bg-Mist/30 px-2 py-0.5 font-mono text-[10px] text-Dark/60"
									>
										<SrcIcon class="h-2.5 w-2.5" />
										{sourceLabel(s)}
									</span>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Appointment Schedule -->
			<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
				<h3 class="font-serif text-base italic text-Dark mb-4">Appointment Schedule</h3>
				{#if upcoming.length === 0}
					<div class="py-10 text-center">
						<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/35">
							No upcoming appointments
						</p>
					</div>
				{:else}
					<ol class="space-y-4">
						{#each upcoming as appt, i}
							{@const sc = colorForService(appt.service)}
							{@const pt = ptLabels[appt.assigned_pt?.toLowerCase()] ?? 'Unassigned'}
							<li class="relative pl-7">
								<!-- Timeline dot + line -->
								<span
									class="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 {sc.borderClass}"
								>
									<span class="h-2 w-2 rounded-full {sc.dotClass}"></span>
								</span>
								{#if i < upcoming.length - 1}
									<span class="absolute left-[7px] top-5 bottom-0 w-px bg-Mist/60"></span>
								{/if}

								<p class="font-mono text-[11px] text-Dark/60 mb-1">
									{formatShortDate(appt.datetime)}
									<span class="text-Dark/30">·</span>
									{formatTime(appt.datetime)}
								</p>
								<div class="rounded-xl border border-Mist/60 bg-Mist/10 px-3 py-2.5">
									<p class="text-sm font-medium text-Dark leading-tight">
										{appt.service ?? 'Session'}
									</p>
									<div class="flex items-center gap-1.5 mt-1.5">
										<span class="h-1.5 w-1.5 rounded-full {sc.dotClass}"></span>
										<span class="font-mono text-[10px] text-Dark/55">{pt}</span>
									</div>
								</div>
							</li>
						{/each}
					</ol>
				{/if}
			</div>
		</div>

		<!-- History -->
		<div class="rounded-2xl border border-Mist/60 bg-white shadow-sm overflow-hidden">
			<div class="border-b border-Mist/60 px-5 py-4">
				<h3 class="font-serif text-lg italic text-Dark">History</h3>
			</div>
			{#if history.length === 0}
				<div class="px-5 py-10 text-center">
					<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/35">
						No past appointments yet
					</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="bg-Mist/15">
							<tr>
								<th
									class="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
									>ID</th
								>
								<th
									class="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
									>Service</th
								>
								<th
									class="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
									>Date</th
								>
								<th
									class="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
									>Result</th
								>
								<th
									class="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-Dark/40"
									>Payment</th
								>
								<th class="w-10 px-3 py-3"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-Mist/40">
							{#each history as lead (lead.id)}
								{@const sc = colorForService(lead.service)}
								{@const att = attendanceFor(lead)}
								<tr class="hover:bg-Mist/10 transition-colors">
									<td class="px-5 py-4 font-mono text-xs text-Dark/55">{shortId(lead.id)}</td>
									<td class="px-5 py-4">
										{#if lead.service}
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
									<td class="px-5 py-4 font-mono text-xs text-Dark/70">
										{formatShortDate(lead.datetime)}
									</td>
									<td class="px-5 py-4">
										<span
											class="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium {att.badge}"
										>
											<att.Icon class="h-3 w-3" />
											{att.label}
										</span>
									</td>
									<td class="px-5 py-4">
										<span
											class="inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium border-green-200 bg-green-50 text-green-700"
										>
											Paid
										</span>
									</td>
									<td class="px-3 py-4">
										<button
											class="rounded-md p-1.5 text-Dark/30 hover:bg-Mist/40 hover:text-Dark/60 transition-colors"
											aria-label="Row actions"
										>
											<MoreHorizontal class="h-3.5 w-3.5" />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Agreement of document -->
		<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-serif text-base italic text-Dark">Agreement of document</h3>
				<button
					class="rounded-md p-1 text-Dark/30 hover:bg-Mist/40 hover:text-Dark/60 transition-colors"
					aria-label="More options"
				>
					<MoreHorizontal class="h-3.5 w-3.5" />
				</button>
			</div>
			<ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each fakeDocuments as doc}
					<li
						class="flex items-center gap-3 rounded-xl border border-Mist/60 bg-Mist/10 px-3 py-2.5"
					>
						<div class="rounded-md bg-rose-50 text-rose-600 p-2 flex-shrink-0">
							<FileText class="h-3.5 w-3.5" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-Dark truncate">{doc.name}</p>
							<p class="font-mono text-[10px] text-Dark/45 mt-0.5">{doc.size}</p>
						</div>
						<button
							class="rounded-md p-1.5 text-Dark/40 hover:bg-Mist/40 hover:text-Dark transition-colors flex-shrink-0"
							aria-label="Download {doc.name}"
						>
							<Download class="h-3.5 w-3.5" />
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
