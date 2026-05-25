import { json } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import { encodeNotes } from '$lib/parse-notes';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

const PT_SLUGS = ['reyes', 'santos', 'dizon'];
const TIMEZONE = 'Asia/Manila';

function getCalendarId(pt) {
	if (pt === 'reyes') return privateEnv.GOOGLE_CALENDAR_ID_REYES || privateEnv.GOOGLE_CALENDAR_ID;
	if (pt === 'santos') return privateEnv.GOOGLE_CALENDAR_ID_SANTOS || privateEnv.GOOGLE_CALENDAR_ID;
	if (pt === 'dizon') return privateEnv.GOOGLE_CALENDAR_ID_DIZON || privateEnv.GOOGLE_CALENDAR_ID;
	// 'any' or unknown → Kimut Clinic calendar (unassigned holding queue)
	return privateEnv.GOOGLE_CALENDAR_ID;
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

		// Only auto-assign a PT when the patient has no preference.
		// Specific-PT bookings go directly to that therapist's calendar.
		// 'any' bookings land in the Kimut Clinic holding calendar; admin assigns later.
		const isSpecificPt = data.preferred_pt && data.preferred_pt !== 'any';
		let assigned_pt = null;

		if (isSpecificPt) {
			assigned_pt = data.preferred_pt;
		}
		// For 'any', leave assigned_pt null — admin will assign from the dashboard

		const calendarId = getCalendarId(assigned_pt);

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
			assigned_pt,
			calendar_id: calendarId
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

		const supabase = createClient(supabaseUrl, supabaseKey);

		// Save gcal_event_id returned by n8n so we can move the event when a therapist is assigned
		if (result && result.id) {
			const updates = {};
			if (result.gcal_event_id) updates.gcal_event_id = result.gcal_event_id;
			if (Object.keys(updates).length > 0) {
				await supabase.from('patient_leads').update(updates).eq('id', result.id);
			}

			// Link funnel events to this lead
			if (data.session_id) {
				try {
					await supabase
						.from('funnel_events')
						.update({ patient_lead_id: result.id })
						.eq('session_id', data.session_id)
						.eq('event', 'submitted');
				} catch (e) {
					console.error('Failed to link funnel_event to lead id', e);
				}
			}
		}

		return json({ success: true, ...result });
	} catch (e) {
		console.error('Assessment submission error:', e);
		return json({ success: false, reason: 'server_error' }, { status: 500 });
	}
}
