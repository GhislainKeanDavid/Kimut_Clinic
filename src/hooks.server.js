import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
	const supabaseUrl = env.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		event.locals.supabase = {
			auth: {
				getSession: async () => ({ data: { session: null }, error: null })
			}
		};
		event.locals.safeGetSession = async () => ({ session: null, user: null });
		return resolve(event);
	}

	event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// A helper to safely retrieve session
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		
		if (!session) {
			return { session: null, user: null };
		}
		
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		
		if (error) {
			return { session: null, user: null };
		}
		
		return { session, user };
	};

	// Supabase sends invite/recovery tokens to the Site URL (root).
	// Newer Supabase uses ?token_hash=xxx&type=invite; older PKCE uses ?code=xxx.
	// Redirect both to the reset-password page which handles the exchange.
	const { pathname, search } = event.url;
	const hasAuthParam =
		event.url.searchParams.has('code') ||
		event.url.searchParams.has('token_hash') ||
		event.url.searchParams.has('token');
	if (pathname === '/' && hasAuthParam) {
		throw redirect(303, `/admin/reset-password${search}`);
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
