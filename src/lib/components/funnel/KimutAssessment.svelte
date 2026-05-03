<script>
	import { onMount, tick } from 'svelte';
	import gsap from 'gsap';
	import { User, Activity, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-svelte';
	import { logFunnelEvent, getSessionId } from '$lib/analytics.js';
	import MagneticButton from '../primitives/MagneticButton.svelte';
	import CalendarPicker from '../primitives/CalendarPicker.svelte';

	let currentStep = $state(1);
	let isSubmitting = $state(false);
	let submitError = $state(null);
	let isSuccess = $state(false);

	let formData = $state({
		concernCategory: '',
		durationDays: 14,
		severity: 5,
		full_name: '',
		age: '',
		sex: '',
		email: '',
		phone_number: '',
		occupation: '',
		service: '',
		datetime: '',
		additional_notes: ''
	});

	let stepsContainer;
	let session_id = '';

	const totalSteps = 6;

	const concerns = [
		{ id: 'Back & Neck Pain', desc: 'Chronic tension, disc issues, posture-related pain.' },
		{ id: 'Sports Injury', desc: 'ACL, rotator cuff, sprains, return-to-sport.' },
		{ id: 'Post-Surgery Recovery', desc: 'Knee, hip, shoulder, spine post-op.' },
		{ id: 'Joint Pain & Arthritis', desc: 'Mobility, stiffness, daily function.' },
		{ id: 'Neurological', desc: 'Stroke recovery, vestibular, balance.' },
		{ id: 'Something Else', desc: 'Workplace, posture, wellness, or unsure.' }
	];

	const services = [
		{ id: 'Manual Therapy', desc: 'Hands-on mobilization for back, neck, joint pain.' },
		{ id: 'Sports Rehabilitation', desc: 'ACL, rotator cuff, return-to-sport programs.' },
		{ id: 'Post-Surgery Recovery', desc: 'Knee, hip, shoulder, spine post-op rehab.' },
		{ id: 'Neurological Rehabilitation', desc: 'Stroke recovery, vestibular, balance.' },
		{ id: 'Pain Management', desc: 'Chronic pain, arthritis, repetitive strain.' },
		{ id: 'Wellness & Posture', desc: 'Postural correction, ergonomic coaching.' }
	];

	// date -> { booked_slots: string[], fully_booked: boolean }
	let dateAvailability = $state({});
	// month string -> string[] of fully booked dates
	let monthFullyBooked = $state({});
	let selectedDateStr = $state('');
	let isLoadingSlots = $state(false);
	let isLoadingMonth = $state(false);

	onMount(() => {
		session_id = getSessionId();
		logFunnelEvent('form_started');
		fetchMonthAvailability(currentMonthStr());
	});

	function getTodayStr() {
		return new Date().toISOString().split('T')[0];
	}

	function currentMonthStr() {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	}

	async function fetchMonthAvailability(monthStr) {
		if (monthFullyBooked[monthStr] !== undefined) return;
		isLoadingMonth = true;
		try {
			const res = await fetch(`/api/calendar-availability?month=${monthStr}`);
			if (res.ok) {
				const data = await res.json();
				monthFullyBooked[monthStr] = data.fully_booked_dates || [];
			}
		} catch (e) {
			console.error('Failed to fetch month availability', e);
			monthFullyBooked[monthStr] = [];
		} finally {
			isLoadingMonth = false;
		}
	}

	async function fetchDateSlots(dateStr) {
		if (dateAvailability[dateStr]) return;
		isLoadingSlots = true;
		try {
			const res = await fetch(`/api/calendar-availability?date=${dateStr}`);
			if (res.ok) {
				dateAvailability[dateStr] = await res.json();
			} else {
				dateAvailability[dateStr] = { booked_slots: [], fully_booked: false };
			}
		} catch (e) {
			console.error('Failed to fetch date slots', e);
			dateAvailability[dateStr] = { booked_slots: [], fully_booked: false };
		} finally {
			isLoadingSlots = false;
		}
	}

	// Collect all fully booked dates across loaded months
	const allFullyBookedDates = $derived(
		Object.values(monthFullyBooked).flat()
	);

	async function handleCalendarSelect(dateStr) {
		selectedDateStr = dateStr;
		formData.datetime = '';
		await fetchDateSlots(dateStr);
	}

	async function handleMonthChange(monthStr) {
		await fetchMonthAvailability(monthStr);
	}

	async function nextStep() {
		if (currentStep < totalSteps) {
			logFunnelEvent(`step_${currentStep}_completed`);
			currentStep++;
			await tick();
			animateTransition();
		}
	}

	async function prevStep() {
		if (currentStep > 1) {
			currentStep--;
			await tick();
			animateTransition(true);
		}
	}

	function animateTransition(reverse = false) {
		const direction = reverse ? -60 : 60;
		gsap.fromTo(
			stepsContainer.children,
			{ opacity: 0, x: direction },
			{ opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }
		);
	}

	async function submitAssessment() {
		isSubmitting = true;
		submitError = null;

		try {
			const res = await fetch('/api/submit-assessment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...formData, session_id })
			});

			const result = await res.json();

			if (result.success) {
				logFunnelEvent('submitted');
				isSuccess = true;
			} else {
				if (result.reason === 'duplicate') {
					submitError = "It looks like you already have a booking with this email and time. Email us at info@kimutclinic.com if this is a mistake.";
				} else {
					submitError = "We encountered an error while submitting your assessment. Please try again.";
				}
				logFunnelEvent('submission_failed', { reason: result.reason });
			}
		} catch (e) {
			submitError = "Network error. Please check your connection and try again.";
			logFunnelEvent('submission_failed', { reason: 'network_error' });
		} finally {
			isSubmitting = false;
		}
	}

	function generateSlots(dateStr) {
		const d = new Date(dateStr + 'T00:00:00');
		const day = d.getDay();
		if (day === 0) return [];
		const endHour = day === 6 ? 12 : 17;
		const slots = [];
		for (let h = 8; h < endHour; h++) {
			slots.push(`${String(h).padStart(2, '0')}:00`);
		}
		return slots;
	}

	function formatTime(slot) {
		const h = parseInt(slot);
		const period = h < 12 ? 'AM' : 'PM';
		const display = h === 12 ? 12 : h % 12;
		return `${display}:00 ${period}`;
	}

	let step3Valid = $derived(
		!!formData.full_name &&
		!!formData.age &&
		!!formData.sex &&
		!!formData.email &&
		!!formData.phone_number
	);
