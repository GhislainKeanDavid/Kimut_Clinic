import { json } from '@sveltejs/kit';

const ALLOWED_STATUSES = ['confirmed'];

export async function POST({ request, locals }) {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { lead_id, new_status } = await request.json();

		if (!lead_id || !new_status) {
			return json({ error: 'Missing fields' }, { status: 400 });
		}

		if (!ALLOWED_STATUSES.includes(new_status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}

		const { error: dbError } = await locals.supabase
			.from('patient_leads')
			.update({
				status: new_status,
				status_updated_at: new Date().toISOString()
			})
			.eq('id', lead_id);

		if (dbError) throw dbError;

		return json({ success: true });
	} catch (error) {
		console.error('Status update error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
