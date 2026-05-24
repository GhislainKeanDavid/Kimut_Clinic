<script>
	import { fly, fade } from 'svelte/transition';
	import { Globe, Phone, X } from 'lucide-svelte';
	import { toastStore } from '$lib/stores/toasts.svelte.js';

	function isVoiceSource(source) {
		const s = source?.toLowerCase() ?? '';
		return s === 'retell' || s === 'voice' || s === 'phone';
	}

	function sourceLabel(source) {
		const s = source?.toLowerCase() ?? '';
		if (s === 'retell') return 'Retell AI Voice';
		if (s === 'voice' || s === 'phone') return 'Voice Booking';
		return 'Web Booking';
	}
</script>

<div class="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
	{#each toastStore.list as toast (toast.id)}
		{@const isVoice = isVoiceSource(toast.source)}
		<div
			in:fly={{ x: 72, duration: 280, opacity: 0 }}
			out:fade={{ duration: 180 }}
			class="pointer-events-auto w-72 rounded-2xl border shadow-xl shadow-Dark/10 bg-white overflow-hidden
				{isVoice ? 'border-purple-200' : 'border-teal-200'}"
		>
			<!-- Accent strip -->
			<div class="h-1 w-full {isVoice ? 'bg-purple-500' : 'bg-teal-500'}"></div>

			<div class="p-4">
				<div class="flex items-start gap-3">
					<!-- Source icon -->
					<div
						class="mt-0.5 flex-shrink-0 rounded-lg p-2
							{isVoice ? 'bg-purple-50 text-purple-500' : 'bg-teal-50 text-teal-600'}"
					>
						{#if isVoice}
							<Phone class="h-4 w-4" />
						{:else}
							<Globe class="h-4 w-4" />
						{/if}
					</div>

					<div class="min-w-0 flex-1">
						<!-- Source chip -->
						<span
							class="mb-1 inline-block rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest
								{isVoice ? 'bg-purple-50 text-purple-600' : 'bg-teal-50 text-teal-700'}"
						>
							{sourceLabel(toast.source)}
						</span>
						<div class="truncate text-sm font-semibold leading-tight text-Dark">{toast.title}</div>
						{#if toast.body}
							<div class="mt-0.5 truncate font-mono text-[11px] text-Dark/50">{toast.body}</div>
						{/if}
					</div>

					<!-- Dismiss -->
					<button
						onclick={() => toastStore.dismiss(toast.id)}
						class="flex-shrink-0 rounded-lg p-1 text-Dark/30 transition-colors hover:bg-Mist/50 hover:text-Dark/60"
						aria-label="Dismiss"
					>
						<X class="h-3.5 w-3.5" />
					</button>
				</div>

				<!-- Progress bar -->
				<div class="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-Mist/40">
					<div
						class="h-full rounded-full {isVoice ? 'bg-purple-400' : 'bg-teal-400'}"
						style="animation: toast-shrink {toast.duration}ms linear forwards"
					></div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes toast-shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
