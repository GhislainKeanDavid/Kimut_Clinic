import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const PT_CALENDAR_IDS = {
	reyes: () => env.GOOGLE_CALENDAR_ID_REYES || env.GOOGLE_CALENDAR_ID,
	santos: () => env.GOOGLE_CALENDAR_ID_SANTOS || env.GOOGLE_CALENDAR_ID,
	dizon: () => env.GOOGLE_CALENDAR_ID_DIZON || env.GOOGLE_CALENDAR_ID
};

export async function POST({ request, locals }) {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { lead_id, new_pt } = await request.json();

		if (!lead_id || !new_pt || !PT_CALENDAR_IDS[new_pt]) {
			return json({ error: 'Missing or invalid fields' }, { status: 400 });
		}

		// Fetch current lead to get gcal_event_id and old calendar_id
		const { data: lead, error: fetchError } = await locals.supabase
			.from('patient_leads')
			.select('gcal_event_id, calendar_id, datetime, full_name, phone_number, email, service, age, sex, occupation, additional_notes')
			.eq('id', lead_id)
			.single();

		if (fetchError || !lead) {
			return json({ error: 'Lead not found' }, { status: 404 });
		}

		const new_calendar_id = PT_CALENDAR_IDS[new_pt]();

		// Call n8n to delete old event and create new one in the PT's calendar
		const n8nPayload = {
			lead_id,
			new_pt,
			new_calendar_id,
			old_gcal_event_id: lead.gcal_event_id,
			old_calendar_id: lead.calendar_id,
			// Event details for creating the new calendar entry
			datetime: lead.datetime,
			full_name: lead.full_name,
			phone_number: lead.phone_number,
			email: lead.email,
			service: lead.service,
			age: lead.age,
			sex: lead.sex,
			occupation: lead.occupation,
			additional_notes: lead.additional_notes
		};

		const n8nRes = await fetch(`${env.N8N_BASE_URL}/webhook/kimut-assign-therapist`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(n8nPayload)
		});

		if (!n8nRes.ok) {
			console.error('n8n assign-therapist webhook failed:', n8nRes.statusText);
			// Still update the DB assignment even if calendar move fails
		}

		const n8nResult = n8nRes.ok ? await n8nRes.json() : {};

		// Update lead in Supabase
		const { error: updateError } = await locals.supabase
			.from('patient_leads')
			.update({
				assigned_pt: new_pt,
				calendar_id: new_calendar_id,
				...(n8nResult.new_gcal_event_id ? { gcal_event_id: n8nResult.new_gcal_event_id } : {})
			})
			.eq('id', lead_id);

		if (updateError) throw updateError;

		return json({ success: true, new_gcal_event_id: n8nResult.new_gcal_event_id });
	} catch (error) {
		console.error('Assign therapist error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
