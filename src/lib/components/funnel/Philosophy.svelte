<script>
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	let philRef;
	let bgRef;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		const ctx = gsap.context(() => {
			// Parallax background
			gsap.to(bgRef, {
				yPercent: 30,
				ease: 'none',
				scrollTrigger: {
					trigger: philRef,
					start: 'top bottom',
					end: 'bottom top',
					scrub: true
				}
			});

			// Staggered reveal for words using a simple CSS split (since SplitText is premium)
			const words = gsap.utils.toArray('.phil-word');
			gsap.fromTo(
				words,
				{ opacity: 0, y: 20, filter: 'blur(8px)' },
				{
					opacity: 1,
					y: 0,
					filter: 'blur(0px)',
					duration: 1,
					stagger: 0.08,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: philRef,
						start: 'top 75%'
					}
				}
			);
		}, philRef);

		return () => ctx.revert();
	});

	// Simple helper to split text into word spans
	function splitText(text) {
		return text.split(' ').map(word => `<span class="phil-word inline-block">${word}</span>`).join(' ');
	}

	const pillars = [
		{
			title: 'AI-Powered Intake',
			desc: 'Clinical insights before your first visit. Our system generates an Initial Clinical Summary the moment you submit.',
			svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-Accent"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
		},
		{
			title: 'Expert PT Team',
			desc: 'PRC-licensed physical therapists with deep specialization. Hands-on, evidence-based, never templated.',
			svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-Accent"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`
		},
		{
			title: 'Fast Response',
			desc: 'A licensed PT reviews your intake and contacts you within 24 hours. No waiting weeks for a callback.',
			svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-Accent"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
		},
		{
			title: 'Personalized Care',
			desc: 'Every plan is built around your goals, lifestyle, and condition. No two recoveries look the same.',
			svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-Accent"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
		}
	];
</script>

<section
	bind:this={philRef}
	id="about"
	class="relative flex min-h-[80vh] w-full items-center justify-center overflow-hidden rounded-t-[3rem] bg-Primary px-6 py-32"
>
	<!-- Parallax background -->
	<div
		bind:this={bgRef}
		class="absolute -top-[20%] left-0 h-[140%] w-full opacity-15"
	>
		<img
			src="https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?w=1600&q=80&auto=format&fit=crop"
			alt="Nature texture"
			class="h-full w-full object-cover grayscale mix-blend-overlay"
		/>
	</div>

	<!-- Content -->
	<div class="relative z-10 mx-auto w-full max-w-4xl text-center text-Background">
		<p class="mb-8 font-sans text-xl opacity-60 sm:text-2xl">
			{@html splitText('Most clinics treat the symptom.')}
		</p>
		<h2 class="mb-12 font-serif text-[clamp(3.5rem,8vw,7.5rem)] italic leading-[0.9] tracking-tight">
			{@html splitText('We treat the')} <span class="text-Accent phil-word inline-block">movement.</span>
		</h2>
		<p class="mx-auto mb-24 max-w-[580px] text-lg leading-relaxed opacity-70">
			The Kimut origin story — "Kimut" means movement in Kapampangan. AI-powered intake meets
			PRC-licensed expertise. Founded in Angeles City to make world-class PT accessible to every Filipino.
		</p>

		<!-- Pillars grid integrated into Philosophy -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 text-left">
			{#each pillars as pillar}
				<div class="group flex flex-col items-start gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-10 transition-all duration-400 ease-out hover:-translate-y-2 hover:bg-white/10">
					<div class="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white/10 transition-transform duration-400 group-hover:scale-110">
						{@html pillar.svg}
					</div>
					<div>
						<h3 class="mb-3 font-sans text-[22px] font-medium text-Background">{pillar.title}</h3>
						<p class="text-Background/70 leading-relaxed">{pillar.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
