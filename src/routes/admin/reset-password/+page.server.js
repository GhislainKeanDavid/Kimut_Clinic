import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') ?? 'invite';

	if (code) {
		// PKCE flow (password reset initiated via forgot-password)
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (error) {
			return { error: 'This reset link is invalid or has expired. Please request a new one.' };
		}
	} else if (tokenHash) {
		// Newer Supabase invite/recovery flow
		const { error } = await locals.supabase.auth.verifyOtp({ token_hash: tokenHash, type });
		if (error) {
			return { error: 'This invite link is invalid or has expired. Please ask an admin to resend the invite.' };
		}
	}

	const { session } = await locals.safeGetSession();

	if (!session) {
		return { error: 'This reset link is invalid or has expired. Please request a new one.' };
	}

	return { ready: true };
};

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const password = formData.get('password');
		const confirm = formData.get('confirm');

		if (!password || !confirm) {
			return fail(400, { error: 'Please fill in both fields.' });
		}

		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password: password.toString() });

		if (error) {
			return fail(400, { error: error.message });
		}

		throw redirect(303, '/admin');
	}
};
