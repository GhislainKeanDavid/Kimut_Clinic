<script>
	import { enhance } from '$app/forms';
	import { ArrowLeft, Mail } from 'lucide-svelte';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-screen flex-col bg-Background">
	<!-- Top bar -->
	<div class="border-b border-Mist/50 px-8 py-5">
		<a
			href="/admin/login"
			class="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.15em] text-Dark/40 transition-colors hover:text-Dark/70"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			Back to sign in
		</a>
	</div>

	<!-- Content -->
	<div class="flex flex-1 items-center justify-center px-8 py-16">
		<div class="w-full max-w-[360px]">

			{#if form?.success}
				<!-- Success state -->
				<div class="text-center">
					<div class="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-Primary/10">
						<Mail class="h-7 w-7 text-Primary" />
					</div>
					<h1 class="mb-3 font-serif text-[2rem] italic text-Dark">Check your email</h1>
					<p class="mb-8 leading-relaxed text-[13px] text-Dark/50">
						If that email is registered, we've sent a password reset link. It expires in 1 hour.
					</p>
					<div class="rounded-2xl border border-Mist/60 bg-white/60 p-5 text-left">
						<p class="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-Dark/35">Didn't receive it?</p>
						<ul class="space-y-1 text-[13px] text-Dark/50">
							<li>• Check your spam or junk folder</li>
							<li>• Make sure the email address is correct</li>
							<li>
								• <button
									class="text-Accent hover:text-Accent/80 transition-colors"
									onclick={() => window.location.reload()}
								>Try again</button>
							</li>
						</ul>
					</div>
				</div>

			{:else}
				<!-- Request form -->
				<div class="mb-10">
					<div class="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-Primary/10">
						<div class="h-5 w-5 rounded-md bg-Primary/60"></div>
					</div>
					<h1 class="mb-2 font-serif text-[2rem] italic text-Dark">Reset password</h1>
					<p class="text-[13px] text-Dark/50 leading-relaxed">
						Enter your staff email and we'll send a secure reset link.
					</p>
				</div>

				{#if form?.missing}
					<div class="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
						Please enter your email address.
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
					<div class="space-y-1.5">
						<label class="block text-[11px] font-medium uppercase tracking-[0.15em] text-Dark/45" for="email">
							Email address
						</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							autocomplete="email"
							placeholder="staff@kimutclinic.com"
							class="w-full rounded-xl border border-Mist bg-white/70 px-4 py-3.5 text-[14px] text-Dark outline-none transition-all placeholder:text-Dark/25
							       focus:border-Accent/60 focus:bg-white focus:ring-2 focus:ring-Accent/15"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-xl bg-Dark px-6 py-4 text-[13px] font-medium tracking-wide text-white transition-all
						       hover:bg-Dark/85 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? 'Sending…' : 'Send reset link'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
