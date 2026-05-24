import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';
import { getGoogleAccessToken, getGoogleBusy, getGoogleBusyBatch } from '$lib/gcal.js';

const TIMEZONE = 'Asia/Manila';
const PT_SLUGS = ['reyes', 'santos', 'dizon'];

function getCalendarId(pt) {
	if (pt === 'reyes') return env.GOOGLE_CALENDAR_ID_REYES;
	if (pt === 'santos') return env.GOOGLE_CALENDAR_ID_SANTOS;
	if (pt === 'dizon') return env.GOOGLE_CALENDAR_ID_DIZON;
	return env.GOOGLE_CALENDAR_ID;
}

function getSlotsForDate(dateStr) {
	const d = new Date(dateStr + 'T00:00:00');
	const day = d.getDay();
	if (day === 0) return [];
	const endHour = day === 6 ? 12 : 17;
	const slots = [];
	for (let h = 8; h < endHour; h++) {
		slots.push(`${String(h).padStart(2, '0')}:00`);
	}
	return slots;
}

function busyToSlots(busy, dateStr, allSlots) {
	const booked = new Set();
	for (const { start, end } of busy) {
		const busyStart = new Date(start).getTime();
		const busyEnd = new Date(end).getTime();
		for (const slot of allSlots) {
			const slotStart = new Date(`${dateStr}T${slot}:00+08:00`).getTime();
			const slotEnd = slotStart + 3_600_000;
			if (busyStart < slotEnd && busyEnd > slotStart) booked.add(slot);
		}
	}
	return [...booked];
}

async function getSupabaseBookings(timeMin, timeMax, assignedPt = null) {
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseKey) return [];
	try {
		const supabase = createClient(supabaseUrl, supabaseKey);
		let query = supabase
			.from('patient_leads')
			.select('datetime, assigned_pt')
			.gte('datetime', timeMin)
			.lte('datetime', timeMax)
			.in('status', ['Booked', 'Confirmed']);
		if (assignedPt) query = query.eq('assigned_pt', assignedPt);
		const { data } = await query;
		return data || [];
	} catch {
		return [];
	}
}

function rowToSlot(datetimeStr) {
	const d = new Date(datetimeStr);
	const h = parseInt(d.toLocaleString('en-US', { timeZone: TIMEZONE, hour: 'numeric', hour12: false }));
	return `${String(h === 24 ? 0 : h).padStart(2, '0')}:00`;
}

