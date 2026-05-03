import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, { email, missing: true });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email: email.toString(),
			password: password.toString()
		});

		if (error) {
			return fail(400, { email, incorrect: true, message: error.message });
		}

		throw redirect(303, '/admin');
	}
};
