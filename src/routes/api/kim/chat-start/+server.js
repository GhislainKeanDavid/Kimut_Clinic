import { json } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const TZ = 'Asia/Manila';

function buildDateContext() {
	const now = DateTime.now().setZone(TZ);
	const lines = [];
	for (let i = 0; i < 14; i++) {
		const d = now.plus({ days: i });
		const tag = i === 0 ? ' (today)' : i === 1 ? ' (tomorrow)' : '';
		lines.push(`${d.toFormat('cccc, LLLL d, yyyy')}${tag}`);
	}
	return {
		current_datetime_manila: now.toFormat("cccc, LLLL d, yyyy 'at' h:mm a 'Manila time'"),
		upcoming_dates: lines.join('\n')
	};
}

export async function POST() {
	const apiKey = privateEnv.RETELL_API_KEY;
	const agentId =
		publicEnv.PUBLIC_RETELL_CHAT_AGENT_ID || publicEnv.PUBLIC_RETELL_AGENT_ID;

	if (!apiKey || !agentId) {
		return json(
			{
				success: false,
				reason: 'not_configured',
				debug: {
					has_api_key: Boolean(apiKey),
					has_agent_id: Boolean(agentId)
				}
			},
			{ status: 503 }
		);
	}

	try {
		const res = await fetch('https://api.retellai.com/create-chat', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				agent_id: agentId,
				retell_llm_dynamic_variables: buildDateContext()
			})
		});

		if (!res.ok) {
			const text = await res.text();
			console.error('Retell create-chat failed:', res.status, text);
			return json(
				{
					success: false,
					reason: 'retell_error',
					debug: {
						upstream_status: res.status,
						upstream_body: text.slice(0, 500),
						agent_id_prefix: agentId.slice(0, 12)
					}
				},
				{ status: 502 }
			);
		}

		const data = await res.json();
		return json({ success: true, chat_id: data.chat_id });
	} catch (e) {
		console.error('chat-start error:', e);
		return json(
			{ success: false, reason: 'server_error', debug: { message: e?.message } },
			{ status: 500 }
		);
	}
}
