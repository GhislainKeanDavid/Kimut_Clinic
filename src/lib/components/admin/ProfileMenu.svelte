<script>
	import { enhance } from '$app/forms';
	import { Settings, Globe, Moon, User, LogOut, ChevronRight } from 'lucide-svelte';

	let { open = $bindable(false) } = $props();

	function close() {
		open = false;
	}

	const menuItems = [
		{ Icon: Settings, label: 'Settings', hasSubmenu: false },
		{ Icon: Globe, label: 'Language', hasSubmenu: true },
		{ Icon: Moon, label: 'Theme', hasSubmenu: true },
		{ Icon: User, label: 'Admin', hasSubmenu: false }
	];
</script>

{#if open}
	<!-- Click-outside backdrop -->
	<div class="fixed inset-0 z-40" role="presentation" onclick={close}></div>

	<!-- Floating menu — anchored above the Admin Profile button -->
	<div
		class="fixed z-50 bottom-[68px] left-[232px] w-52 rounded-2xl border border-Mist/70 bg-white shadow-2xl shadow-Dark/15 overflow-hidden"
	>
		<!-- Decorative accent line -->
		<div class="h-0.5 w-full bg-gradient-to-r from-Primary/60 to-Accent/40"></div>

		<div class="p-1.5">
			{#each menuItems as item}
				<button
					class="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 font-mono text-[11px] text-Dark/60 hover:bg-Mist/30 hover:text-Dark transition-colors text-left"
					onclick={close}
				>
					<item.Icon class="h-3.5 w-3.5 flex-shrink-0 text-Dark/40" />
					<span class="flex-1">{item.label}</span>
					{#if item.hasSubmenu}
						<ChevronRight class="h-3 w-3 text-Dark/25" />
					{/if}
				</button>
			{/each}
		</div>

		<div class="border-t border-Mist/50 p-1.5">
			<form action="/admin/logout" method="POST" use:enhance>
				<button
					type="submit"
					class="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 font-mono text-[11px] text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
				>
					<LogOut class="h-3.5 w-3.5 flex-shrink-0" />
					<span>Logout</span>
				</button>
			</form>
		</div>
	</div>
{/if}
