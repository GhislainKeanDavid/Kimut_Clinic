<script>
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import SplitText from 'gsap/SplitText'; // We don't have GSAP premium SplitText by default, so I will do manual char split or word split
	import MagneticButton from '../primitives/MagneticButton.svelte';

	let heroRef;
	let eyebrowRef;
	let line1Ref;
	let line2Ref;
	let subheadRef;
	let ctaRef;
	let trustRef;

	onMount(() => {
		const ctx = gsap.context(() => {
			// Basic entrance timeline without relying on premium GSAP plugins
			const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

			tl.fromTo(eyebrowRef, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 0.2)
				.fromTo(
					line1Ref,
					{ opacity: 0, y: 20 },
					{ opacity: 1, y: 0, duration: 0.8 },
					0.4
				)
				.fromTo(
					line2Ref,
					{ opacity: 0, y: 30, filter: 'blur(8px)' },
					{ opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2 },
					0.6
				)
				.fromTo(
					subheadRef,
					{ opacity: 0, y: 20 },
					{ opacity: 1, y: 0, duration: 0.8 },
					0.8
				)
				.fromTo(
					ctaRef,
					{ opacity: 0, y: 20 },
					{ opacity: 1, y: 0, duration: 0.8 },
					1.0
				)
				.fromTo(
					trustRef,
					{ opacity: 0 },
					{ opacity: 1, duration: 1.0 },
					1.2
				);
		}, heroRef);

		return () => ctx.revert();
	});
</script>

<section
	bind:this={heroRef}
	id="home"
	class="relative flex min-h-[720px] h-[100dvh] w-full overflow-hidden bg-Dark"
>
	<!-- Background Image with Ken Burns effect -->
	<div class="absolute inset-0 z-0 overflow-hidden">
		<img
			src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1600&q=80&auto=format&fit=crop"
			alt="Physical therapy session"
			class="h-full w-full object-cover animate-[kenburns_20s_infinite_alternate]"
		/>
		<!-- Gradient Overlay -->
		<div
			class="absolute inset-0 bg-gradient-to-tr from-Primary/90 via-Primary/50 to-Primary/10 sm:via-Primary/60 sm:to-transparent"
		></div>
	</div>

	<!-- Content Container -->
	<div class="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-end px-6 pb-24 sm:justify-center pt-24 sm:pb-0">
		<div class="max-w-2xl text-Background">
			<!-- Headings -->
			<h1 class="mb-6 flex flex-col gap-2">
				<span
					bind:this={line1Ref}
					class="font-sans text-[clamp(2.5rem,5vw,5rem)] font-medium leading-[0.95] tracking-tight"
				>
					From pain to plan in
				</span>
				<span
					bind:this={line2Ref}
					class="font-serif text-[clamp(3rem,7vw,7rem)] italic leading-[0.9] tracking-tight text-Mist"
				>
					under <span class="text-Accent">sixty</span> seconds.
				</span>
			</h1>

			<!-- Subhead -->
			<p bind:this={subheadRef} class="mb-10 max-w-[540px] text-lg leading-relaxed text-Mist/90">
				Tell us where it hurts. Get a personalized physical therapy plan from PRC-licensed
				therapists in Pampanga — reviewed within 24 hours.
			</p>

			<!-- CTAs -->
			<div bind:this={ctaRef} class="mb-12 flex flex-wrap items-center gap-6">
				<MagneticButton href="#assessment" class="px-8 py-4 text-base">
					Start Your Free Assessment
				</MagneticButton>
				<a
					href="#how-it-works"
					class="font-sans font-medium text-Background transition-colors hover:text-Accent relative group"
				>
					How it works &darr;
					<span class="absolute -bottom-1 left-0 h-[1px] w-0 bg-Accent transition-all duration-300 group-hover:w-full"></span>
				</a>
			</div>

			<!-- Trust Strip -->
			<div
				bind:this={trustRef}
				class="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-Mist/60 sm:text-[11px]"
			>
				<span>PRC LICENSED THERAPISTS</span>
				<span>·</span>
				<span>AI-POWERED INTAKE</span>
				<span>·</span>
				<span>24-HOUR RESPONSE</span>
			</div>
		</div>
	</div>

	<!-- Scroll Indicator -->
	<div class="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
		<span class="font-mono text-[10px] uppercase tracking-widest text-Mist/80">Scroll</span>
		<div class="h-[60px] w-[1px] bg-Mist/20 relative overflow-hidden">
			<div class="absolute top-0 left-0 h-1/3 w-full bg-Mist animate-[scrolldown_2s_infinite]"></div>
		</div>
	</div>
</section>

<style>
	@keyframes kenburns {
		0% {
			transform: scale(1);
		}
		100% {
			transform: scale(1.08);
		}
	}
	@keyframes scrolldown {
		0% {
			transform: translateY(-100%);
		}
		100% {
			transform: translateY(300%);
		}
	}
</style>
