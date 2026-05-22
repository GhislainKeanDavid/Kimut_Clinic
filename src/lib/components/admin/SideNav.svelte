<script>
	import { Activity, ArrowLeft, Users, BarChart2, User } from 'lucide-svelte';

	let { activeView = $bindable('patients'), onProfileClick } = $props();

	const groups = [
		{
			label: 'Patient Management',
			items: [
				{ id: 'patients', label: 'Patient List', Icon: Users },
				{ id: 'analytics', label: 'Funnel Analytics', Icon: BarChart2 }
			]
		}
	];
</script>

<nav class="w-56 flex-shrink-0 bg-Primary flex flex-col h-screen sticky top-0 overflow-hidden">
	<!-- Logo + Back -->
	<div class="px-4 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
		<div class="flex items-center gap-2 mb-5">
			<Activity class="h-4 w-4 text-white/55" />
			<span class="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 font-medium">
				Kimut Admin
			</span>
		</div>
		<a
			href="/"
			class="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors group"
		>
			<ArrowLeft class="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
			<span class="font-mono text-[10px] uppercase tracking-wider">Back to site</span>
		</a>
	</div>

	<!-- Navigation groups -->
	<div class="flex-1 px-3 py-5 overflow-y-auto">
		{#each groups as group}
			<div class="mb-5">
				<p class="px-2 mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-white/22">
					{group.label}
				</p>
				<div class="space-y-0.5">
					{#each group.items as item}
						<button
							onclick={() => (activeView = item.id)}
							class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-mono text-[11px] text-left transition-all duration-150
								{activeView === item.id
									? 'bg-white/[0.14] text-white font-medium shadow-sm'
									: 'text-white/42 hover:bg-white/[0.07] hover:text-white/72'}"
						>
							<item.Icon class="h-3.5 w-3.5 flex-shrink-0" />
							{item.label}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Admin Profile (bottom) -->
	<div class="px-3 py-4 border-t border-white/10 flex-shrink-0">
		<button
			onclick={onProfileClick}
			class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all hover:bg-white/10 group text-left"
		>
			<div
				class="h-7 w-7 rounded-full bg-white/[0.13] flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors"
			>
				<User class="h-3.5 w-3.5 text-white/60" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="font-mono text-[11px] text-white/55 group-hover:text-white/80 transition-colors truncate leading-none">
					Admin Profile
				</p>
			</div>
		</button>
	</div>
</nav>
