<script>
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-svelte';
	import { createBrowserClient } from '@supabase/ssr';
	import { env } from '$env/dynamic/public';

	let { data, form } = $props();
	let loading = $state(false);
	let showNew = $state(false);
	let showConfirm = $state(false);
	let password = $state('');
	let pageReady = $state(data.ready ?? false);
	let pageError = $state(data.error ?? null);

	onMount(async () => {
		if (pageReady) return;

		// Handle implicit-flow invite tokens sent in the URL hash (#access_token=...).
		// The server can't see hash fragments, so we handle them here client-side.
		const hash = window.location.hash.slice(1);
		if (!hash) return;

		const params = new URLSearchParams(hash);
		const accessToken = params.get('access_token');
		const refreshToken = params.get('refresh_token');
		const hashError = params.get('error');
		const hashErrorDescription = params.get('error_description');

		if (hashError) {
			// Supabase rejected the token (e.g. expired) and sent an error in the hash
			pageError = hashErrorDescription
				? decodeURIComponent(hashErrorDescription.replace(/\+/g, ' '))
				: 'This invite link is invalid or has expired. Please ask an admin to resend the invite.';
			window.history.replaceState({}, '', window.location.pathname);
			return;
		}

		if (accessToken && refreshToken) {
			const supabase = createBrowserClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
			const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
			if (sessionError) {
				pageError = 'This invite link is invalid or has expired. Please ask an admin to resend the invite.';
			} else {
				pageReady = true;
				pageError = null;
				window.history.replaceState({}, '', window.location.pathname);
			}
		}
	});

	const strength = $derived.by(() => {
		if (password.length === 0) return 0;
		let score = 0;
		if (password.length >= 8) score++;
		if (password.length >= 12) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/[0-9]/.test(password)) score++;
		if (/[^A-Za-z0-9]/.test(password)) score++;
		return score;
	});

	const strengthLabel = $derived(
		['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength] ?? ''
	);
	const strengthColor = $derived(
		['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-green-600'][strength] ?? ''
	);
</script>

<div class="flex min-h-screen flex-col bg-Background">
	<!-- Top bar -->
	<div class="border-b border-Mist/50 px-8 py-5">
		<div class="inline-flex items-center gap-2.5">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-Primary/12">
				<div class="h-3 w-3 rounded-sm bg-Primary/70"></div>
			</div>
			<span class="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-Dark/40">Kimut Clinic</span>
		</div>
	</div>

	<div class="flex flex-1 items-center justify-center px-8 py-16">
		<div class="w-full max-w-[360px]">

			{#if pageError}
				<!-- Error state — link expired or invalid -->
				<div class="text-center">
					<div class="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
						<AlertCircle class="h-7 w-7 text-red-400" />
					</div>
					<h1 class="mb-3 font-serif text-[2rem] italic text-Dark">Link expired</h1>
					<p class="mb-8 text-[13px] leading-relaxed text-Dark/50">{pageError}</p>
					<a
						href="/admin/forgot-password"
						class="inline-flex items-center justify-center rounded-xl bg-Dark px-8 py-3.5 text-[13px] font-medium text-white transition-all hover:bg-Dark/85"
					>
						Request a new link
					</a>
				</div>

			{:else if pageReady}
				<!-- New password form -->
				<div class="mb-10">
					<div class="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-Primary/10">
						<ShieldCheck class="h-6 w-6 text-Primary" />
					</div>
					<h1 class="mb-2 font-serif text-[2rem] italic text-Dark">Set new password</h1>
					<p class="text-[13px] text-Dark/50 leading-relaxed">
						Choose a strong password for your staff account.
					</p>
				</div>

				{#if form?.error}
					<div class="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
						<AlertCircle class="mt-px h-4 w-4 shrink-0" />
						<p>{form.error}</p>
					</div>
				{/if}

				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							update();
						};
					}}
					class="space-y-5"
				>
					<!-- New password -->
					<div class="space-y-1.5">
						<label class="block text-[11px] font-medium uppercase tracking-[0.15em] text-Dark/45" for="password">
							New password
						</label>
						<div class="relative">
							<input
								id="password"
								name="password"
								type={showNew ? 'text' : 'password'}
								bind:value={password}
								required
								autocomplete="new-password"
								placeholder="Minimum 8 characters"
								class="w-full rounded-xl border border-Mist bg-white/70 px-4 py-3.5 pr-12 text-[14px] text-Dark outline-none transition-all placeholder:text-Dark/25
								       focus:border-Accent/60 focus:bg-white focus:ring-2 focus:ring-Accent/15"
							/>
							<button
								type="button"
								onclick={() => (showNew = !showNew)}
								class="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-Dark/30 transition-colors hover:text-Dark/60"
								aria-label={showNew ? 'Hide' : 'Show'}
							>
								{#if showNew}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>

						<!-- Strength bar -->
						{#if password.length > 0}
							<div class="flex items-center gap-2 pt-1">
								<div class="flex flex-1 gap-1">
									{#each [1, 2, 3, 4, 5] as i}
										<div
											class="h-1 flex-1 rounded-full transition-all duration-300 {i <= strength ? strengthColor : 'bg-Mist'}"
										></div>
									{/each}
								</div>
								<span class="text-[11px] text-Dark/40">{strengthLabel}</span>
							</div>
						{/if}
					</div>

					<!-- Confirm password -->
					<div class="space-y-1.5">
						<label class="block text-[11px] font-medium uppercase tracking-[0.15em] text-Dark/45" for="confirm">
							Confirm password
						</label>
						<div class="relative">
							<input
								id="confirm"
								name="confirm"
								type={showConfirm ? 'text' : 'password'}
								required
								autocomplete="new-password"
								placeholder="Repeat your password"
								class="w-full rounded-xl border border-Mist bg-white/70 px-4 py-3.5 pr-12 text-[14px] text-Dark outline-none transition-all placeholder:text-Dark/25
								       focus:border-Accent/60 focus:bg-white focus:ring-2 focus:ring-Accent/15"
							/>
							<button
								type="button"
								onclick={() => (showConfirm = !showConfirm)}
								class="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-Dark/30 transition-colors hover:text-Dark/60"
								aria-label={showConfirm ? 'Hide' : 'Show'}
							>
								{#if showConfirm}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-xl bg-Dark px-6 py-4 text-[13px] font-medium tracking-wide text-white transition-all
						       hover:bg-Dark/85 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? 'Saving…' : 'Set new password'}
					</button>
				</form>
			{/if}

		</div>
	</div>
</div>
