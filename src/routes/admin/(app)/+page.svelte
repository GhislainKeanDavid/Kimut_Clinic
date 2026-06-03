<script>
	import { getContext } from 'svelte';

	import MetricCards from '$lib/components/admin/MetricCards.svelte';
	import PatientTable from '$lib/components/admin/PatientTable.svelte';
	import ActivityFeed from '$lib/components/admin/ActivityFeed.svelte';
	import OnDutyTherapists from '$lib/components/admin/OnDutyTherapists.svelte';
	import WeeklyServicesPie from '$lib/components/admin/WeeklyServicesPie.svelte';
	import WeeklySchedule from '$lib/components/admin/WeeklySchedule.svelte';

	const admin = getContext('admin');

	// 'all' | 'this_week' | 'needs_attention' — driven by metric cards and table filter pills.
	let viewFilter = $state('all');
</script>

<div class="mx-auto w-full max-w-[1500px] px-8 py-8">
	<div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
		<div class="min-w-0">
			<MetricCards leads={admin.leads} bind:viewFilter />

			<PatientTable
				leads={admin.leads}
				bind:viewFilter
				onAssignPt={admin.handleAssignPt}
				onAttendanceChange={admin.handleAttendanceChange}
			/>
		</div>

		<aside class="flex flex-col gap-5">
			<WeeklyServicesPie leads={admin.leads} />
			<OnDutyTherapists leads={admin.leads} />
			<div class="flex flex-1 min-h-[280px] flex-col">
				<ActivityFeed leads={admin.leads} />
			</div>
		</aside>
	</div>

	<div class="mt-6">
		<WeeklySchedule leads={admin.leads} />
	</div>
</div>
