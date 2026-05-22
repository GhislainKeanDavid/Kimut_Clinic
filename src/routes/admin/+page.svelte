<script>
	import { PUBLIC_UMAMI_SHARE_URL } from '$env/static/public';

	import SideNav from '$lib/components/admin/SideNav.svelte';
	import ProfileMenu from '$lib/components/admin/ProfileMenu.svelte';
	import MetricCards from '$lib/components/admin/MetricCards.svelte';
	import PatientTable from '$lib/components/admin/PatientTable.svelte';

	let { data } = $props();
	let leads = $state(data.leads || []);

	let activeView = $state('patients');
	let filterStatus = $state('All');
	let profileMenuOpen = $state(false);

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

	function toggleProfile() {
		profileMenuOpen = !profileMenuOpen;
	}
</script>

<div class="flex h-screen overflow-hidden bg-Background">
	<!-- Side Navigation -->
	<SideNav bind:activeView onProfileClick={toggleProfile} />

	<!-- Profile Menu (fixed, floats above sidebar) -->
	<ProfileMenu bind:open={profileMenuOpen} />

	<!-- Main content area -->
	<main class="flex-1 overflow-y-auto">
		<div class="mx-auto w-full max-w-6xl px-8 py-8">

			{#if activeView === 'patients'}
				<!-- Live status indicator -->
				<div class="mb-6 flex items-center justify-between">
					<div>
						<h1 class="font-serif text-2xl italic text-Dark mb-1">Patient List</h1>
						<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">
							Patient Management
						</p>
					</div>
					<span class="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-Dark/35">
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
				/>

			{:else if activeView === 'analytics'}
				<div class="mb-6">
					<h1 class="font-serif text-2xl italic text-Dark mb-1">Funnel Analytics</h1>
					<p class="font-mono text-[11px] text-Dark/40 uppercase tracking-widest">
						Patient Management
					</p>
				</div>

				<div class="rounded-2xl border border-Mist/60 bg-white p-8 shadow-sm">
					<h3 class="mb-6 font-serif text-xl italic text-Dark">Funnel Performance</h3>
					<iframe
						src={PUBLIC_UMAMI_SHARE_URL}
						title="Umami Analytics"
						class="w-full rounded-xl border border-Mist/60"
						style="height: 600px;"
						sandbox="allow-scripts allow-same-origin"
					></iframe>
				</div>
			{/if}

		</div>
	</main>
</div>
