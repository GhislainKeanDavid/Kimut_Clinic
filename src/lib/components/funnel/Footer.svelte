<script>
	let currentYear = new Date().getFullYear();
</script>

<footer class="w-full rounded-t-[3rem] bg-Dark px-6 pb-8 pt-24 text-Background sm:pt-32">
	<div class="mx-auto max-w-7xl">
		<div class="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Col 1: Brand -->
			<div class="flex flex-col gap-4">
				<span class="font-sans text-2xl font-semibold tracking-tight text-Background">Kimut Clinic</span>
				<p class="text-sm text-Mist/60">
					Physical Therapy Clinic —<br />Angeles City, Pampanga
				</p>
			</div>

			<!-- Col 2: Quick Links -->
			<div class="flex flex-col gap-4">
				<h4 class="font-mono text-[11px] uppercase tracking-widest text-Mist/40">Quick Links</h4>
				<ul class="flex flex-col gap-3 text-sm text-Mist/80">
					<li><a href="#home" class="transition-colors hover:text-Accent">Home</a></li>
					<li><a href="#services" class="transition-colors hover:text-Accent">Services</a></li>
					<li><a href="#about" class="transition-colors hover:text-Accent">About</a></li>
					<li><a href="#testimonials" class="transition-colors hover:text-Accent">Testimonials</a></li>
					<li><a href="#contact" class="transition-colors hover:text-Accent">Contact</a></li>
					<li><a href="#assessment" class="text-Accent transition-colors hover:text-Background">Book Assessment</a></li>
				</ul>
			</div>

			<!-- Col 3: Contact -->
			<div class="flex flex-col gap-4">
				<h4 class="font-mono text-[11px] uppercase tracking-widest text-Mist/40">Contact</h4>
				<ul class="flex flex-col gap-3 text-sm text-Mist/80">
					<li>Emerald Bldg, Recto Street<br />Angeles City, Pampanga</li>
					<li><a href="tel:09123456789" class="transition-colors hover:text-Accent">0912 345 6789</a></li>
					<li><a href="mailto:info@kimutclinic.com" class="transition-colors hover:text-Accent">info@kimutclinic.com</a></li>
				</ul>
			</div>

			<!-- Col 4: Hours -->
			<div class="flex flex-col gap-4">
				<h4 class="font-mono text-[11px] uppercase tracking-widest text-Mist/40">Hours</h4>
				<ul class="flex flex-col gap-3 text-sm text-Mist/80">
					<li>Mon–Fri: 8:00 AM – 5:00 PM</li>
					<li>Sat: 8:00 AM – 12:00 PM</li>
					<li>Sun: Closed</li>
				</ul>
			</div>
		</div>

		<div class="mt-24 flex flex-col items-center justify-between gap-6 border-t border-Mist/20 pt-8 sm:flex-row">
			<div class="text-sm text-Mist/50">
				&copy; {currentYear} Kimut Clinic
			</div>
			
			<div class="flex items-center gap-6 text-sm text-Mist/50">
				<a href="#privacy" class="transition-colors hover:text-Mist">Privacy Policy</a>
				<a href="#terms" class="transition-colors hover:text-Mist">Terms</a>
			</div>
			
			<div class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-Mist/50">
				<span>SYSTEM OPERATIONAL · UPTIME 99.98%</span>
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
				</span>
			</div>
		</div>
	</div>
</footer>
