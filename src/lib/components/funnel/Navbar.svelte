<script>
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { Menu, X } from 'lucide-svelte';
	import MagneticButton from '../primitives/MagneticButton.svelte';

	let { scrolled = false } = $props();
	let mobileMenuOpen = $state(false);
	let mobileMenuRef;

	let links = [
		{ name: 'Services', href: '#services' },
		{ name: 'About', href: '#about' },
		{ name: 'Testimonials', href: '#testimonials' }
	];

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
		if (mobileMenuOpen) {
			gsap.to(mobileMenuRef, {
				clipPath: 'circle(150% at calc(100% - 2rem) 2rem)',
				duration: 0.6,
				ease: 'power3.inOut'
			});
		} else {
			gsap.to(mobileMenuRef, {
				clipPath: 'circle(0% at calc(100% - 2rem) 2rem)',
				duration: 0.6,
				ease: 'power3.inOut'
			});
		}
	}

	onMount(() => {
		gsap.set(mobileMenuRef, { clipPath: 'circle(0% at calc(100% - 2rem) 2rem)' });
	});
</script>

<nav
	class="absolute left-1/2 top-5 z-50 flex w-[calc(100%-2rem)] max-w-[800px] lg:w-max lg:px-6 -translate-x-1/2 items-center justify-between gap-8 lg:gap-12 rounded-full px-5 py-3 bg-Background text-Primary shadow-md border border-Mist/60"
>
	<!-- Logo -->
	<a href="#home" class="font-sans text-xl font-semibold tracking-tight">Kimut Clinic</a>

	<!-- Desktop Links -->
	<div class="hidden items-center gap-6 md:flex">
		{#each links as link}
			<a
				href={link.href}
				class="relative text-sm font-medium transition-colors hover:text-Accent group"
			>
				{link.name}
				<span
					class="absolute -bottom-1 left-0 h-[1px] w-0 bg-Accent transition-all duration-[350ms] ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:w-full"
				></span>
			</a>
		{/each}
	</div>

	<!-- CTA & Mobile Toggle -->
	<div class="flex items-center gap-4">
		<MagneticButton href="#assessment" class="hidden md:inline-flex px-6 py-2 text-sm">
			Book Assessment
		</MagneticButton>
		<button
			class="flex h-10 w-10 items-center justify-center rounded-full bg-Primary/10 md:hidden"
			onclick={toggleMobileMenu}
			aria-label="Toggle Menu"
		>
			<Menu size={20} />
		</button>
	</div>
</nav>

<!-- Mobile Menu Overlay -->
<div
	bind:this={mobileMenuRef}
	class="fixed inset-0 z-[60] flex flex-col justify-center bg-Background px-8 text-Primary"
>
	<button
		class="absolute right-6 top-8 flex h-10 w-10 items-center justify-center rounded-full bg-Primary/10"
		onclick={toggleMobileMenu}
		aria-label="Close Menu"
	>
		<X size={20} />
	</button>

	<div class="flex flex-col gap-8 text-4xl font-serif">
		{#each links as link}
			<a
				href={link.href}
				onclick={toggleMobileMenu}
				class="hover:text-Accent transition-colors"
			>
				{link.name}
			</a>
		{/each}
		<a href="#assessment" onclick={toggleMobileMenu} class="text-Accent mt-4">
			Book Assessment
		</a>
	</div>
</div>
