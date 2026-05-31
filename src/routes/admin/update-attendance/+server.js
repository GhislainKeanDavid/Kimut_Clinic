import { json } from '@sveltejs/kit';

const ALLOWED = ['scheduled', 'attended', 'no_show'];

export async function POST({ request, locals }) {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { lead_id, attendance } = await request.json();

		if (!lead_id || !ALLOWED.includes(attendance)) {
			return json({ error: 'Invalid input' }, { status: 400 });
		}

		// Resetting follow_up_count on attendance change keeps the no-show chase tier sane:
		// going from no_show → attended after the patient does reschedule should not leave
		// a half-finished L1 follow-up state hanging.
		const update = { attendance };
		if (attendance !== 'no_show') update.follow_up_count = 0;

		const { error } = await locals.supabase
			.from('patient_leads')
			.update(update)
			.eq('id', lead_id);

		if (error) throw error;

		return json({ success: true });
	} catch (error) {
		console.error('Attendance update error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
