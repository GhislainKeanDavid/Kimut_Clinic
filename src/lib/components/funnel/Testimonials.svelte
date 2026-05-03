<script>
	const testimonials = [
		{
			quote: "I had chronic back pain for years. After eight sessions at Kimut Clinic, I can finally play with my kids again. The AI assessment was spot-on and Dr. Reyes' plan was perfect.",
			name: "Ricardo M.",
			tag: "BACK PAIN",
			stat: "8 SESSIONS"
		},
		{
			quote: "After my ACL surgery I was worried I'd never run again. Julian's sports rehab program got me back on the court in five months. The online intake was so convenient — I got a call within hours.",
			name: "Patricia L.",
			tag: "POST-SURGERY",
			stat: "5 MONTHS"
		},
		{
			quote: "My lola had a stroke and we didn't know where to turn. Dr. Santos was incredibly patient. The progress in three months is beyond what we hoped for.",
			name: "Miguel C.",
			tag: "NEURO REHAB",
			stat: "3 MONTHS"
		}
	];
</script>

<section
	id="testimonials"
	class="w-full bg-Mist/20 py-24 sm:py-32 overflow-hidden"
>
	<div class="mx-auto max-w-7xl px-6 mb-16">
		<p class="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-Accent">
			— RECOVERY STORIES
		</p>
		<h2 class="font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] italic tracking-tight text-Dark">
			What patients say.
		</h2>
	</div>

	<!-- Testimonials Grid -->
	<div class="mx-auto max-w-7xl px-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			{#each testimonials as testimonial}
				<div class="flex flex-col justify-between rounded-[2rem] border border-Mist/60 bg-white p-8 md:p-10 transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
					<p class="mb-10 font-serif text-[clamp(1.25rem,2vw,1.75rem)] italic leading-relaxed text-Dark">
						"{testimonial.quote}"
					</p>
					
					<div class="border-t border-Mist/60 pt-6 mt-auto">
						<div class="flex flex-col gap-4">
							<span class="font-sans font-medium text-Dark">{testimonial.name}</span>
							<div class="flex flex-wrap items-center gap-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-Dark/60">
								<span class="rounded-full bg-Accent/10 px-3 py-1 text-Accent">{testimonial.tag}</span>
								<span>{testimonial.stat}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
