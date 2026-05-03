<script>
	const pillars = [
		{
			title: 'AI-Powered Intake',
			desc: 'Clinical insights before your first visit. Our system generates an Initial Clinical Summary the moment you submit.',
			svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-Accent"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` // Using generic simple stroke
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

<section id="why" class="w-full bg-Mist/10 py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-6">
		<div class="mb-16 text-center">
			<h2 class="font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] italic tracking-tight text-Dark">
				Why Kimut Clinic?
			</h2>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
			{#each pillars as pillar}
				<div class="group flex flex-col items-start gap-6 rounded-[2rem] border border-Mist/60 bg-white p-8 md:p-10 transition-all duration-400 ease-out hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
					<div class="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-Primary/5 transition-transform duration-400 group-hover:scale-110">
						{@html pillar.svg}
					</div>
					<div>
						<h3 class="mb-3 font-sans text-[22px] font-medium text-Dark">{pillar.title}</h3>
						<p class="text-Dark/70 leading-relaxed">{pillar.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
