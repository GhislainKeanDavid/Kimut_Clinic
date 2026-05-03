<script>
	let currentSlide = $state(0);
	
	const images = [
		'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80&auto=format&fit=crop', // PT stretching
		'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80&auto=format&fit=crop', // Clean room
		'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80&auto=format&fit=crop', // Medical equipment
		'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&q=80&auto=format&fit=crop'  // Massage/PT
	];

	function nextSlide() {
		currentSlide = (currentSlide + 1) % images.length;
	}

	function prevSlide() {
		currentSlide = (currentSlide - 1 + images.length) % images.length;
	}
	
	function goToSlide(index) {
		currentSlide = index;
	}
</script>

<section id="facilities" class="w-full bg-Mist/20 py-24 sm:py-32">
	<div class="mx-auto max-w-7xl px-6">
		<div class="mb-16 text-center">
			<h2 class="font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] italic tracking-tight text-Dark">
				Our Clinic Facilities
			</h2>
		</div>

		<div class="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
			<!-- Image Section (Carousel) -->
			<div class="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden rounded-[2rem] bg-Mist/20 group">
				{#each images as image, i}
					<img 
						src={image} 
						alt="Clinic Facilities {i + 1}" 
						class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out"
						style="opacity: {currentSlide === i ? 1 : 0}; z-index: {currentSlide === i ? 1 : 0};"
					/>
				{/each}

				<!-- Carousel Controls -->
				<button 
					class="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-Primary shadow-md opacity-0 transition-opacity duration-300 hover:bg-white group-hover:opacity-100"
					onclick={prevSlide}
					aria-label="Previous image"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
				</button>

				<button 
					class="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-Primary shadow-md opacity-0 transition-opacity duration-300 hover:bg-white group-hover:opacity-100"
					onclick={nextSlide}
					aria-label="Next image"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
				</button>

				<!-- Dots -->
				<div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
					{#each images as _, i}
						<button 
							class="h-2 rounded-full transition-all duration-300 {currentSlide === i ? 'w-6 bg-Primary' : 'w-2 bg-white/60 hover:bg-white'}"
							onclick={() => goToSlide(i)}
							aria-label="Go to slide {i + 1}"
						></button>
					{/each}
				</div>

				<!-- 100% Quality Badge -->
				<div class="absolute -bottom-4 -left-4 sm:bottom-6 sm:left-6 z-20 flex h-24 w-24 items-center justify-center rounded-full border-[1.5px] border-dashed border-Accent bg-Background shadow-lg scale-75 sm:scale-100 origin-bottom-left sm:origin-center">
					<div class="text-center font-serif leading-tight text-Accent">
						<span class="block text-xl font-bold">100%</span>
						<span class="block text-sm">Quality</span>
					</div>
				</div>
			</div>

			<!-- Content Section -->
			<div class="flex flex-col">
				<p class="mb-8 text-lg leading-relaxed text-Dark/80">
					At Kimut Clinic, we are committed to providing exceptional healthcare services in a comfortable and modern environment. Our clinic is designed to prioritize your health and well-being with state-of-the-art equipment, advanced medical technology, and a compassionate team dedicated to your care.
				</p>

				<div class="space-y-6">
					<div>
						<h3 class="mb-2 font-sans text-xl font-medium text-Dark">1. Modern Treatment Rooms</h3>
						<p class="text-Dark/70 leading-relaxed">
							Each of our treatment rooms is equipped with the latest medical equipment to ensure that you receive the best possible care. Whether you're here for routine checkups or specialized treatments, our rooms provide a calm and private setting to address your needs.
						</p>
					</div>

					<div>
						<h3 class="mb-2 font-sans text-xl font-medium text-Dark">2. Advanced Diagnostic Equipment</h3>
						<p class="text-Dark/70 leading-relaxed">
							We utilize the most advanced diagnostic tools available to accurately assess and treat a wide range of conditions. From state-of-the-art imaging technology to lab testing, our clinic ensures that your health is thoroughly evaluated using the best methods available.
						</p>
					</div>

					<div>
						<h3 class="mb-2 font-sans text-xl font-medium text-Dark">3. Clean and Hygienic Environment</h3>
						<p class="text-Dark/70 leading-relaxed">
							We adhere to the highest standards of cleanliness and hygiene in every part of our facility. Our staff follows strict protocols to maintain a safe and sanitary environment for both patients and staff.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
