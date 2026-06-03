// Color palette for therapists. Each therapist row carries a `color_key` that
// resolves into a full Tailwind class bundle here. Falls back to a hash of
// slug/name so newly-added therapists without a color_key still get a stable color.

const PALETTE = {
	blue: {
		hex: '#3b82f6',
		bgClass: 'bg-blue-50',
		textClass: 'text-blue-700',
		borderClass: 'border-blue-200',
		dotClass: 'bg-blue-500',
		softBg: 'bg-blue-100',
		softText: 'text-blue-700'
	},
	green: {
		hex: '#22c55e',
		bgClass: 'bg-green-50',
		textClass: 'text-green-700',
		borderClass: 'border-green-200',
		dotClass: 'bg-green-500',
		softBg: 'bg-green-100',
		softText: 'text-green-700'
	},
	amber: {
		hex: '#f59e0b',
		bgClass: 'bg-amber-50',
		textClass: 'text-amber-700',
		borderClass: 'border-amber-200',
		dotClass: 'bg-amber-500',
		softBg: 'bg-amber-100',
		softText: 'text-amber-700'
	},
	purple: {
		hex: '#a855f7',
		bgClass: 'bg-purple-50',
		textClass: 'text-purple-700',
		borderClass: 'border-purple-200',
		dotClass: 'bg-purple-500',
		softBg: 'bg-purple-100',
		softText: 'text-purple-700'
	},
	teal: {
		hex: '#14b8a6',
		bgClass: 'bg-teal-50',
		textClass: 'text-teal-700',
		borderClass: 'border-teal-200',
		dotClass: 'bg-teal-500',
		softBg: 'bg-teal-100',
		softText: 'text-teal-700'
	},
	rose: {
		hex: '#f43f5e',
		bgClass: 'bg-rose-50',
		textClass: 'text-rose-700',
		borderClass: 'border-rose-200',
		dotClass: 'bg-rose-500',
		softBg: 'bg-rose-100',
		softText: 'text-rose-700'
	}
};

const FALLBACK_KEYS = Object.keys(PALETTE);

export function colorForTherapist(therapist) {
	const key = therapist?.color_key;
	if (key && PALETTE[key]) return PALETTE[key];
	const seed = therapist?.slug ?? therapist?.full_name ?? '';
	let h = 0;
	for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return PALETTE[FALLBACK_KEYS[h % FALLBACK_KEYS.length]];
}

export function colorForTherapistSlug(slug, therapists) {
	const t = therapists?.find((x) => x.slug === slug);
	return colorForTherapist(t ?? { slug });
}
