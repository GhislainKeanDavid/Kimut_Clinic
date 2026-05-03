<script>
	const team = [
		{
			name: 'Dr. Marco Reyes, RPT, PTRP',
			initials: 'MR',
			title: 'Clinic Director & Senior PT',
			prc: 'PRC #0045821',
			exp: '12 years',
			bio: 'Orthopedic and sports rehabilitation. Fellowship-trained in manual therapy.',
			image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&q=80&auto=format&fit=crop'
		},
		{
			name: 'Dr. Angela Santos, RPT, PTRP',
			initials: 'AS',
			title: 'Neurological Rehabilitation Specialist',
			prc: 'PRC #0051347',
			exp: '9 years',
			bio: 'Stroke recovery, vestibular therapy, balance training.',
			image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80&auto=format&fit=crop'
		},
		{
			name: 'Dr. Julian Dizon, RPT',
			initials: 'JD',
			title: 'Sports & Performance Therapist',
			prc: 'PRC #0062198',
			exp: '6 years',
			bio: 'ACL recovery, rotator cuff, return-to-sport programs.',
			image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80&auto=format&fit=crop'
		}
	];
</script>

<section id="team" class="w-full bg-Background py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-6">
		<div class="mb-16 text-center md:text-left">
			<p class="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-Accent">
				— LICENSED PRACTITIONERS
			</p>
			<h2 class="font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] italic tracking-tight text-Dark">
				The hands and minds behind every plan.
			</h2>
		</div>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			{#each team as member}
				<div class="group flex flex-col">
					<div class="relative mb-6 aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-Mist/20">
						<img
							src={member.image}
							alt={member.name}
							class="h-full w-full object-cover saturate-[0.8] grayscale transition-all duration-600 ease-out group-hover:scale-105 group-hover:grayscale-0 group-hover:saturate-100"
						/>
					</div>
					<div class="px-2">
						<span class="mb-3 block font-mono text-xs text-Accent">{member.initials}</span>
						<h3 class="mb-1 font-sans text-2xl font-medium text-Dark">{member.name}</h3>
						<p class="mb-6 font-mono text-[11px] uppercase tracking-widest text-Dark/60">
							{member.title}
						</p>
						
						<div class="mb-6 border-y border-Mist/60 py-3 font-mono text-sm text-Dark/70">
							<div class="flex justify-between">
								<span>{member.prc}</span>
								<span>{member.exp}</span>
							</div>
						</div>
						
						<p class="text-Dark/80 leading-relaxed">
							{member.bio}
						</p>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-24 pt-16 border-t border-Mist/60">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
				<div>
					<h3 class="font-serif text-[clamp(2rem,4vw,3rem)] italic tracking-tight text-Dark mb-6">
						At Kimut Clinic, You Are Safe!
					</h3>
					
					<p class="text-Dark/80 leading-relaxed mb-4">
						Kimut Clinic in Angeles City is officially granted the Safety Seal under the Safety Seal program of the Philippine government.
					</p>
					
					<p class="text-Dark/80 leading-relaxed mb-6 font-medium">
						This <span class="font-bold text-Dark">Safety Seal Certification</span> affirms that the clinic is 100% compliant to the minimum public health standards set by the government and that each integrates their contact tracing process.
					</p>
					
					<p class="text-Dark/80 leading-relaxed mb-10">
						Our clinic strived to gain this certification to ensure that our patients have peace of mind during their clinic visit. Kimut's value of compassionate care translates to initiatives such as this to provide constant reassurance that, aside from health, the safety and security of our people and patients matter.
					</p>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-sm bg-Accent/20 text-Accent">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							</div>
							<span class="text-sm font-medium text-Dark/80">27 Yrs Combined Exp</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-sm bg-Accent/20 text-Accent">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							</div>
							<span class="text-sm font-medium text-Dark/80">Latest Technology</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-sm bg-Accent/20 text-Accent">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							</div>
							<span class="text-sm font-medium text-Dark/80">PRC-Licensed PTs</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-sm bg-Accent/20 text-Accent">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							</div>
							<span class="text-sm font-medium text-Dark/80">Amazing Results Guaranteed</span>
						</div>
					</div>
				</div>

				<div class="relative">
					<div class="relative aspect-square w-full max-w-md mx-auto lg:ml-auto lg:mr-0 overflow-hidden rounded-[2rem] bg-Mist/20">
						<img 
							src="https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=80&auto=format&fit=crop" 
							alt="Safe Clinic Environment" 
							class="h-full w-full object-cover grayscale saturate-[0.5]"
						/>
						
						<!-- Safety Seal Badge overlay -->
						<div class="absolute -bottom-6 -left-6 z-10 flex flex-col items-center justify-center rounded-xl bg-Primary p-6 text-white shadow-xl rotate-[-3deg] border-4 border-Background scale-90 sm:scale-100">
							<div class="mb-2 text-sm font-bold tracking-widest uppercase text-Accent">Safety Seal</div>
							<div class="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-500 mb-3 shadow-inner">
								<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
							</div>
							<p class="text-center text-xs font-medium leading-tight opacity-90 max-w-[120px]">
								We follow safety & health protocols
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
