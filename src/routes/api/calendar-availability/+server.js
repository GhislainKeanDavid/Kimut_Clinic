import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

const TIMEZONE = 'Asia/Manila';

function getSlotsForDate(dateStr) {
	const d = new Date(dateStr + 'T00:00:00');
	const day = d.getDay();
	if (day === 0) return []; // Sunday - closed
	const endHour = day === 6 ? 12 : 17; // Sat closes at noon
	const slots = [];
	for (let h = 8; h < endHour; h++) {
		slots.push(`${String(h).padStart(2, '0')}:00`);
	}
	return slots;
}

function b64url(str) {
	return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlBuf(buf) {
	return btoa(String.fromCharCode(...new Uint8Array(buf)))
		.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getGoogleAccessToken() {
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

async function getGoogleBusy(accessToken, calendarId, timeMin, timeMax) {
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

// Which slots overlap a busy period on a given date
function busyToSlots(busy, dateStr, allSlots) {
	const booked = new Set();
	for (const { start, end } of busy) {
		const busyStart = new Date(start).getTime();
		const busyEnd = new Date(end).getTime();
		for (const slot of allSlots) {
			const slotStart = new Date(`${dateStr}T${slot}:00+08:00`).getTime();
			const slotEnd = slotStart + 3_600_000;
			if (busyStart < slotEnd && busyEnd > slotStart) booked.add(slot);
		}
	}
	return [...booked];
}

async function getSupabaseBookings(timeMin, timeMax) {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseKey) return [];
	try {
		const supabase = createClient(supabaseUrl, supabaseKey);
		const { data } = await supabase
			.from('patient_leads')
			.select('datetime')
			.gte('datetime', timeMin)
			.lte('datetime', timeMax)
			.in('status', ['Booked', 'Confirmed']);
		return data || [];
	} catch {
		return [];
	}
}

function rowToSlot(datetimeStr) {
	const d = new Date(datetimeStr);
	const h = parseInt(d.toLocaleString('en-US', { timeZone: TIMEZONE, hour: 'numeric', hour12: false }));
	return `${String(h === 24 ? 0 : h).padStart(2, '0')}:00`;
}

function rowToDate(datetimeStr) {
	return new Date(datetimeStr).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

export async function GET({ url }) {
	const dateStr = url.searchParams.get('date');
	const monthStr = url.searchParams.get('month');
	const calendarId = env.GOOGLE_CALENDAR_ID;

	// --- Single date: return booked slots ---
	if (dateStr) {
		const allSlots = getSlotsForDate(dateStr);
		if (allSlots.length === 0) return json({ booked_slots: [], fully_booked: true });

		const timeMin = `${dateStr}T00:00:00+08:00`;
		const timeMax = `${dateStr}T23:59:59+08:00`;

		const [accessToken, rows] = await Promise.all([
			getGoogleAccessToken(),
			getSupabaseBookings(timeMin, timeMax)
		]);

		const busy = await getGoogleBusy(accessToken, calendarId, timeMin, timeMax);
		const googleSlots = busyToSlots(busy, dateStr, allSlots);
		const supabaseSlots = rows.map(r => rowToSlot(r.datetime));

		const booked_slots = [...new Set([...googleSlots, ...supabaseSlots])].filter(s => allSlots.includes(s));
		return json({ booked_slots, fully_booked: booked_slots.length >= allSlots.length });
	}

	// --- Month: return which days are fully booked ---
	if (monthStr) {
		const [year, month] = monthStr.split('-').map(Number);
		const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed here
		const lastDay = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
		const timeMin = `${monthStr}-01T00:00:00+08:00`;
		const timeMax = `${lastDay}T23:59:59+08:00`;

		const [accessToken, rows] = await Promise.all([
			getGoogleAccessToken(),
			getSupabaseBookings(timeMin, timeMax)
		]);

		const busy = await getGoogleBusy(accessToken, calendarId, timeMin, timeMax);

		// Group supabase rows by date
		const byDate = {};
		for (const row of rows) {
			const ds = rowToDate(row.datetime);
			(byDate[ds] ??= []).push(rowToSlot(row.datetime));
		}

		const fully_booked_dates = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const ds = `${monthStr}-${String(d).padStart(2, '0')}`;
			const allSlots = getSlotsForDate(ds);
			if (allSlots.length === 0) continue;

			const dayStart = new Date(`${ds}T00:00:00+08:00`).getTime();
			const dayEnd = new Date(`${ds}T23:59:59+08:00`).getTime();
			const dayBusy = busy.filter(({ start, end }) => {
				return new Date(start).getTime() < dayEnd && new Date(end).getTime() > dayStart;
			});

			const googleSlots = busyToSlots(dayBusy, ds, allSlots);
			const supabaseSlots = byDate[ds] || [];
			const allBooked = new Set([...googleSlots, ...supabaseSlots]);
			if (allSlots.every(s => allBooked.has(s))) fully_booked_dates.push(ds);
		}

		return json({ fully_booked_dates });
	}

	return json({ error: 'Missing date or month parameter' }, { status: 400 });
}
