<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Navbar from '$lib/components/funnel/Navbar.svelte';
	import { ArrowUp } from 'lucide-svelte';
	import Hero from '$lib/components/funnel/Hero.svelte';
	import KimutAssessment from '$lib/components/funnel/KimutAssessment.svelte';
	import Conditions from '$lib/components/funnel/Conditions.svelte';
	import Philosophy from '$lib/components/funnel/Philosophy.svelte';
	import Team from '$lib/components/funnel/Team.svelte';
	import Testimonials from '$lib/components/funnel/Testimonials.svelte';
	import Facilities from '$lib/components/funnel/Facilities.svelte';
	import Insurance from '$lib/components/funnel/Insurance.svelte';
	import HoursLocation from '$lib/components/funnel/HoursLocation.svelte';
	import FinalCTA from '$lib/components/funnel/FinalCTA.svelte';
	import Footer from '$lib/components/funnel/Footer.svelte';
	import VoiceAgentWidget from '$lib/components/funnel/VoiceAgentWidget.svelte';

	let scrolled = $state(false);

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	onMount(() => {
		// Supabase invite emails land here with tokens in the URL hash (#access_token=...)
		// because the hash is never sent to the server and can't be caught by hooks.server.js.
		const hash = window.location.hash.slice(1);
		if (hash) {
			const params = new URLSearchParams(hash);
			const type = params.get('type');
			const accessToken = params.get('access_token');
			const hasError = params.has('error');
			if (type === 'invite' || type === 'recovery' || accessToken || hasError) {
				window.location.replace('/admin/reset-password' + window.location.hash);
				return;
			}
		}

		const handleScroll = () => {
			// Trigger earlier so the navbar changes color before completely leaving the hero
			const threshold = window.innerHeight * 0.85;
			scrolled = window.scrollY > threshold;
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll();

		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<svelte:head>
	<title>Kimut Clinic | Physical Therapy in Angeles City</title>
	<meta name="description" content="From pain to plan in under sixty seconds. Get a personalized physical therapy plan from PRC-licensed therapists in Pampanga — reviewed within 24 hours." />
</svelte:head>

<Navbar {scrolled} />

<main>
	<Hero />
	<KimutAssessment />
	<Conditions />
	<Philosophy />
	<Team />
	<Facilities />
	<Testimonials />
	<Insurance />
	<HoursLocation />
	<FinalCTA />
</main>

<Footer />
<VoiceAgentWidget />

{#if scrolled}
	<button
		transition:fade={{ duration: 200 }}
		class="fixed bottom-6 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-Primary text-Background shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 md:bottom-8 md:right-8"
		onclick={scrollToTop}
		aria-label="Scroll to top"
	>
		<ArrowUp size={24} />
	</button>
{/if}
