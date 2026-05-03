import { fail } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		if (!email) {
			return fail(400, { missing: true });
		}

		const redirectTo = `${url.origin}/admin/reset-password`;

		await locals.supabase.auth.resetPasswordForEmail(email.toString(), { redirectTo });

		// Always return success — avoids leaking which emails are registered
		return { success: true };
	}
};