function rowToDate(datetimeStr) {
	return new Date(datetimeStr).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

export async function GET({ url }) {
	const dateStr = url.searchParams.get('date');
	const monthStr = url.searchParams.get('month');
	const pt = url.searchParams.get('pt') || 'any';

	// ── Single date ──────────────────────────────────────────────────────────
	if (dateStr) {
		const allSlots = getSlotsForDate(dateStr);
		if (allSlots.length === 0) return json({ booked_slots: [], fully_booked: true });

		const timeMin = `${dateStr}T00:00:00+08:00`;
		const timeMax = `${dateStr}T23:59:59+08:00`;

		if (pt !== 'any') {
			const calendarId = getCalendarId(pt);
			const [accessToken, rows] = await Promise.all([
				getGoogleAccessToken(),
				getSupabaseBookings(timeMin, timeMax, pt)
			]);
			const busy = await getGoogleBusy(accessToken, calendarId, timeMin, timeMax);
			const googleSlots = busyToSlots(busy, dateStr, allSlots);
			const supabaseSlots = rows.map(r => rowToSlot(r.datetime));
			const booked_slots = [...new Set([...googleSlots, ...supabaseSlots])].filter(s => allSlots.includes(s));
			return json({ booked_slots, fully_booked: booked_slots.length >= allSlots.length });
		}

		// any PT: slot is unavailable only if ALL 3 PTs are busy at that time
		const calIds = PT_SLUGS.map(getCalendarId).filter(Boolean);
		const [accessToken, rows] = await Promise.all([
			getGoogleAccessToken(),
			getSupabaseBookings(timeMin, timeMax)
		]);
		const busyByCalendar = await getGoogleBusyBatch(accessToken, calIds, timeMin, timeMax);

		const perPtBooked = {};
		for (const slug of PT_SLUGS) {
			const busy = busyByCalendar[getCalendarId(slug)] || [];
			perPtBooked[slug] = new Set(busyToSlots(busy, dateStr, allSlots));
		}
		for (const row of rows) {
			const slug = row.assigned_pt?.toLowerCase();
			if (slug && perPtBooked[slug]) perPtBooked[slug].add(rowToSlot(row.datetime));
		}

		const booked_slots = allSlots.filter(slot =>
			PT_SLUGS.every(slug => perPtBooked[slug]?.has(slot))
		);
		return json({ booked_slots, fully_booked: booked_slots.length >= allSlots.length });
	}

	// ── Month view ────────────────────────────────────────────────────────────
	if (monthStr) {
		const [year, month] = monthStr.split('-').map(Number);
		const daysInMonth = new Date(year, month, 0).getDate();
		const lastDay = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
		const timeMin = `${monthStr}-01T00:00:00+08:00`;
		const timeMax = `${lastDay}T23:59:59+08:00`;

		if (pt !== 'any') {
			const calendarId = getCalendarId(pt);
			const [accessToken, rows] = await Promise.all([
				getGoogleAccessToken(),
				getSupabaseBookings(timeMin, timeMax, pt)
			]);
			const busy = await getGoogleBusy(accessToken, calendarId, timeMin, timeMax);

			const byDate = {};
			for (const row of rows) {
				const ds = rowToDate(row.datetime);
				(byDate[ds] ??= []).push(rowToSlot(row.datetime));
			}

			const fully_booked_dates = [];
			for (let d = 1; d <= daysInMonth; d++) {
				const ds = `${monthStr}-${String(d).padStart(2, '0')}`;
				const slots = getSlotsForDate(ds);
				if (slots.length === 0) continue;

				const dayStart = new Date(`${ds}T00:00:00+08:00`).getTime();
				const dayEnd = new Date(`${ds}T23:59:59+08:00`).getTime();
				const dayBusy = busy.filter(({ start, end }) =>
					new Date(start).getTime() < dayEnd && new Date(end).getTime() > dayStart
				);

				const allBooked = new Set([
					...busyToSlots(dayBusy, ds, slots),
					...(byDate[ds] || [])
				]);
				if (slots.every(s => allBooked.has(s))) fully_booked_dates.push(ds);
			}

			return json({ fully_booked_dates });
		}

		// any PT: a day is fully booked only if ALL 3 PTs are fully booked
		const calIds = PT_SLUGS.map(getCalendarId).filter(Boolean);
		const [accessToken, rows] = await Promise.all([
			getGoogleAccessToken(),
			getSupabaseBookings(timeMin, timeMax)
		]);
		const busyByCalendar = await getGoogleBusyBatch(accessToken, calIds, timeMin, timeMax);

		const byDatePt = {};
		for (const row of rows) {
			const ds = rowToDate(row.datetime);
			const slug = row.assigned_pt?.toLowerCase();
			if (!slug) continue;
			((byDatePt[ds] ??= {})[slug] ??= []).push(rowToSlot(row.datetime));
		}

		const fully_booked_dates = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const ds = `${monthStr}-${String(d).padStart(2, '0')}`;
			const slots = getSlotsForDate(ds);
			if (slots.length === 0) continue;

			const dayStart = new Date(`${ds}T00:00:00+08:00`).getTime();
			const dayEnd = new Date(`${ds}T23:59:59+08:00`).getTime();

			const allPtsFull = PT_SLUGS.every(slug => {
				const calBusy = (busyByCalendar[getCalendarId(slug)] || []).filter(({ start, end }) =>
					new Date(start).getTime() < dayEnd && new Date(end).getTime() > dayStart
				);
				const allBooked = new Set([
					...busyToSlots(calBusy, ds, slots),
					...(byDatePt[ds]?.[slug] || [])
				]);
				return slots.every(s => allBooked.has(s));
			});

			if (allPtsFull) fully_booked_dates.push(ds);
		}

		return json({ fully_booked_dates });
	}

	return json({ error: 'Missing date or month parameter' }, { status: 400 });
}
