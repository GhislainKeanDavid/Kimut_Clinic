// Single source of truth for service → color mapping.
// Anywhere a service is shown (patient list badge, pie chart slice, schedule
// block, future analytics, etc.) should import colorForService and use the
// same color set so the UI stays consistent.

const NEUTRAL = {
	hex: '#6b7280',
	bgClass: 'bg-Mist/30',
	textClass: 'text-Dark/60',
	borderClass: 'border-Mist/60',
	dotClass: 'bg-gray-400'
};

export const SERVICE_COLORS = {
	'Manual Therapy': {
		hex: '#6366f1',
		bgClass: 'bg-indigo-50',
		textClass: 'text-indigo-700',
		borderClass: 'border-indigo-200',
		dotClass: 'bg-indigo-500'
	},
	'Sports Rehabilitation': {
		hex: '#ec4899',
		bgClass: 'bg-pink-50',
		textClass: 'text-pink-700',
		borderClass: 'border-pink-200',
		dotClass: 'bg-pink-500'
	},
	'Post-Surgery Recovery': {
		hex: '#3b82f6',
		bgClass: 'bg-blue-50',
		textClass: 'text-blue-700',
		borderClass: 'border-blue-200',
		dotClass: 'bg-blue-500'
	},
	'Neurological Rehabilitation': {
		hex: '#8b5cf6',
		bgClass: 'bg-violet-50',
		textClass: 'text-violet-700',
		borderClass: 'border-violet-200',
		dotClass: 'bg-violet-500'
	},
	'Pain Management': {
		hex: '#ef4444',
		bgClass: 'bg-red-50',
		textClass: 'text-red-700',
		borderClass: 'border-red-200',
		dotClass: 'bg-red-500'
	},
	'Wellness & Posture': {
		hex: '#10b981',
		bgClass: 'bg-emerald-50',
		textClass: 'text-emerald-700',
		borderClass: 'border-emerald-200',
		dotClass: 'bg-emerald-500'
	}
};

// Stable fallback palette for unknown services. The hash maps a name → palette
// index, so the same unknown service always lands on the same color.
const FALLBACK = [
	{
		hex: '#f59e0b',
		bgClass: 'bg-amber-50',
		textClass: 'text-amber-700',
		borderClass: 'border-amber-200',
		dotClass: 'bg-amber-500'
	},
	{
		hex: '#14b8a6',
		bgClass: 'bg-teal-50',
		textClass: 'text-teal-700',
		borderClass: 'border-teal-200',
		dotClass: 'bg-teal-500'
	},
	{
		hex: '#0ea5e9',
		bgClass: 'bg-sky-50',
		textClass: 'text-sky-700',
		borderClass: 'border-sky-200',
		dotClass: 'bg-sky-500'
	},
	{
		hex: '#84cc16',
		bgClass: 'bg-lime-50',
		textClass: 'text-lime-700',
		borderClass: 'border-lime-200',
		dotClass: 'bg-lime-500'
	}
];

export function colorForService(name) {
	if (!name) return NEUTRAL;
	if (SERVICE_COLORS[name]) return SERVICE_COLORS[name];
	let h = 0;
	for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return FALLBACK[h % FALLBACK.length];
}
