<script>
	import { enhance } from '$app/forms';
	import { AlertCircle, Eye, EyeOff } from 'lucide-svelte';

	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
</script>

<div class="min-h-screen lg:grid lg:grid-cols-[1fr_500px]">

	<!-- ── Left brand panel ── -->
	<div class="relative hidden overflow-hidden bg-Primary lg:flex lg:flex-col lg:justify-between lg:p-16">
		<!-- Decorative rings -->
		<div class="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full border border-white/[0.07]"></div>
		<div class="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full border border-white/[0.1]"></div>
		<div class="pointer-events-none absolute -right-8 -top-8 h-[220px] w-[220px] rounded-full border border-white/[0.14]"></div>
		<div class="pointer-events-none absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-white/[0.03]"></div>
		<div class="pointer-events-none absolute bottom-24 right-12 h-1.5 w-1.5 rounded-full bg-white/30"></div>
		<div class="pointer-events-none absolute bottom-36 right-28 h-1 w-1 rounded-full bg-white/20"></div>
		<div class="pointer-events-none absolute top-48 right-20 h-1 w-1 rounded-full bg-white/20"></div>

		<!-- Wordmark -->
		<div class="relative z-10 flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
				<div class="h-4 w-4 rounded-sm bg-white/90"></div>
			</div>
			<span class="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
				Kimut Clinic
			</span>
		</div>

		<!-- Hero text -->
		<div class="relative z-10">
			<p class="mb-5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
				Staff Portal
			</p>
			<h1 class="mb-6 font-serif text-[3.5rem] italic leading-[1.1] text-white">
				Manage your<br />patient pipeline.
			</h1>
			<p class="max-w-xs text-base leading-relaxed text-white/50">
				Track bookings, update statuses, and monitor your clinic's funnel performance in real time.
			</p>
		</div>

		<!-- Status badge -->
		<div class="relative z-10">
			<div class="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
				</span>
				<span class="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">System Online</span>
			</div>
		</div>
	</div>

	<!-- ── Right form panel ── -->
	<div class="flex min-h-screen flex-col justify-center bg-Background px-8 py-16 sm:px-12 lg:px-14">

		<!-- Mobile wordmark -->
		<div class="mb-12 flex items-center gap-2.5 lg:hidden">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-Primary/15">
				<div class="h-3 w-3 rounded-sm bg-Primary/80"></div>
			</div>
			<span class="font-sans text-xs font-medium uppercase tracking-[0.18em] text-Dark/50">Kimut Clinic</span>
		</div>

		<div class="mx-auto w-full max-w-[340px]">
			<!-- Heading -->
			<div class="mb-10">
				<h2 class="mb-1.5 font-serif text-[2rem] italic leading-tight text-Dark">Welcome back</h2>
				<p class="text-[13px] text-Dark/45">Sign in with your staff credentials</p>
			</div>

			<!-- Error -->
			{#if form?.incorrect || form?.missing}
				<div class="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-[13px] text-red-700">
					<AlertCircle class="mt-px h-4 w-4 shrink-0" />
					<p>{form?.message ?? 'Invalid email or password. Please try again.'}</p>
				</div>
			{/if}

			<!-- Form -->
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
				<!-- Email -->
				<div class="space-y-1.5">
					<label class="block text-[11px] font-medium uppercase tracking-[0.15em] text-Dark/45" for="email">
						Email address
					</label>
					<input
						id="email"
						name="email"
						type="email"
						value={form?.email ?? ''}
						required
						autocomplete="email"
						placeholder="staff@kimutclinic.com"
						class="w-full rounded-xl border border-Mist bg-white/70 px-4 py-3.5 text-[14px] text-Dark outline-none ring-0 transition-all placeholder:text-Dark/25
						       focus:border-Accent/60 focus:bg-white focus:ring-2 focus:ring-Accent/15"
					/>
				</div>

				<!-- Password -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<label class="block text-[11px] font-medium uppercase tracking-[0.15em] text-Dark/45" for="password">
							Password
						</label>
						<a
							href="/admin/forgot-password"
							class="text-[11px] text-Accent/80 transition-colors hover:text-Accent"
						>
							Forgot password?
						</a>
					</div>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							required
							autocomplete="current-password"
							placeholder="••••••••"
							class="w-full rounded-xl border border-Mist bg-white/70 px-4 py-3.5 pr-12 text-[14px] text-Dark outline-none transition-all placeholder:text-Dark/25
							       focus:border-Accent/60 focus:bg-white focus:ring-2 focus:ring-Accent/15"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-Dark/30 transition-colors hover:text-Dark/60"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={loading}
					class="mt-2 w-full rounded-xl bg-Dark px-6 py-4 text-[13px] font-medium tracking-wide text-white transition-all
					       hover:bg-Dark/85 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? 'Signing in…' : 'Sign in'}
				</button>
			</form>
		</div>

		<!-- Footer note -->
		<p class="mt-auto pt-16 text-center text-[11px] text-Dark/25">
			Restricted to authorized Kimut Clinic staff only
		</p>
	</div>
</div>
