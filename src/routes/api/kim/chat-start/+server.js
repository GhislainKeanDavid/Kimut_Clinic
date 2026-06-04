import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export async function POST() {
	const apiKey = privateEnv.RETELL_API_KEY;
	const agentId =
		publicEnv.PUBLIC_RETELL_CHAT_AGENT_ID || publicEnv.PUBLIC_RETELL_AGENT_ID;

	if (!apiKey || !agentId) {
		return json({ success: false, reason: 'not_configured' }, { status: 503 });
	}

	try {
		const res = await fetch('https://api.retellai.com/create-chat', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ agent_id: agentId })
		});

		if (!res.ok) {
			const text = await res.text();
			console.error('Retell create-chat failed:', res.status, text);
			return json({ success: false, reason: 'retell_error' }, { status: 502 });
		}

		const data = await res.json();
		return json({ success: true, chat_id: data.chat_id });
	} catch (e) {
		console.error('chat-start error:', e);
		return json({ success: false, reason: 'server_error' }, { status: 500 });
	}
}
