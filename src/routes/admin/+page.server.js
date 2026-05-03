export const load = async ({ locals }) => {
	const { supabase } = locals;
	
	// Default empty fallback data
	let leads = [];
	let funnelEvents = [];

	if (supabase) {
		try {
			// Fetch Leads
			const { data: leadsData, error: leadsError } = await supabase
				.from('patient_leads')
				.select('*')
				.order('created_at', { ascending: false });

			if (!leadsError && leadsData) {
				leads = leadsData;
			}

			// Fetch Funnel Events (last 30 days, or just recent ones)
			const { data: eventsData, error: eventsError } = await supabase
				.from('funnel_events')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(1000);

			if (!eventsError && eventsData) {
				funnelEvents = eventsData;
			}
		} catch (err) {
			console.error('Error fetching admin data:', err);
		}
	}

	return {
		leads,
		funnelEvents
	};
};
