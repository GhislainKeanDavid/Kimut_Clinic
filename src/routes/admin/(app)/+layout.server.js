export const load = async ({ locals }) => {
	const { supabase } = locals;

	let leads = [];
	let funnelEvents = [];
	let therapists = [];

	if (supabase) {
		try {
			// Admin dashboard scope: only paid bookings ever reach the client.
			// pending_payment rows are operational scaffolding (15-min reservation lock)
			// and get reaped by the pg_cron sweep; admin never needs to see them.
			const { data: leadsData, error: leadsError } = await supabase
				.from('patient_leads')
				.select('*')
				.eq('status', 'confirmed')
				.order('created_at', { ascending: false });

			if (!leadsError && leadsData) {
				leads = leadsData;
			}

			const { data: eventsData, error: eventsError } = await supabase
				.from('funnel_events')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(1000);

			if (!eventsError && eventsData) {
				funnelEvents = eventsData;
			}

			const { data: therapistsData, error: therapistsError } = await supabase
				.from('therapists')
				.select('*')
				.eq('active', true)
				.order('full_name', { ascending: true });

			if (!therapistsError && therapistsData) {
				therapists = therapistsData;
			}
		} catch (err) {
			console.error('Error fetching admin data:', err);
		}
	}

	return { leads, funnelEvents, therapists };
};
