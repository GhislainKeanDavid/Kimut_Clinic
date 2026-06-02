<script>
	import { CalendarDays, Wallet, UserPlus, ClipboardCheck } from 'lucide-svelte';

	let { leads } = $props();

	const TIMEZONE = 'Asia/Manila';

	function relativeTime(stamp) {
		if (!stamp) return '';
		const diffMs = Date.now() - new Date(stamp).getTime();
		const mins = Math.floor(diffMs / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		if (days < 7) return `${days}d ago`;
		return new Date(stamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function apptShort(datetimeStr) {
		if (!datetimeStr) return '';
		return new Date(datetimeStr).toLocaleString('en-PH', {
			timeZone: TIMEZONE,
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	const MAX_ITEMS = 6;

	const activityItems = $derived.by(() => {
		const items = [];
		for (const l of leads) {
			const stamp = l.status_updated_at || l.created_at;
			if (!stamp) continue;

			items.push({
				id: `book-${l.id}`,
				type: 'booking',
				Icon: CalendarDays,
				accent: 'bg-pink-50 text-pink-600',
				title: 'Appointment Booking',
				body: `${l.full_name || 'New patient'} booked${l.datetime ? ' for ' + apptShort(l.datetime) : ''}`,
				stamp
			});

			if (l.payment_amount) {
				items.push({
					id: `pay-${l.id}`,
					type: 'payment',
					Icon: Wallet,
					accent: 'bg-emerald-50 text-emerald-600',
					title: 'Received Payment',
					body: `Payment received from ${l.full_name || 'patient'}`,
					stamp
				});
			}

			if (l.assigned_pt) {
				items.push({
					id: `pt-${l.id}`,
					type: 'assign',
					Icon: ClipboardCheck,
					accent: 'bg-blue-50 text-blue-600',
					title: 'Therapist Assigned',
					body: `${l.assigned_pt.charAt(0).toUpperCase() + l.assigned_pt.slice(1)} assigned to ${l.full_name || 'patient'}`,
					stamp
				});
			}
		}
		items.sort((a, b) => new Date(b.stamp).getTime() - new Date(a.stamp).getTime());
		return items.slice(0, MAX_ITEMS);
	});

	let emptySlotCount = $derived(Math.max(0, MAX_ITEMS - activityItems.length));
</script>

<div class="rounded-2xl border border-Mist/60 bg-white p-5 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="font-serif text-base italic text-Dark">Activity</h3>
		<span
			class="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-Dark/35"
		>
			<span class="relative flex h-1.5 w-1.5">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
				></span>
				<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
			</span>
			Live
		</span>
	</div>

	<ul class="space-y-3.5">
		{#each activityItems as item (item.id)}
			<li class="flex items-start gap-3 min-h-[46px]">
				<div class="flex-shrink-0 rounded-lg p-1.5 {item.accent}">
					<item.Icon class="h-3.5 w-3.5" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-[12px] font-medium text-Dark leading-tight">{item.title}</p>
					<p class="mt-0.5 text-[11px] text-Dark/55 leading-snug truncate">{item.body}</p>
					<p class="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-Dark/35">
						{relativeTime(item.stamp)}
					</p>
				</div>
			</li>
		{/each}

		<!-- Reserved empty slots so the card always shows space for 6 entries -->
		{#each Array(emptySlotCount) as _, i}
			{@const isFirst = i === 0 && activityItems.length === 0}
			<li class="flex items-start gap-3 min-h-[46px]" aria-hidden={isFirst ? undefined : 'true'}>
				<div class="flex-shrink-0 rounded-lg bg-Mist/30 p-1.5">
					<UserPlus class="h-3.5 w-3.5 text-Dark/20" />
				</div>
				<div class="min-w-0 flex-1">
					{#if isFirst}
						<p class="text-[12px] font-medium text-Dark/40 leading-tight">No activity yet</p>
						<p class="mt-0.5 text-[11px] text-Dark/30 leading-snug">
							New bookings will appear here.
						</p>
					{:else}
						<div class="h-2 w-3/4 rounded bg-Mist/30"></div>
						<div class="mt-2 h-2 w-1/2 rounded bg-Mist/20"></div>
					{/if}
				</div>
			</li>
		{/each}
	</ul>

	<button
		class="mt-4 w-full rounded-lg border border-Mist/60 py-2 font-mono text-[10px] uppercase tracking-wider text-Dark/50 hover:bg-Mist/30 hover:text-Dark transition-colors"
	>
		View All
	</button>
</div>
