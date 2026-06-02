<script>
	import { Activity, Dumbbell, Stethoscope, Bone, BrainCircuit, BriefcaseMedical } from 'lucide-svelte';

	const conditions = [
		{ title: 'Back & Neck Pain', desc: 'Disc, posture, chronic tension.', icon: Activity },
		{ title: 'Sports Injuries', desc: 'ACL, rotator cuff, return-to-play.', icon: Dumbbell },
		{ title: 'Post-Surgery Rehab', desc: 'Knee, hip, shoulder, spine.', icon: Stethoscope },
		{ title: 'Joint Pain & Arthritis', desc: 'Mobility, strength, daily function.', icon: Bone },
		{ title: 'Neurological Conditions', desc: 'Stroke, vestibular, balance.', icon: BrainCircuit },
		{ title: 'Workplace Injuries', desc: 'Repetitive strain, ergonomics.', icon: BriefcaseMedical }
	];
</script>

<section id="services" class="w-full bg-Mist/30 py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-6">
		<div class="mb-16 text-center md:text-left">
			<p class="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-Accent">
				— CONDITIONS WE TREAT
			</p>
			<h2 class="font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] italic tracking-tight text-Dark">
				Expert care, across the body.
			</h2>
		</div>

		<div class="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
		{#each conditions as condition}
			{@const Icon = condition.icon}
			<div class="group flex flex-col items-start gap-3 sm:gap-6 rounded-xl sm:rounded-[2rem] border border-Mist/60 bg-white p-5 sm:p-8 transition-all duration-400 ease-out hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
				<div class="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-lg sm:rounded-[1.25rem] bg-Primary/5 transition-transform duration-400 group-hover:scale-110">
					<Icon class="h-5 w-5 sm:h-8 sm:w-8 text-Primary transition-colors duration-400 group-hover:text-Accent" strokeWidth={1.5} />
				</div>
				<div>
					<h3 class="mb-1 sm:mb-2 font-sans text-[15px] sm:text-[22px] font-medium text-Dark leading-snug">{condition.title}</h3>
					<p class="text-xs sm:text-base text-Dark/70 leading-snug">{condition.desc}</p>
				</div>
			</div>
		{/each}
	</div>
	</div>
</section>
