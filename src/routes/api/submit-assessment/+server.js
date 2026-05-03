import { json } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import { encodeNotes } from '$lib/parse-notes';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

export async function POST({ request }) {
	try {
		const data = await request.json();
		
		// 1. Format datetime to ISO 8601 with Asia/Manila +08:00 offset
		// data.datetime looks like "2026-03-24T12:00:00"
		let isoDateTime = '';
		if (data.datetime) {
			isoDateTime = DateTime.fromISO(data.datetime, { zone: 'Asia/Manila' }).toISO();
		}

		// 2. Encode notes
		const encodedNotes = encodeNotes(
			data.concernCategory,
			data.durationDays,
			data.severity,
			data.additional_notes
		);

		// 3. Prepare payload matching n8n contract exactly
		const payload = {
			full_name: data.full_name,
			age: data.age.toString(), // Must be string
			sex: data.sex, // "Male" or "Female"
			email: data.email,
			phone_number: data.phone_number,
			occupation: data.occupation,
			service: data.service,
			datetime: isoDateTime,
			additional_notes: encodedNotes,
			session_id: data.session_id // Additive field for funnel linking
		};

		// 4. POST to n8n
		const n8nIntakeUrl = `${privateEnv.N8N_BASE_URL}/webhook/kimutclinic-intake`;
		const response = await fetch(n8nIntakeUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			// n8n might return 5xx or 4xx on failure
			return json({ success: false, reason: 'network_error' }, { status: 502 });
		}

		const result = await response.json();
		
		// If n8n explicitly says duplicate
		if (result && result.success === false && result.reason === 'duplicate') {
			return json({ success: false, reason: 'duplicate' });
		}

		// 5. If we have a success result and a patient_lead_id in response, update funnel_events
		// Note: The prompt instructed that n8n could update the funnel_events via Supabase REST, 
		// but doing it here as a fallback is also a valid pattern if n8n returns the id.
		if (result && result.id && data.session_id) {
			try {
				const supabaseUrl = env.PUBLIC_SUPABASE_URL;
				const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;
				if (supabaseUrl && supabaseAnonKey) {
					const supabase = createClient(supabaseUrl, supabaseAnonKey);
					await supabase
						.from('funnel_events')
						.update({ patient_lead_id: result.id })
						.eq('session_id', data.session_id)
						.eq('event', 'submitted');
				}
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
