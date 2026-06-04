import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';

export async function POST({ request }) {
	const apiKey = privateEnv.RETELL_API_KEY;
	if (!apiKey) {
		return json({ success: false, reason: 'not_configured' }, { status: 503 });
	}

	try {
		const { chat_id, content } = await request.json();
		if (!chat_id || !content) {
			return json({ success: false, reason: 'bad_request' }, { status: 400 });
		}

		const res = await fetch('https://api.retellai.com/create-chat-completion', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ chat_id, content })
		});

		if (!res.ok) {
			const text = await res.text();
			console.error('Retell chat-completion failed:', res.status, text);
			return json(
				{
					success: false,
					reason: 'retell_error',
					debug: {
						upstream_status: res.status,
						upstream_body: text.slice(0, 500)
					}
				},
				{ status: 502 }
			);
		}

		const data = await res.json();
		return json({ success: true, messages: data.messages || [] });
	} catch (e) {
		console.error('chat-send error:', e);
		return json({ success: false, reason: 'server_error' }, { status: 500 });
	}
}
