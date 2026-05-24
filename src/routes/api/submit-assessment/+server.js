import { json } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import { encodeNotes } from '$lib/parse-notes';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { getGoogleAccessToken, getGoogleBusy } from '$lib/gcal.js';

const PT_SLUGS = ['reyes', 'santos', 'dizon'];
const TIMEZONE = 'Asia/Manila';

function getCalendarId(pt) {
	if (pt === 'reyes') return privateEnv.GOOGLE_CALENDAR_ID_REYES;
	if (pt === 'santos') return privateEnv.GOOGLE_CALENDAR_ID_SANTOS;
	if (pt === 'dizon') return privateEnv.GOOGLE_CALENDAR_ID_DIZON;
	return null;
}

async function resolveAssignedPt(preferred_pt, isoDatetime, supabaseUrl, supabaseKey) {
	if (preferred_pt && preferred_pt !== 'any') return preferred_pt;
	if (!isoDatetime) return PT_SLUGS[0];

	const slotStart = new Date(isoDatetime);
	const slotEnd = new Date(slotStart.getTime() + 3_600_000);
	const dateStr = slotStart.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
	const dayMin = `${dateStr}T00:00:00+08:00`;
	const dayMax = `${dateStr}T23:59:59+08:00`;

	// Check GCal free/busy per PT for the specific slot
	const accessToken = await getGoogleAccessToken();
	const busyChecks = await Promise.all(
		PT_SLUGS.map(async pt => {
			const busy = await getGoogleBusy(
				accessToken,
				getCalendarId(pt),
				slotStart.toISOString(),
				slotEnd.toISOString()
			);
			return { pt, isBusy: busy.length > 0 };
		})
	);

	const available = busyChecks.filter(b => !b.isBusy).map(b => b.pt);
	const candidates = available.length > 0 ? available : PT_SLUGS;

	// Pick the candidate with fewest active leads that day
	try {
		const supabase = createClient(supabaseUrl, supabaseKey);
		const { data } = await supabase
			.from('patient_leads')
			.select('assigned_pt')
			.gte('datetime', dayMin)
			.lte('datetime', dayMax)
			.in('status', ['Booked', 'Confirmed'])
			.in('assigned_pt', candidates);

		const counts = Object.fromEntries(candidates.map(pt => [pt, 0]));
		for (const row of data || []) {
			const slug = row.assigned_pt?.toLowerCase();
			if (slug && counts[slug] !== undefined) counts[slug]++;
		}

		return candidates.sort((a, b) => counts[a] - counts[b])[0];
	} catch {
		return candidates[0];
	}
}

export async function POST({ request }) {
	try {
		const data = await request.json();

		let isoDateTime = '';
		if (data.datetime) {
			isoDateTime = DateTime.fromISO(data.datetime, { zone: 'Asia/Manila' }).toISO();
		}

		const encodedNotes = encodeNotes(
			data.concernCategory,
			data.durationDays,
			data.severity,
			data.additional_notes
		);

		const supabaseUrl = env.PUBLIC_SUPABASE_URL;
		const supabaseKey = env.PUBLIC_SUPABASE_ANON_KEY;

		const assigned_pt = await resolveAssignedPt(
			data.preferred_pt,
			isoDateTime,
			supabaseUrl,
			supabaseKey
		);

		const payload = {
			full_name: data.full_name,
			age: data.age.toString(),
			sex: data.sex,
			email: data.email,
			phone_number: data.phone_number,
			occupation: data.occupation,
			service: data.service,
			datetime: isoDateTime,
			additional_notes: encodedNotes,
			session_id: data.session_id,
			source: 'web',
			assigned_pt
		};

		const n8nIntakeUrl = `${privateEnv.N8N_BASE_URL}/webhook/kimutclinic-intake`;
		const response = await fetch(n8nIntakeUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			return json({ success: false, reason: 'network_error' }, { status: 502 });
		}

		const result = await response.json();

		if (result && result.success === false && result.reason === 'duplicate') {
			return json({ success: false, reason: 'duplicate' });
		}

		if (result && result.id && data.session_id) {
			try {
				const supabase = createClient(supabaseUrl, supabaseKey);
				await supabase
					.from('funnel_events')
					.update({ patient_lead_id: result.id })
					.eq('session_id', data.session_id)
					.eq('event', 'submitted');
			} catch (e) {
				console.error('Failed to link funnel_event to lead id', e);
			}
		}

		return json({ success: true, ...result });
	} catch (e) {
		console.error('Assessment submission error:', e);
		return json({ success: false, reason: 'server_error' }, { status: 500 });
	}
}
