<script>
	import { onMount, onDestroy, setContext } from 'svelte';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { createBrowserClient } from '@supabase/ssr';

	import SideNav from '$lib/components/admin/SideNav.svelte';
	import ProfileMenu from '$lib/components/admin/ProfileMenu.svelte';
	import ToastNotifications from '$lib/components/admin/ToastNotifications.svelte';
	import { toastStore } from '$lib/stores/toasts.svelte.js';

	let { data, children } = $props();

	// Single source of truth for `leads` across all authenticated admin pages.
	// One-time seed from server-loaded data. Direct $state init (not $effect.pre)
	// because $effect.pre never runs during SSR and we need this populated for
	// the initial render.
	// svelte-ignore state_referenced_locally
	let leads = $state(data.leads || []);

	let profileMenuOpen = $state(false);

	let realtimeChannel;

	onMount(() => {
		const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

		// The dashboard only shows status='confirmed'. Two ways a row enters that set:
		//   1. INSERT directly as confirmed (rare — admin/manual paths)
		//   2. UPDATE from pending_payment → confirmed (normal payment-cleared path)
		// React to both, and reflect attendance edits without firing a toast.
		realtimeChannel = supabase
			.channel('confirmed-bookings')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'patient_leads',
					filter: 'status=eq.confirmed'
				},
				(payload) => {
					const lead = payload.new;
					if (!lead) return;
					const existingIdx = leads.findIndex((l) => l.id === lead.id);
					if (existingIdx === -1) {
						leads.unshift(lead);

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
					} else {
						// In-place update — no toast, just sync (attendance edits, follow-up
						// counter bumps from the No-Show workflow, etc.).
						leads[existingIdx] = { ...leads[existingIdx], ...lead };
					}
				}
			)
			.subscribe();
	});

	onDestroy(() => {
		realtimeChannel?.unsubscribe();
	});

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

	// Share with child pages. Getter exposes the reactive `leads` $state without
	// breaking the proxy.
	setContext('admin', {
		get leads() {
			return leads;
		},
		handleAttendanceChange,
		handleAssignPt
	});
</script>

<ToastNotifications />

<div class="flex h-screen overflow-hidden bg-Background">
	<SideNav onProfileClick={toggleProfile} />
	<ProfileMenu bind:open={profileMenuOpen} />

	<main class="flex-1 overflow-y-auto flex flex-col">
		{@render children()}
	</main>
</div>
