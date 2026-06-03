<script>
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import {
		Mail,
		Phone,
		MessageSquare,
		Calendar,
		Stethoscope,
		IdCard,
		AtSign,
		FileText,
		ChevronLeft,
		ChevronRight,
		BadgeCheck
	} from 'lucide-svelte';
	import { colorForTherapist } from '$lib/therapistColors.js';
	import { colorForService } from '$lib/serviceColors.js';

	const TIMEZONE = 'Asia/Manila';

	const admin = getContext('admin');

	let slug = $derived(page.params.slug);
	let therapist = $derived((admin.therapists ?? []).find((t) => t.slug === slug) ?? null);

	let therapistLeads = $derived.by(() => {
		if (!slug) return [];
		return admin.leads.filter((l) => l.assigned_pt?.toLowerCase() === slug && l.datetime);
	});

	let upcoming = $derived.by(() => {
		const now = Date.now();
		return therapistLeads
			.filter((l) => new Date(l.datetime).getTime() >= now)
			.slice()
			.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
	});

	// Weekly Schedule state
	let weekOffset = $state(0);

	let weekDays = $derived.by(() => {
		const now = new Date();
		const dayOfWeek = now.getDay();
		const monday = new Date(now);
		monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
		monday.setHours(0, 0, 0, 0);
		return Array.from({ length: 6 }, (_, i) => {
			const d = new Date(monday);
			d.setDate(monday.getDate() + i);
			return d;
		});
	});

	let weekLabel = $derived.by(() => {
		const opts = { month: 'short', day: 'numeric' };
		const start = weekDays[0].toLocaleDateString('en-US', opts);
		const end = weekDays[5].toLocaleDateString('en-US', { ...opts, year: 'numeric' });
		return `${start} – ${end}`;
	});

	function dayStr(d) {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function getLeadsForDay(day) {
		const ds = dayStr(day);
		return therapistLeads
			.filter((l) => {
				const ld = new Date(l.datetime).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
				return ld === ds;
			})
			.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
	}

	function isToday(d) {
		const today = new Date();
		return (
			d.getDate() === today.getDate() &&
			d.getMonth() === today.getMonth() &&
			d.getFullYear() === today.getFullYear()
		);
	}

	function initials(name) {
		if (!name) return '?';
		const cleaned = name.replace(/^Dr\.?\s+/i, '').trim();
		return cleaned
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((s) => s[0]?.toUpperCase() ?? '')
			.join('');
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
			timeZone: TIMEZONE
		});
	}

	const actionIcons = [
		{ Icon: Mail, label: 'Email' },
		{ Icon: Phone, label: 'Call' },
		{ Icon: MessageSquare, label: 'Message' }
	];
</script>

