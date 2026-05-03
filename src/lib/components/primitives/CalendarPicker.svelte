<script>
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	let {
		value = $bindable(''),
		minDate = '',
		fullyBookedDates = [],
		isLoading = false,
		onMonthChange = undefined,
		onSelect = undefined
	} = $props();

	const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'];
	const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let viewYear = $state(today.getFullYear());
	let viewMonth = $state(today.getMonth()); // 0-indexed

	const minDateObj = $derived(minDate ? new Date(minDate + 'T00:00:00') : today);
	const bookedSet = $derived(new Set(fullyBookedDates));

	const calendarDays = $derived(buildCalendar(viewYear, viewMonth));

	function buildCalendar(year, month) {
		const firstWeekday = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const days = Array(firstWeekday).fill(null);

		for (let d = 1; d <= daysInMonth; d++) {
			const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			const dt = new Date(ds + 'T00:00:00');
			days.push({
				d,
				ds,
				isSunday: dt.getDay() === 0,
				isPast: dt < minDateObj,
				isFullyBooked: bookedSet.has(ds),
				isSelected: ds === value,
				isToday: dt.getTime() === today.getTime()
			});
		}
		// Always pad to 42 cells (6 rows × 7) so the grid height never changes
		while (days.length < 42) days.push(null);
		return days;
	}

	const canGoPrev = $derived(
		new Date(viewYear, viewMonth - 1, 1) >= new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1)
	);

	function monthStr(year, month) {
		return `${year}-${String(month + 1).padStart(2, '0')}`;
	}

	function prevMonth() {
		if (!canGoPrev) return;
		if (viewMonth === 0) { viewMonth = 11; viewYear--; }
		else viewMonth--;
		onMonthChange?.(monthStr(viewYear, viewMonth));
	}

	function nextMonth() {
		if (viewMonth === 11) { viewMonth = 0; viewYear++; }
		else viewMonth++;
		onMonthChange?.(monthStr(viewYear, viewMonth));
	}

	function select(day) {
		if (!day || day.isSunday || day.isPast || day.isFullyBooked) return;
		value = day.ds;
		onSelect?.(day.ds);
	}
</script>

<div class="select-none rounded-2xl border border-Mist/60 bg-white p-4">
	<!-- Header -->
	<div class="mb-4 flex items-center justify-between">
		<button
			onclick={prevMonth}
			disabled={!canGoPrev}
			class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-Mist/40 disabled:cursor-not-allowed disabled:opacity-30"
			aria-label="Previous month"
		>
			<ChevronLeft class="h-4 w-4" />
		</button>
		<span class="font-medium text-Dark">
			{MONTH_NAMES[viewMonth]} {viewYear}
		</span>
		<button
			onclick={nextMonth}
			class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-Mist/40"
			aria-label="Next month"
		>
			<ChevronRight class="h-4 w-4" />
		</button>
	</div>

	<!-- Day headers -->
	<div class="mb-2 grid grid-cols-7 gap-1">
		{#each DAY_LABELS as label}
			<div class="text-center font-mono text-[10px] uppercase tracking-wide text-Dark/40">
				{label}
			</div>
		{/each}
	</div>

	<!-- Days grid -->
	<div class="relative grid grid-cols-7 gap-1">
		{#each calendarDays as day}
			{#if day === null}
				<div class="h-9"></div>
			{:else}
				{@const disabled = day.isSunday || day.isPast || day.isFullyBooked}
				<button
					onclick={() => select(day)}
					{disabled}
					class="relative flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors
						{day.isSelected
							? 'bg-Accent font-semibold text-white'
							: disabled
								? 'cursor-not-allowed text-Dark/25'
								: 'hover:bg-Accent/10 hover:text-Accent text-Dark'}
						{day.isToday && !day.isSelected ? 'ring-1 ring-Accent/50' : ''}"
				>
					{day.d}
					{#if day.isFullyBooked && !day.isPast && !day.isSunday}
						<span class="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-Dark/20"></span>
					{/if}
				</button>
			{/if}
		{/each}

		{#if isLoading}
			<div class="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
				<div class="h-5 w-5 animate-spin rounded-full border-2 border-Mist border-t-Accent"></div>
			</div>
		{/if}
	</div>

	<!-- Legend -->
	<div class="mt-3 flex flex-wrap items-center gap-4 border-t border-Mist/30 pt-3 text-xs text-Dark/50">
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 rounded-full bg-Dark/20"></span>
			Fully booked
		</span>
		<span class="flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 rounded-full bg-Dark/20 opacity-30"></span>
			Unavailable
		</span>
	</div>
</div>
