<script>
	let failedLogos = $state({});

	const partners = [
		{ name: 'Sun Life', logo: '/logos/sunlife.webp', imgClass: 'h-[120px]' },
		{ name: 'Pru Life UK', logo: '/logos/Pru-Life-Logo.png', imgClass: 'h-[120px]' },
		{ name: 'AXA', logo: '/logos/AXA_Logo.svg.png', imgClass: 'h-[80px]' },
		{ name: 'Manulife', logo: '/logos/manulife-logo-2018-.svg' },
		{ name: 'PhilHealth', logo: '/logos/Philippine_Health_Insurance_Corporation_(PhilHealth).svg' },
		{ name: 'Maxicare', logo: '/logos/Maxicare_larger_logo.png' },
		{ name: 'Intellicare', logo: '/logos/Intellicare_green-play.png' },
		{ name: 'Medicard', logo: '/logos/MediCard-Logo-Coloredv2.png' }
	];
</script>

<section class="w-full bg-Mist/30 px-6 py-12">
	<div class="mx-auto w-full max-w-7xl">
	<p class="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-Accent">
		— ACCEPTED INSURANCE PARTNERS
	</p>
	<div class="relative flex w-full overflow-hidden rounded-[2rem] bg-Mist/30 px-4 py-8">
		<!-- Marquee wrapper -->
		<div class="marquee-track flex w-max items-center">
			<!-- Duplicate list for seamless scrolling -->
			{#each [1, 2] as _}
				<div class="flex items-center">
					{#each partners as partner}
						<div class="group relative mx-10 flex h-16 items-center justify-center transition-transform hover:scale-105">
							{#if !failedLogos[partner.name]}
								<img
									src={partner.logo}
									alt="{partner.name} logo"
									class="w-auto max-w-[160px] object-contain opacity-90 transition-all duration-400 group-hover:opacity-100 {partner.imgClass ?? 'h-10'}"
									onerror={() => failedLogos[partner.name] = true}
								/>
							{/if}
							{#if failedLogos[partner.name]}
								<span class="font-sans text-2xl font-medium text-Dark/80 whitespace-nowrap opacity-80 transition-opacity group-hover:opacity-100">{partner.name}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
	</div>
</section>

<style>
	.marquee-track {
		animation: marquee 30s linear infinite;
	}

	.marquee-track:hover {
		animation-play-state: paused;
	}

	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}
</style>
