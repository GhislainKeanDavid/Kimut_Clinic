<script>
	import { onMount } from 'svelte';
	import { MapPin, Phone, Mail } from 'lucide-svelte';
	import MagneticButton from '../primitives/MagneticButton.svelte';

	const schedule = [
		{ day: 'MON', time: '8:00 AM – 5:00 PM', open: true },
		{ day: 'TUE', time: '8:00 AM – 5:00 PM', open: true },
		{ day: 'WED', time: '8:00 AM – 5:00 PM', open: true },
		{ day: 'THU', time: '8:00 AM – 5:00 PM', open: true },
		{ day: 'FRI', time: '8:00 AM – 5:00 PM', open: true },
		{ day: 'SAT', time: '8:00 AM – 12:00 PM', open: true },
		{ day: 'SUN', time: 'CLOSED', open: false }
	];

	let isOpenNow = $state(false);

	onMount(() => {
		const checkStatus = () => {
			const d = new Date();
			const day = d.getDay(); // 0 = Sun, 1 = Mon
			const hour = d.getHours();
			if (day >= 1 && day <= 5) {
				isOpenNow = hour >= 8 && hour < 17;
			} else if (day === 6) {
				isOpenNow = hour >= 8 && hour < 12;
			} else {
				isOpenNow = false;
			}
		};
		checkStatus();
		const interval = setInterval(checkStatus, 60000);
		return () => clearInterval(interval);
	});
</script>

<section id="contact" class="w-full bg-Background py-24 sm:py-32 border-t border-Mist/40">
	<div class="mx-auto max-w-7xl px-6">
		<div class="grid grid-cols-1 gap-16 lg:grid-cols-2">
			<!-- Left: Hours -->
			<div class="flex flex-col justify-center">
				<div class="mb-10 flex items-center gap-4">
					<p class="font-mono text-[11px] uppercase tracking-[0.18em] text-Accent">
						— CLINIC HOURS
					</p>
					{#if isOpenNow}
						<div class="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 font-mono text-[10px] uppercase text-green-700">
							<span class="relative flex h-2 w-2">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
								<span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
							</span>
							Open Now
						</div>
					{:else}
						<div class="flex items-center gap-2 rounded-full border border-Mist bg-Mist/30 px-3 py-1 font-mono text-[10px] uppercase text-Dark/60">
							Closed
						</div>
					{/if}
				</div>

				<h2 class="mb-12 font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] italic tracking-tight text-Dark">
					Visit us in Angeles City.
				</h2>

				<div class="space-y-4 font-mono text-sm sm:text-base">
					{#each schedule as item}
						<div class="flex items-end {item.open ? 'text-Dark' : 'text-Dark/40'}">
							<span class="w-12 font-medium">{item.day}</span>
							<span class="flex-grow border-b-2 border-dotted border-Mist/60 mx-4 mb-1"></span>
							<span class="whitespace-nowrap">{item.time}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Right: Map -->
			<div class="flex flex-col gap-8">
				<div class="relative aspect-video w-full overflow-hidden rounded-[2rem] border border-Mist/60 bg-Mist/20">
					<iframe
						src="https://maps.google.com/maps?q=Emerald%20Bldg,%20Recto%20Street,%20Angeles%20City,%20Pampanga&t=&z=15&ie=UTF8&iwloc=&output=embed"
						width="100%"
						height="100%"
						style="border:0;"
						allowfullscreen=""
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						title="Clinic Location"
						class="absolute inset-0"
					></iframe>
				</div>

				<div class="flex flex-col gap-6 rounded-[2rem] border border-Mist/60 bg-white p-8">
					<div class="flex items-start gap-4">
						<MapPin class="mt-1 h-5 w-5 shrink-0 text-Accent" />
						<span class="font-sans text-Dark/80">Emerald Bldg, Recto Street,<br />Angeles City, Pampanga</span>
					</div>
					<div class="flex items-center gap-4">
						<Phone class="h-5 w-5 shrink-0 text-Accent" />
						<span class="font-sans text-Dark/80">0912 345 6789</span>
					</div>
					<div class="flex items-center gap-4">
						<Mail class="h-5 w-5 shrink-0 text-Accent" />
						<span class="font-sans text-Dark/80">info@kimutclinic.com</span>
					</div>

					<MagneticButton href="https://maps.google.com" target="_blank" rel="noopener noreferrer" class="mt-4 w-full py-4 sm:w-auto">
						Get Directions
					</MagneticButton>
				</div>
			</div>
		</div>
	</div>
</section>
