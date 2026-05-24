import { env } from '$env/dynamic/private';

function b64url(str) {
	return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlBuf(buf) {
	return btoa(String.fromCharCode(...new Uint8Array(buf)))
		.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function getGoogleAccessToken() {
	const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const rawKey = env.GOOGLE_PRIVATE_KEY;
	if (!email || !rawKey) return null;

	try {
		const privateKey = rawKey.replace(/\\n/g, '\n');
		const pemBody = privateKey
			.replace(/-----BEGIN PRIVATE KEY-----/, '')
			.replace(/-----END PRIVATE KEY-----/, '')
			.replace(/\s/g, '');
		const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

		const now = Math.floor(Date.now() / 1000);
		const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
		const payload = b64url(JSON.stringify({
			iss: email,
			scope: 'https://www.googleapis.com/auth/calendar.readonly',
			aud: 'https://oauth2.googleapis.com/token',
			exp: now + 3600,
			iat: now
		}));

		const toSign = `${header}.${payload}`;
		const key = await crypto.subtle.importKey(
			'pkcs8', der,
			{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
			false, ['sign']
		);
		const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign));
		const jwt = `${toSign}.${b64urlBuf(sig)}`;

		const res = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				assertion: jwt
			})
		});
		if (!res.ok) return null;
		return (await res.json()).access_token;
	} catch (e) {
		console.error('Google Calendar auth error:', e.message);
		return null;
	}
}

export async function getGoogleBusy(accessToken, calendarId, timeMin, timeMax) {
	if (!accessToken || !calendarId) return [];
	try {
		const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] })
		});
		if (!res.ok) return [];
		const data = await res.json();
		return data.calendars?.[calendarId]?.busy || [];
	} catch {
		return [];
	}
}

// Batch freeBusy query — returns { calendarId: busyArray }
export async function getGoogleBusyBatch(accessToken, calendarIds, timeMin, timeMax) {
	if (!accessToken || !calendarIds.length) return {};
	try {
		const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				timeMin,
				timeMax,
				items: calendarIds.map(id => ({ id }))
			})
		});
		if (!res.ok) return {};
		const data = await res.json();
		const result = {};
		for (const id of calendarIds) {
			result[id] = data.calendars?.[id]?.busy || [];
		}
		return result;
	} catch {
		return {};
	}
}
