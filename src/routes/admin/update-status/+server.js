import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request, locals }) {
	const { session } = await locals.safeGetSession();
	
	// Must be authenticated to update status
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { lead_id, new_status, email } = await request.json();

		if (!lead_id || !new_status || !email) {
			return json({ error: 'Missing fields' }, { status: 400 });
		}

		// 1. Update in Supabase
		const { error: dbError } = await locals.supabase
			.from('patient_leads')
			.update({ 
				status: new_status,
				status_updated_at: new Date().toISOString()
			})
			.eq('id', lead_id);

		if (dbError) throw dbError;

		// 2. Fire n8n Webhook to sync to Google Sheets and trigger downstream workflows
		const n8nPayload = {
			email: email,
			new_status: new_status
		};

		const n8nRes = await fetch(`${env.N8N_BASE_URL}/webhook/kimut-status-update`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(n8nPayload)
		});

		if (!n8nRes.ok) {
			console.warn('n8n webhook failed, but Supabase was updated', n8nRes.statusText);
			// We still return success but maybe warn client
			return json({ success: true, warning: 'Failed to sync to n8n' });
		}

		return json({ success: true });

	} catch (error) {
		console.error('Status update error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