{#if !therapist}
	<div class="flex h-full items-center justify-center px-8 py-12">
		<div class="text-center">
			<p class="font-serif text-xl italic text-Dark/70 mb-1">Therapist not found</p>
			<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">
				No therapist with that slug
			</p>
		</div>
	</div>
{:else}
	{@const c = colorForTherapist(therapist)}
	<div class="mx-auto w-full max-w-[1100px] px-8 py-8 space-y-6">
		<!-- Header card -->
		<div class="rounded-2xl border border-Mist/60 bg-white px-6 py-5 shadow-sm">
			<div class="flex items-start justify-between gap-6">
				<div class="flex items-center gap-4 min-w-0">
					<div class="relative flex-shrink-0">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold {c.softBg} {c.softText}"
						>
							{initials(therapist.full_name)}
						</div>
						{#if therapist.active}
							<BadgeCheck
								class="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-green-500 fill-white"
							/>
						{/if}
					</div>
					<div class="min-w-0">
						<h1 class="font-serif text-2xl italic text-Dark truncate">{therapist.full_name}</h1>
						<div class="flex items-center gap-3 mt-1.5 flex-wrap">
							<span
								class="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium {c.bgClass} {c.textClass} {c.borderClass}"
							>
								<span class="h-1.5 w-1.5 rounded-full {c.dotClass}"></span>
								{therapist.specialty ?? 'Therapist'}
							</span>
							{#if therapist.joined_date}
								<span class="flex items-center gap-1.5 font-mono text-[11px] text-Dark/50">
									<Calendar class="h-3 w-3 text-Dark/40" />
									Joined {formatLongDate(therapist.joined_date)}
								</span>
							{/if}
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

		<!-- Basic Info + Today & Upcoming -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Basic Info -->
			<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
				<h3 class="font-serif text-base italic text-Dark mb-4">Basic Information</h3>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
							<Stethoscope class="h-3 w-3 text-Dark/55" />
						</div>
						<div>
							<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">Specialty</p>
							<p class="text-sm text-Dark mt-0.5">{therapist.specialty ?? '—'}</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
							<IdCard class="h-3 w-3 text-Dark/55" />
						</div>
						<div>
							<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">
								License #
							</p>
							<p class="text-sm text-Dark mt-0.5 font-mono">{therapist.license_number ?? '—'}</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
							<AtSign class="h-3 w-3 text-Dark/55" />
						</div>
						<div class="min-w-0">
							<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">Email</p>
							<p class="text-sm text-Dark mt-0.5 truncate">{therapist.email ?? '—'}</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
							<Phone class="h-3 w-3 text-Dark/55" />
						</div>
						<div>
							<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">Phone</p>
							<p class="text-sm text-Dark mt-0.5">{therapist.phone ?? '—'}</p>
						</div>
					</div>

					{#if therapist.bio}
						<div class="flex items-start gap-3 pt-2 border-t border-Mist/40">
							<div class="rounded-md bg-Mist/30 p-1.5 flex-shrink-0">
								<FileText class="h-3 w-3 text-Dark/55" />
							</div>
							<div>
								<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">Bio</p>
								<p class="text-sm text-Dark/80 mt-0.5 leading-relaxed">{therapist.bio}</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Today & Upcoming -->
			<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-serif text-base italic text-Dark">Today &amp; Upcoming</h3>
					<span class="font-mono text-[10px] uppercase tracking-widest text-Dark/40">
						{upcoming.length} appt{upcoming.length === 1 ? '' : 's'}
					</span>
				</div>
				{#if upcoming.length === 0}
					<div class="py-10 text-center">
						<p class="font-mono text-[10px] uppercase tracking-widest text-Dark/35">
							No upcoming appointments
						</p>
					</div>
				{:else}
					<ul class="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
						{#each upcoming.slice(0, 12) as appt (appt.id)}
							{@const sc = colorForService(appt.service)}
							<li
								class="flex items-center gap-3 rounded-xl border border-Mist/60 bg-Mist/10 px-3 py-2.5"
							>
								<div class="flex flex-col items-center flex-shrink-0 w-12">
									<span class="font-mono text-[9px] uppercase tracking-wider text-Dark/40">
										{new Date(appt.datetime).toLocaleDateString('en-US', { month: 'short' })}
									</span>
									<span class="font-mono text-sm font-semibold text-Dark/70">
										{new Date(appt.datetime).getDate()}
									</span>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium text-Dark leading-tight truncate">
										{appt.full_name ?? 'Unnamed'}
									</p>
									<div class="flex items-center gap-1.5 mt-1">
										<span class="h-1.5 w-1.5 rounded-full {sc.dotClass}"></span>
										<span class="font-mono text-[10px] text-Dark/55 truncate">
											{appt.service ?? 'Session'}
										</span>
									</div>
								</div>
								<span class="font-mono text-[11px] text-Dark/60 flex-shrink-0">
									{formatTime(appt.datetime)}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>

		<!-- Weekly Schedule -->
		<div class="rounded-2xl border border-Mist/60 bg-white shadow-sm overflow-hidden">
			<div class="flex items-center justify-between border-b border-Mist/60 px-5 py-4">
				<h3 class="font-serif text-lg italic text-Dark">Weekly Schedule</h3>
				<div class="flex items-center gap-1">
					<button
						onclick={() => weekOffset--}
						class="rounded-lg p-2 text-Dark/40 hover:bg-Mist/50 hover:text-Dark transition-colors"
						aria-label="Previous week"
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<span class="font-mono text-xs text-Dark/60 min-w-[180px] text-center">{weekLabel}</span>
					<button
						onclick={() => weekOffset++}
						class="rounded-lg p-2 text-Dark/40 hover:bg-Mist/50 hover:text-Dark transition-colors"
						aria-label="Next week"
					>
						<ChevronRight class="h-4 w-4" />
					</button>
					{#if weekOffset !== 0}
						<button
							onclick={() => (weekOffset = 0)}
							class="ml-1 rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-Dark/40 hover:bg-Mist/50 hover:text-Dark transition-colors"
						>
							Today
						</button>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-6">
				{#each weekDays as day, i}
					{@const today = isToday(day)}
					{@const dayLeads = getLeadsForDay(day)}
					<div
						class="border-Mist/60 px-3 py-3 min-h-[180px]
							{i > 0 ? 'border-l' : ''}
							{today ? 'bg-Accent/[0.03]' : ''}"
					>
						<div class="flex flex-col items-center pb-3 border-b border-Mist/40">
							<span class="font-mono text-[10px] uppercase tracking-wider text-Dark/35">
								{day.toLocaleDateString('en-US', { weekday: 'short' })}
							</span>
							<span
								class="font-mono text-sm font-semibold mt-0.5 {today
									? 'text-Accent'
									: 'text-Dark/60'}"
							>
								{day.getDate()}
							</span>
						</div>
						<div class="pt-3">
							{#if dayLeads.length === 0}
								<div class="flex h-full min-h-[60px] items-center justify-center">
									<span class="font-mono text-[10px] text-Dark/15">—</span>
								</div>
							{:else}
								<div class="space-y-1.5">
									{#each dayLeads as lead (lead.id)}
										<div class="rounded-lg border px-2 py-1.5 {c.bgClass} {c.borderClass}">
											<div class="font-mono text-[10px] font-semibold {c.textClass}">
												{formatTime(lead.datetime)}
											</div>
											<div class="text-[11px] font-medium text-Dark/80 mt-0.5 truncate">
												{lead.full_name}
											</div>
											<div class="font-mono text-[9px] text-Dark/40 truncate">
												{lead.service}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
