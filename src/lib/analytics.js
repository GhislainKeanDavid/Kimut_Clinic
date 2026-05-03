// Simple analytics tracking for Kimut Clinic funnel

export function getSessionId() {
	if (typeof window === 'undefined') return '';
	let sessionId = localStorage.getItem('kimut_session_id');
	if (!sessionId) {
		sessionId = crypto.randomUUID();
		localStorage.setItem('kimut_session_id', sessionId);
	}
	return sessionId;
}

export async function logFunnelEvent(event, extraData = {}) {
	try {
		const sessionId = getSessionId();
		
		const payload = {
			session_id: sessionId,
			event,
			...extraData
		};

		// In a real scenario, this would POST to a dedicated analytics endpoint 
		// that inserts into Supabase funnel_events.
		// For this implementation, we will assume /api/log-event handles this.
		await fetch('/api/log-event', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch (e) {
		console.error('Failed to log funnel event', e);
	}
}

// Function to capture UTMs on first load
export function captureUTMs(url) {
	if (typeof window === 'undefined') return;
	
	const params = new URL(url).searchParams;
	const utms = ['utm_source', 'utm_medium', 'utm_campaign'];
	let hasUtm = false;
	const utmData = {};
	
	utms.forEach(u => {
		if (params.has(u)) {
			utmData[u] = params.get(u);
			hasUtm = true;
		}
	});
	
	if (hasUtm && !localStorage.getItem('kimut_utms')) {
		localStorage.setItem('kimut_utms', JSON.stringify(utmData));
	}
}
