<script>
	import MagneticButton from '../primitives/MagneticButton.svelte';
</script>

<section class="w-full bg-Background py-24 sm:py-32 px-4 sm:px-6">
	<div class="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center overflow-hidden rounded-[3rem] bg-Accent px-6 py-24 text-center sm:py-32">
		<!-- Subtle Noise Override (specifically for the CTA block to make it richer) -->
		<div class="absolute inset-0 z-0 opacity-[0.08]" style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E&quot;);"></div>
		
		<div class="relative z-10 w-full max-w-2xl text-Background">
			<h2 class="mb-6 font-serif text-[clamp(3.5rem,8vw,6rem)] italic leading-[0.9] tracking-tight">
				Tell us where it hurts.
			</h2>
			<p class="mb-12 font-sans text-lg text-Background/80 sm:text-xl">
				Sixty seconds. One assessment. A plan that's yours.
			</p>
			
			<div class="mb-8">
				<MagneticButton href="#assessment" class="bg-Background text-Accent px-10 py-5 text-lg hover:bg-Background">
					<span class="absolute inset-0 translate-y-full bg-Dark transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-y-0"></span>
					<span class="relative z-10 font-medium group-hover:text-Background">Start Your Free Assessment</span>
				</MagneticButton>
			</div>

			<p class="font-mono text-[10px] uppercase tracking-widest text-Background/50">
				Encrypted intake · RA 10173 compliant · Never shared with third parties.
			</p>
		</div>
	</div>
</section>
