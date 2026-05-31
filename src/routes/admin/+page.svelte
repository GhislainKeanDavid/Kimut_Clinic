<script>
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_UMAMI_SHARE_URL, PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { createBrowserClient } from '@supabase/ssr';

	import SideNav from '$lib/components/admin/SideNav.svelte';
	import ProfileMenu from '$lib/components/admin/ProfileMenu.svelte';
	import MetricCards from '$lib/components/admin/MetricCards.svelte';
	import PatientTable from '$lib/components/admin/PatientTable.svelte';
	import PTSchedule from '$lib/components/admin/PTSchedule.svelte';
	import ToastNotifications from '$lib/components/admin/ToastNotifications.svelte';
	import { toastStore } from '$lib/stores/toasts.svelte.js';

	let { data } = $props();
	let leads = $state(data.leads || []);

	let activeView = $state('patients');
	let filterStatus = $state('All');
	let profileMenuOpen = $state(false);

	let realtimeChannel;

	onMount(() => {
		const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

		realtimeChannel = supabase
			.channel('new-bookings')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'patient_leads' },
				(payload) => {
					const lead = payload.new;
					leads.unshift(lead);

					const src = lead.source?.toLowerCase() ?? 'web';
					const isVoice = src === 'retell' || src === 'voice' || src === 'phone';
					const appt = lead.datetime
						? new Date(lead.datetime).toLocaleString('en-PH', {
								month: 'short',
								day: 'numeric',
								hour: 'numeric',
								minute: '2-digit',
								timeZone: 'Asia/Manila'
							})
						: null;

					toastStore.add({
						title: lead.full_name || 'New Patient',
						body: [lead.service, appt].filter(Boolean).join(' • '),
						source: lead.source ?? 'web'
					});
				}
			)
			.subscribe();
	});

	onDestroy(() => {
		realtimeChannel?.unsubscribe();
	});

	async function handleStatusChange(lead_id, new_status, email) {
		const leadIndex = leads.findIndex((l) => l.id === lead_id);
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

	async function handleAttendanceChange(lead_id, attendance) {
		const leadIndex = leads.findIndex((l) => l.id === lead_id);
		const previous = leadIndex !== -1 ? leads[leadIndex].attendance : null;
		if (leadIndex !== -1) leads[leadIndex].attendance = attendance;
		try {
			const res = await fetch('/admin/update-attendance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lead_id, attendance })
			});
			if (!res.ok) {
				console.error('Failed to update attendance');
				if (leadIndex !== -1) leads[leadIndex].attendance = previous;
			}
		} catch (e) {
			console.error('Failed to update attendance', e);
			if (leadIndex !== -1) leads[leadIndex].attendance = previous;
		}
	}

	async function handleAssignPt(lead_id, new_pt) {
		const leadIndex = leads.findIndex((l) => l.id === lead_id);
		if (leadIndex !== -1) leads[leadIndex].assigned_pt = new_pt;
		try {
			const res = await fetch('/api/assign-therapist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lead_id, new_pt })
			});
			if (!res.ok) {
				console.error('Failed to assign therapist');
				if (leadIndex !== -1) leads[leadIndex].assigned_pt = null;
			}
		} catch (e) {
			console.error('Failed to assign therapist', e);
			if (leadIndex !== -1) leads[leadIndex].assigned_pt = null;
		}
	}

	function toggleProfile() {
		profileMenuOpen = !profileMenuOpen;
	}
</script>

<ToastNotifications />

<div class="flex h-screen overflow-hidden bg-Background">
	<!-- Side Navigation -->
	<SideNav bind:activeView onProfileClick={toggleProfile} />

	<!-- Profile Menu (fixed, floats above sidebar) -->
	<ProfileMenu bind:open={profileMenuOpen} />

	<!-- Main content area -->
	<main class="flex-1 overflow-y-auto flex flex-col">
		{#if activeView === 'patients'}
			<div class="mx-auto w-full max-w-6xl px-8 py-8">
				<!-- Live status indicator -->
				<div class="mb-6 flex items-center justify-between">
					<div>
						<h1 class="font-serif text-2xl italic text-Dark mb-1">Patient List</h1>
						<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">
							Patient Management
						</p>
					</div>
					<span
						class="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-Dark/35"
					>
						<span class="relative flex h-1.5 w-1.5">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
							></span>
							<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
						</span>
						Live Pipeline
					</span>
				</div>

				<!-- Metric Cards -->
				<MetricCards {leads} bind:filterStatus />

				<!-- Patient Table -->
				<PatientTable
					{leads}
					bind:filterStatus
					onStatusChange={handleStatusChange}
					onAssignPt={handleAssignPt}
					onAttendanceChange={handleAttendanceChange}
				/>
			</div>

		{:else if activeView === 'schedules'}
			<PTSchedule {leads} />

		{:else if activeView === 'analytics'}
			<div class="flex flex-1 flex-col px-8 py-8">
				<div class="mb-6">
					<h1 class="font-serif text-2xl italic text-Dark mb-1">Funnel Analytics</h1>
					<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">
						Patient Management
					</p>
				</div>

				<iframe
					src={PUBLIC_UMAMI_SHARE_URL}
					title="Umami Analytics"
					class="w-full flex-1 rounded-2xl border border-Mist/60"
					style="min-height: 500px;"
					sandbox="allow-scripts allow-same-origin"
				></iframe>
			</div>
		{/if}
	</main>
</div>
