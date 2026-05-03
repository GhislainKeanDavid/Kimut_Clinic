<script>
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { Phone, X } from 'lucide-svelte';
	import MagneticButton from '../primitives/MagneticButton.svelte';

	let isExpanded = $state(false);
	let widgetRef;
	let expandedRef;
	let collapsedRef;

	let phoneNumber = $state('');

	function toggleWidget() {
		isExpanded = !isExpanded;
		
		if (isExpanded) {
			gsap.to(collapsedRef, { opacity: 0, scale: 0.9, duration: 0.2, display: 'none' });
			gsap.fromTo(
				expandedRef,
				{ opacity: 0, y: 20, display: 'flex' },
				{ opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.1 }
			);
		} else {
			gsap.to(expandedRef, { opacity: 0, y: 20, duration: 0.2, display: 'none' });
			gsap.fromTo(
				collapsedRef,
				{ opacity: 0, scale: 0.9, display: 'flex' },
				{ opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out', delay: 0.1 }
			);
		}
	}

	function handleCall() {
		// Phase 1: store number, then use tel link fallback. 
		// Future: send to Retell API for outbound call
		if (phoneNumber) {
			localStorage.setItem('kimut_voice_phone', phoneNumber);
		}
		window.location.href = 'tel:09123456789';
	}
</script>

<div
	bind:this={widgetRef}
	class="fixed bottom-4 left-4 z-50 md:bottom-8 md:left-8"
>
	<!-- Collapsed State -->
	<div bind:this={collapsedRef} class="flex flex-col items-start gap-2">
		<span class="ml-4 font-mono text-[10px] uppercase tracking-widest text-Primary/60">
			AI RECEPTIONIST · 24/7
		</span>
		<button
			class="group flex items-center gap-3 rounded-full bg-Primary px-5 py-3 text-Background shadow-lg transition-transform hover:scale-[1.03]"
			onclick={toggleWidget}
			aria-label="Open voice agent"
		>
			<span class="relative flex h-2 w-2">
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-Accent opacity-75"></span>
				<span class="relative inline-flex h-2 w-2 rounded-full bg-Accent"></span>
			</span>
			<Phone size={18} strokeWidth={1.5} />
			<span class="font-sans font-medium">Talk to Kim</span>
		</button>
	</div>

	<!-- Expanded State -->
	<div
		bind:this={expandedRef}
		class="hidden w-[calc(100vw-2rem)] max-w-[320px] flex-col overflow-hidden rounded-[1.5rem] border border-Mist/60 bg-Background shadow-xl sm:w-[320px]"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-Mist/40 p-4">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-Accent/10 text-Accent">
					<span class="font-serif font-bold">K</span>
				</div>
				<div class="flex flex-col">
					<span class="font-sans text-sm font-medium text-Dark">Kim</span>
					<span class="font-mono text-[9px] uppercase tracking-widest text-Dark/50">AI Receptionist</span>
				</div>
			</div>
			<button onclick={toggleWidget} class="p-1 text-Dark/40 hover:text-Dark">
				<X size={18} />
			</button>
		</div>

		<!-- Body -->
		<div class="flex flex-col p-6">
			<p class="mb-6 font-serif text-xl italic leading-tight text-Dark">
				"Hi — I can book your appointment by phone. What's the best number to reach you?"
			</p>
			
			<div class="mb-4">
				<input
					type="tel"
					bind:value={phoneNumber}
					placeholder="+63 9XX XXX XXXX"
					class="w-full rounded-xl border border-Mist/60 px-4 py-3 text-sm outline-none focus:border-Accent focus:ring-1 focus:ring-Accent"
				/>
			</div>

			<MagneticButton class="w-full py-3" onclick={handleCall}>
				Call me now
			</MagneticButton>

			<div class="my-5 border-t border-Mist/40"></div>

			<a
				href="tel:09123456789"
				class="text-center font-mono text-[11px] font-medium uppercase tracking-widest text-Dark/60 transition-colors hover:text-Accent"
			>
				OR CALL DIRECTLY: 0912 345 6789
			</a>

			<p class="mt-6 text-center font-mono text-[9px] uppercase tracking-widest text-Dark/40">
				RA 10173 compliant · Calls recorded for quality.
			</p>
		</div>
	</div>
</div>
