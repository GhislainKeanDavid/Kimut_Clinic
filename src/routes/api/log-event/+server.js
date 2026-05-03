import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

export async function POST({ request }) {
	const body = await request.json();
	const { session_id, event, ...extra } = body;

	if (!session_id || !event) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		// Create a local client for logging
		const supabaseUrl = env.PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;
		
		if (!supabaseUrl || !supabaseAnonKey) {
			// Silently fail if not configured, this is just analytics
			return json({ success: false, reason: 'unconfigured' });
		}

		const supabase = createClient(supabaseUrl, supabaseAnonKey);
		
		const insertData = {
			session_id,
			event,
			user_agent: request.headers.get('user-agent') || 'unknown'
		};

		// Merge in utms if present
		if (extra.utm_source) insertData.utm_source = extra.utm_source;
		if (extra.utm_medium) insertData.utm_medium = extra.utm_medium;
		if (extra.utm_campaign) insertData.utm_campaign = extra.utm_campaign;

		const { error } = await supabase.from('funnel_events').insert(insertData);

		if (error) {
			console.error('Funnel event insert error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ success: true });
	} catch (e) {
		console.error('Funnel event exception:', e);
		return json({ error: 'Internal error' }, { status: 500 });
	}
}
