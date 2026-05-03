import { redirect } from '@sveltejs/kit';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

export const load = async ({ locals, url }) => {
	const isPublicPath = PUBLIC_ADMIN_PATHS.some((p) => url.pathname.startsWith(p));

	if (!locals.safeGetSession) {
		if (!isPublicPath) throw redirect(303, '/admin/login');
		return { session: null };
	}

	const { session } = await locals.safeGetSession();

	if (!session && !isPublicPath) {
		throw redirect(303, '/admin/login');
	}

	if (session && url.pathname.startsWith('/admin/login')) {
		throw redirect(303, '/admin');
	}

	return { session };
};