</script>

<section id="assessment" class="w-full bg-Primary py-24">
	<div class="mx-auto max-w-4xl px-6">
		<div class="mb-16 text-center">
			<p class="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-Accent">
				— THE KIMUT ASSESSMENT
			</p>
			<h2 class="mb-4 font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] italic text-Background">
				From pain to plan.
			</h2>
			<p class="mx-auto max-w-2xl text-lg text-Background/70">
				Three minutes. Zero waiting rooms. Reviewed by a PRC-licensed therapist within 24 hours.
			</p>
			<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
				<span class="rounded-full border border-Background/20 bg-Background/10 px-4 py-1.5 font-mono text-xs text-Background/80">~ 3 minutes</span>
				<span class="rounded-full border border-Background/20 bg-Background/10 px-4 py-1.5 font-mono text-xs text-Background/80">PRC-Licensed Therapists</span>
				<span class="rounded-full border border-Background/20 bg-Background/10 px-4 py-1.5 font-mono text-xs text-Background/80">Response within 24 hrs</span>
			</div>
		</div>

		{#if !isSuccess}
			<div class="relative w-full overflow-hidden rounded-[2rem] border border-Mist/40 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-12">
				<!-- Progress Bar -->
				<div class="absolute left-0 top-0 h-1.5 w-full bg-Mist/20">
					<div
						class="h-full bg-Accent transition-all duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"
						style="width: {(currentStep / totalSteps) * 100}%"
					></div>
				</div>

				<!-- Submission loading overlay -->
				{#if isSubmitting}
					<div class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-[2rem] bg-white/95 backdrop-blur-sm">
						<div class="h-14 w-14 animate-spin rounded-full border-4 border-Mist/40 border-t-Accent"></div>
						<p class="font-medium text-Dark/60">Submitting your assessment…</p>
					</div>
				{/if}

				<div bind:this={stepsContainer} class="min-h-[400px]">
					<!-- STEP 1 -->
					{#if currentStep === 1}
						<div class="step">
							<h3 class="mb-8 text-2xl font-medium text-Dark">What brings you in today?</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{#each concerns as concern}
									<button
										class="flex flex-col items-start gap-4 rounded-[1.25rem] border p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md {formData.concernCategory === concern.id ? 'border-Accent bg-Accent/5 ring-1 ring-Accent' : 'border-Mist/60 hover:border-Accent/50'}"
										onclick={() => { formData.concernCategory = concern.id; nextStep(); }}
									>
										<Activity class="h-8 w-8 text-Accent" strokeWidth={1.5} />
										<div>
											<span class="block font-sans text-lg font-medium text-Dark">{concern.id}</span>
											<span class="mt-1 block text-sm text-Dark/70">{concern.desc}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- STEP 2 -->
					{#if currentStep === 2}
						<div class="step">
							<h3 class="mb-8 text-2xl font-medium text-Dark">How long & how bad?</h3>
							<div class="mx-auto max-w-xl space-y-12">
								<div>
									<label for="duration" class="mb-4 block font-medium">How long have you had this issue?</label>
									<input type="range" id="duration" min="1" max="365" bind:value={formData.durationDays} class="w-full accent-Accent" />
									<div class="mt-2 text-center text-lg text-Accent font-mono">{formData.durationDays} days</div>
								</div>
								<div>
									<label for="severity" class="mb-4 block font-medium">How severe is the pain?</label>
									<input type="range" id="severity" min="1" max="10" bind:value={formData.severity} class="w-full accent-Accent" />
									<div class="mt-2 flex justify-between px-2 text-sm text-Dark/60">
										<span>1 (Mild)</span>
										<span class="text-lg font-medium text-Accent">{formData.severity}</span>
										<span>10 (Severe)</span>
									</div>
								</div>
								<div class="flex justify-end gap-4 pt-8">
									<button class="px-6 py-2 text-Dark/60 hover:text-Dark" onclick={prevStep}>Back</button>
									<MagneticButton class="px-8 py-3" onclick={nextStep}>Continue</MagneticButton>
								</div>
							</div>
						</div>
					{/if}

					<!-- STEP 3 -->
					{#if currentStep === 3}
						<div class="step">
							<h3 class="mb-8 text-2xl font-medium text-Dark">Tell us about you</h3>
							<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
								<div class="space-y-1">
									<label class="text-sm text-Dark/70" for="fullname">Full Name <span class="text-Accent">*</span></label>
									<input id="fullname" type="text" bind:value={formData.full_name} class="w-full rounded-xl border border-Mist/60 bg-transparent px-4 py-3 outline-none focus:border-Accent focus:ring-1 focus:ring-Accent" />
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-1">
										<label class="text-sm text-Dark/70" for="age">Age <span class="text-Accent">*</span></label>
										<input id="age" type="number" bind:value={formData.age} class="w-full rounded-xl border border-Mist/60 bg-transparent px-4 py-3 outline-none focus:border-Accent focus:ring-1 focus:ring-Accent" />
									</div>
									<div class="space-y-1">
										<label class="text-sm text-Dark/70" for="sex">Sex <span class="text-Accent">*</span></label>
										<select id="sex" bind:value={formData.sex} class="w-full rounded-xl border border-Mist/60 bg-transparent px-4 py-3 outline-none focus:border-Accent focus:ring-1 focus:ring-Accent">
											<option value="" disabled selected>Select</option>
											<option value="Male">Male</option>
											<option value="Female">Female</option>
										</select>
									</div>
								</div>
								<div class="space-y-1">
									<label class="text-sm text-Dark/70" for="email">Email <span class="text-Accent">*</span></label>
									<input id="email" type="email" bind:value={formData.email} class="w-full rounded-xl border border-Mist/60 bg-transparent px-4 py-3 outline-none focus:border-Accent focus:ring-1 focus:ring-Accent" />
								</div>
								<div class="space-y-1">
									<label class="text-sm text-Dark/70" for="phone">Phone Number <span class="text-Accent">*</span></label>
									<input id="phone" type="tel" bind:value={formData.phone_number} placeholder="09XX XXX XXXX" class="w-full rounded-xl border border-Mist/60 bg-transparent px-4 py-3 outline-none focus:border-Accent focus:ring-1 focus:ring-Accent" />
								</div>
								<div class="space-y-1 sm:col-span-2">
									<label class="text-sm text-Dark/70" for="occupation">Occupation</label>
									<input id="occupation" type="text" bind:value={formData.occupation} class="w-full rounded-xl border border-Mist/60 bg-transparent px-4 py-3 outline-none focus:border-Accent focus:ring-1 focus:ring-Accent" />
								</div>
							</div>
							<p class="mt-4 text-xs text-Dark/40"><span class="text-Accent">*</span> Required</p>
							<div class="mt-6 flex justify-end gap-4">
								<button class="px-6 py-2 text-Dark/60 hover:text-Dark" onclick={prevStep}>Back</button>
								<MagneticButton class="px-8 py-3" onclick={nextStep} disabled={!step3Valid}>Continue</MagneticButton>
							</div>
						</div>
					{/if}

					<!-- STEP 4 -->
					{#if currentStep === 4}
						<div class="step">
							<h3 class="mb-8 text-2xl font-medium text-Dark">Pick a service</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{#each services as svc}
									<button
										class="flex items-center gap-4 rounded-[1.25rem] border p-5 text-left transition-all hover:border-Accent/50 {formData.service === svc.id ? 'border-Accent bg-Accent/5 ring-1 ring-Accent' : 'border-Mist/60'}"
										onclick={() => { formData.service = svc.id; nextStep(); }}
									>
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-Mist/30">
											<User class="h-5 w-5 text-Dark/80" />
										</div>
										<div>
											<span class="block font-medium">{svc.id}</span>
											<span class="block text-sm text-Dark/70">{svc.desc}</span>
										</div>
									</button>
								{/each}
							</div>
							<div class="mt-8 flex justify-start">
								<button class="px-6 py-2 text-Dark/60 hover:text-Dark" onclick={prevStep}>Back</button>
							</div>
						</div>
					{/if}

					<!-- STEP 5 -->
					{#if currentStep === 5}
						<div class="step">
							<h3 class="mb-6 text-2xl font-medium text-Dark">Pick a slot</h3>
							<div class="mx-auto max-w-2xl">
								<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
									<!-- Calendar -->
									<div>
										<p class="mb-2 text-sm font-medium text-Dark/70">Select a date</p>
										<CalendarPicker
											bind:value={selectedDateStr}
											minDate={getTodayStr()}
											fullyBookedDates={allFullyBookedDates}
											isLoading={isLoadingMonth}
											onMonthChange={handleMonthChange}
											onSelect={handleCalendarSelect}
										/>
									</div>

									<!-- Time slots -->
									<div>
										<p class="mb-2 text-sm font-medium text-Dark/70">Select a time</p>
										{#if !selectedDateStr}
											<div class="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-Mist/60">
												<p class="text-sm text-Dark/40">Choose a date first</p>
											</div>
										{:else if isLoadingSlots}
											<div class="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-Mist/60">
												<div class="h-8 w-8 animate-spin rounded-full border-2 border-Mist border-t-Accent"></div>
											</div>
										{:else}
											{@const daySlots = generateSlots(selectedDateStr)}
											{@const bookedSlots = dateAvailability[selectedDateStr]?.booked_slots || []}
											{#if daySlots.length === 0}
												<div class="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-Mist/60">
													<p class="text-sm text-Dark/50">Closed on Sundays</p>
												</div>
											{:else}
												<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
													{#each daySlots as slot}
														{#if bookedSlots.includes(slot)}
															<div class="cursor-not-allowed rounded-lg border border-transparent bg-Mist/20 py-2.5 text-center text-sm text-Dark/30 line-through">
																{formatTime(slot)}
															</div>
														{:else}
															<button
																class="rounded-lg border py-2.5 text-center text-sm transition-all hover:border-Accent hover:text-Accent
																	{formData.datetime.includes(slot) ? 'border-Accent bg-Accent text-white' : 'border-Mist/60 bg-transparent text-Dark'}"
																onclick={() => formData.datetime = selectedDateStr + 'T' + slot + ':00'}
															>{formatTime(slot)}</button>
														{/if}
													{/each}
												</div>
											{/if}
										{/if}
									</div>
								</div>

								<div class="mt-8 flex justify-between gap-4">
									<button class="px-6 py-2 text-Dark/60 hover:text-Dark" onclick={prevStep}>Back</button>
									<MagneticButton class="px-8 py-3" onclick={nextStep} disabled={!formData.datetime}>Continue</MagneticButton>
								</div>
							</div>
						</div>
					{/if}

					<!-- STEP 6 -->
					{#if currentStep === 6}
						<div class="step">
							<h3 class="mb-8 text-2xl font-medium text-Dark">Review & Submit</h3>
							
							{#if submitError}
								<div class="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-800">
									<AlertCircle class="mt-0.5 h-5 w-5 shrink-0" />
									<p class="text-sm">{submitError}</p>
								</div>
							{/if}

							<div class="rounded-[1.25rem] border border-Mist/60 bg-Mist/10 p-6 mb-6">
								<h4 class="mb-4 font-medium">Summary</h4>
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div><span class="text-Dark/60">Name:</span> {formData.full_name}</div>
									<div><span class="text-Dark/60">Phone:</span> {formData.phone_number}</div>
									<div><span class="text-Dark/60">Concern:</span> {formData.concernCategory}</div>
									<div><span class="text-Dark/60">Service:</span> {formData.service}</div>
									<div class="col-span-2"><span class="text-Dark/60">Time:</span> {formData.datetime}</div>
								</div>
							</div>

							<div class="mb-8 space-y-2">
								<label for="notes" class="block font-medium">Anything else we should know?</label>
								<textarea id="notes" bind:value={formData.additional_notes} rows="3" class="w-full rounded-xl border border-Mist/60 px-4 py-3 placeholder-Dark/30" placeholder="Optional notes..."></textarea>
							</div>

							<p class="mb-8 text-xs text-Dark/50">
								By submitting, you agree to our Privacy Policy. Information is encrypted and compliant with RA 10173 (Data Privacy Act of 2012).
							</p>

							<div class="flex justify-between gap-4">
								<button class="px-6 py-2 text-Dark/60 hover:text-Dark" onclick={prevStep} disabled={isSubmitting}>Back</button>
								<MagneticButton class="px-8 py-3" onclick={submitAssessment} disabled={isSubmitting}>
									{isSubmitting ? 'Submitting...' : 'Submit Assessment'}
								</MagneticButton>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- SUCCESS STATE -->
			<div class="mx-auto max-w-lg rounded-[2rem] border border-Mist/60 bg-white p-12 text-center shadow-sm">
				<div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-Primary/10">
					<CheckCircle2 class="h-8 w-8 text-Primary" />
				</div>
				<h3 class="mb-4 font-serif text-3xl italic text-Dark">Thank you, {formData.full_name.split(' ')[0]}.</h3>
				<p class="mb-8 text-Dark/70">
					Your assessment has been received. Our PRC-licensed therapist will review your details and contact you within 24 hours.
				</p>
				<div class="mb-8 rounded-xl bg-Mist/20 p-4">
					<p class="text-sm font-medium">Requested Time</p>
					<p class="font-mono text-Accent">{formData.datetime.replace('T', ' ')}</p>
				</div>
				<!-- Client-side generic ICS download fallback if needed -->
				<button class="font-medium text-Accent transition-colors hover:text-Primary inline-flex items-center gap-2">
					<CalendarDays size={18} />
					Add to Calendar
				</button>
			</div>
		{/if}
	</div>
</section>
