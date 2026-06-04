<script>
	import { onMount, tick } from 'svelte';
	import gsap from 'gsap';
	import { Phone, PhoneOff, X, Send, Mic, MicOff } from 'lucide-svelte';
	import { env as publicEnv } from '$env/dynamic/public';

	const KIM_PHONE_NUMBER = publicEnv.PUBLIC_KIM_PHONE_NUMBER || '';

	function formatPhone(raw) {
		if (!raw) return '';
		const digits = raw.replace(/\D/g, '');
		if (digits.startsWith('63') && digits.length === 12) {
			return `+63 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
		}
		if (digits.startsWith('1') && digits.length === 11) {
			return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
		}
		return raw.startsWith('+') ? raw : `+${digits}`;
	}

	const KIM_PHONE_DISPLAY = formatPhone(KIM_PHONE_NUMBER);
	const KIM_PHONE_HREF = KIM_PHONE_NUMBER ? `tel:${KIM_PHONE_NUMBER}` : '';

	let isExpanded = $state(false);
	let view = $state('chat'); // 'chat' | 'call'
	let collapsedRef;
	let expandedRef;
	let messagesRef;
	let inputEl;
	const INPUT_MAX_HEIGHT = 120; // ~5 lines

	function autoResize() {
		if (!inputEl) return;
		inputEl.style.height = 'auto';
		inputEl.style.height = Math.min(inputEl.scrollHeight, INPUT_MAX_HEIGHT) + 'px';
	}

	function focusInput() {
		if (!inputEl) return;
		inputEl.focus();
		const end = inputEl.value.length;
		try {
			inputEl.setSelectionRange(end, end);
		} catch {}
	}

	// Chat state
	let chatId = $state(null);
	let messages = $state([
		{
			role: 'agent',
			content:
				"Hi! I'm Kim, Kimut Clinic's AI receptionist. How can I help you today?"
		}
	]);
	let inputText = $state('');
	let isSending = $state(false);
	let chatError = $state('');

	// Call state
	let callStatus = $state('idle'); // 'idle' | 'connecting' | 'connected' | 'ended' | 'error'
	let isMuted = $state(false);
	let agentTalking = $state(false);
	let callError = $state('');
	let retellClient = null;

	function toggleWidget() {
		isExpanded = !isExpanded;

		if (isExpanded) {
			gsap.to(collapsedRef, {
				opacity: 0,
				scale: 0.9,
				duration: 0.2,
				display: 'none'
			});
			gsap.fromTo(
				expandedRef,
				{ opacity: 0, y: 20, display: 'flex' },
				{ opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.1 }
			);
			tick().then(() => {
				scrollToBottom();
				if (view === 'chat') focusInput();
			});
		} else {
			gsap.to(expandedRef, { opacity: 0, y: 20, duration: 0.2, display: 'none' });
			gsap.fromTo(
				collapsedRef,
				{ opacity: 0, scale: 0.9, display: 'flex' },
				{ opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out', delay: 0.1 }
			);
			if (callStatus === 'connected' || callStatus === 'connecting') {
				endCall();
			}
		}
	}

	function scrollToBottom() {
		if (messagesRef) {
			messagesRef.scrollTop = messagesRef.scrollHeight;
		}
	}

	async function ensureChatSession() {
		if (chatId) return chatId;
		const res = await fetch('/api/kim/chat-start', { method: 'POST' });
		const data = await res.json();
		if (!data.success) {
			throw new Error(data.reason || 'chat_start_failed');
		}
		chatId = data.chat_id;
		return chatId;
	}

	async function sendMessage() {
		const text = inputText.trim();
		if (!text || isSending) return;

		messages = [...messages, { role: 'user', content: text }];
		inputText = '';
		isSending = true;
		chatError = '';
		await tick();
		scrollToBottom();

		try {
			const id = await ensureChatSession();
			const res = await fetch('/api/kim/chat-send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chat_id: id, content: text })
			});
			const data = await res.json();
			if (!data.success) {
				throw new Error(data.reason || 'chat_send_failed');
			}
			const newAgentMessages = (data.messages || [])
				.filter((m) => m.role === 'agent' && m.content)
				.map((m) => ({ role: 'agent', content: m.content }));
			if (newAgentMessages.length === 0) {
				newAgentMessages.push({
					role: 'agent',
					content: '(Kim is thinking — please try again in a moment.)'
				});
			}
			messages = [...messages, ...newAgentMessages];
		} catch (e) {
			console.error('Chat send failed:', e);
			chatError =
				KIM_PHONE_DISPLAY
					? `Chat is unavailable right now. Please call us at ${KIM_PHONE_DISPLAY}.`
					: 'Chat is unavailable right now. Please try again shortly.';
		} finally {
			isSending = false;
			await tick();
			scrollToBottom();
			autoResize();
			focusInput();
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	async function startCall() {
		if (callStatus === 'connecting' || callStatus === 'connected') return;
		view = 'call';
		callStatus = 'connecting';
		callError = '';

		try {
			const res = await fetch('/api/kim/web-call', { method: 'POST' });
			const data = await res.json();
			if (!data.success || !data.access_token) {
				throw new Error(data.reason || 'web_call_failed');
			}

			const { RetellWebClient } = await import('retell-client-js-sdk');
			retellClient = new RetellWebClient();

			retellClient.on('call_started', () => {
				callStatus = 'connected';
			});
			retellClient.on('call_ended', () => {
				callStatus = 'ended';
				agentTalking = false;
			});
			retellClient.on('agent_start_talking', () => {
				agentTalking = true;
			});
			retellClient.on('agent_stop_talking', () => {
				agentTalking = false;
			});
			retellClient.on('error', (err) => {
				console.error('Retell web client error:', err);
				callError = 'Call interrupted. Please try again.';
				callStatus = 'error';
				try {
					retellClient?.stopCall();
				} catch {}
			});

			await retellClient.startCall({ accessToken: data.access_token });
		} catch (e) {
			console.error('startCall failed:', e);
			callStatus = 'error';
			callError =
				e?.name === 'NotAllowedError'
					? 'Microphone access was blocked. Enable it and try again.'
					: 'Could not start the call. Please try again or dial directly.';
		}
	}

	function endCall() {
		try {
			retellClient?.stopCall();
		} catch (e) {
			console.error('stopCall failed:', e);
		}
		retellClient = null;
		callStatus = 'ended';
		agentTalking = false;
		isMuted = false;
	}

	function backToChat() {
		view = 'chat';
		callStatus = 'idle';
		callError = '';
		tick().then(() => {
			scrollToBottom();
			focusInput();
		});
	}

	function toggleMute() {
		if (!retellClient) return;
		isMuted = !isMuted;
		try {
			if (isMuted) retellClient.mute?.();
			else retellClient.unmute?.();
		} catch (e) {
			console.error('mute toggle failed:', e);
		}
	}

	onMount(() => {
		return () => {
			if (retellClient) {
				try {
					retellClient.stopCall();
				} catch {}
			}
		};
	});
</script>

<div class="fixed bottom-4 left-4 z-50 md:bottom-8 md:left-8">
	<!-- Collapsed State -->
	<div bind:this={collapsedRef} class="flex flex-col items-start gap-2">
		<span class="ml-4 font-mono text-[10px] uppercase tracking-widest text-Primary/60">
			AI RECEPTIONIST · 24/7
		</span>
		<button
			class="group flex items-center gap-3 rounded-full bg-Primary px-5 py-3 text-Background shadow-lg transition-transform hover:scale-[1.03]"
			onclick={toggleWidget}
			aria-label="Open chat with Kim"
		>
			<span class="relative flex h-2 w-2">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-Accent opacity-75"
				></span>
				<span class="relative inline-flex h-2 w-2 rounded-full bg-Accent"></span>
			</span>
			<Phone size={18} strokeWidth={1.5} />
			<span class="font-sans font-medium">Talk to Kim</span>
		</button>
	</div>

	<!-- Expanded State -->
	<div
		bind:this={expandedRef}
		class="hidden h-[560px] w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-[1.5rem] border border-Mist/60 bg-Background shadow-2xl sm:w-[360px]"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-Mist/40 p-4">
			<div class="flex items-center gap-3">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-full bg-Accent/10 text-Accent"
				>
					<span class="font-serif text-lg font-bold">K</span>
				</div>
				<div class="flex flex-col">
					<span class="font-sans text-sm font-medium text-Dark">Kim</span>
					{#if KIM_PHONE_DISPLAY}
						<a
							href={KIM_PHONE_HREF}
							class="font-mono text-[10px] tracking-wide text-Dark/55 transition-colors hover:text-Accent"
						>
							{KIM_PHONE_DISPLAY}
						</a>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-1">
				{#if view === 'chat'}
					<button
						onclick={startCall}
						class="rounded-full p-2 text-Dark/60 transition-colors hover:bg-Accent/10 hover:text-Accent"
						aria-label="Call Kim now"
						title="Call Kim now"
					>
						<Phone size={18} strokeWidth={1.5} />
					</button>
				{/if}
				<button
					onclick={toggleWidget}
					class="rounded-full p-2 text-Dark/40 transition-colors hover:bg-Mist/40 hover:text-Dark"
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>
		</div>

		{#if view === 'chat'}
			<!-- Messages -->
			<div
				bind:this={messagesRef}
				class="flex-1 space-y-3 overflow-y-auto bg-Mist/10 px-4 py-5"
			>
				{#each messages as msg}
					{#if msg.role === 'agent'}
						<div class="flex justify-start">
							<div
								class="max-w-[82%] rounded-2xl rounded-tl-md border border-Mist/50 bg-Background px-4 py-2.5 text-sm leading-relaxed text-Dark shadow-sm"
							>
								{msg.content}
							</div>
						</div>
					{:else}
						<div class="flex justify-end">
							<div
								class="max-w-[82%] rounded-2xl rounded-tr-md bg-Primary px-4 py-2.5 text-sm leading-relaxed text-Background shadow-sm"
							>
								{msg.content}
							</div>
						</div>
					{/if}
				{/each}

				{#if isSending}
					<div class="flex justify-start">
						<div
							class="flex items-center gap-1 rounded-2xl rounded-tl-md border border-Mist/50 bg-Background px-4 py-3 shadow-sm"
						>
							<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-Dark/40 [animation-delay:-0.3s]"></span>
							<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-Dark/40 [animation-delay:-0.15s]"></span>
							<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-Dark/40"></span>
						</div>
					</div>
				{/if}

				{#if chatError}
					<div class="flex justify-center">
						<div class="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">
							{chatError}
						</div>
					</div>
				{/if}
			</div>

			<!-- Input -->
			<div class="flex items-end gap-2 border-t border-Mist/40 bg-Background p-3">
				<textarea
					bind:this={inputEl}
					bind:value={inputText}
					oninput={autoResize}
					onkeydown={handleKeydown}
					rows="1"
					placeholder="Type your message…"
					disabled={isSending}
					style="max-height: {INPUT_MAX_HEIGHT}px;"
					class="flex-1 resize-none overflow-y-auto rounded-2xl border border-Mist/60 bg-Mist/10 px-4 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-Dark/40 focus:border-Accent focus:bg-Background disabled:opacity-50"
				></textarea>
				<button
					onclick={sendMessage}
					disabled={isSending || !inputText.trim()}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-Primary text-Background transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
					aria-label="Send message"
				>
					<Send size={16} strokeWidth={2} />
				</button>
			</div>
		{:else if view === 'call'}
			<!-- Call view -->
			<div class="flex flex-1 flex-col items-center justify-between bg-Mist/10 px-6 py-8">
				<div class="flex flex-col items-center gap-4 pt-6">
					<div class="relative flex h-24 w-24 items-center justify-center rounded-full bg-Accent/10">
						{#if callStatus === 'connected' && agentTalking}
							<span class="absolute inset-0 animate-ping rounded-full bg-Accent/30"></span>
						{/if}
						<div class="relative flex h-20 w-20 items-center justify-center rounded-full bg-Accent text-Background">
							<span class="font-serif text-3xl font-bold">K</span>
						</div>
					</div>

					<div class="text-center">
						<p class="font-sans text-base font-medium text-Dark">Kim</p>
						<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-Dark/60">
							{#if callStatus === 'connecting'}
								Connecting…
							{:else if callStatus === 'connected'}
								{agentTalking ? 'Speaking…' : 'Listening…'}
							{:else if callStatus === 'ended'}
								Call ended
							{:else if callStatus === 'error'}
								Call failed
							{/if}
						</p>
					</div>

					{#if callError}
						<p class="max-w-[260px] text-center text-xs leading-relaxed text-red-700">
							{callError}
						</p>
					{/if}

					{#if callStatus === 'connecting'}
						<p class="max-w-[240px] text-center text-xs leading-relaxed text-Dark/60">
							Please allow microphone access when prompted.
						</p>
					{/if}
				</div>

				<!-- Call controls -->
				<div class="flex items-center gap-4">
					{#if callStatus === 'connected'}
						<button
							onclick={toggleMute}
							class="flex h-12 w-12 items-center justify-center rounded-full border border-Mist/60 bg-Background text-Dark transition-colors hover:bg-Mist/40"
							aria-label={isMuted ? 'Unmute' : 'Mute'}
						>
							{#if isMuted}
								<MicOff size={18} strokeWidth={1.5} />
							{:else}
								<Mic size={18} strokeWidth={1.5} />
							{/if}
						</button>
						<button
							onclick={endCall}
							class="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105"
							aria-label="End call"
						>
							<PhoneOff size={20} strokeWidth={1.5} />
						</button>
					{:else if callStatus === 'connecting'}
						<button
							onclick={endCall}
							class="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105"
							aria-label="Cancel call"
						>
							<PhoneOff size={20} strokeWidth={1.5} />
						</button>
					{:else}
						<button
							onclick={backToChat}
							class="rounded-full bg-Primary px-6 py-2.5 text-sm font-medium text-Background transition-transform hover:scale-[1.03]"
						>
							Back to chat
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
