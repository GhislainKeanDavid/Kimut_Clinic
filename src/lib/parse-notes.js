/**
 * Helper to encode concern, duration, and severity into additional_notes
 */
export function encodeNotes(concernCategory, durationDays, severity, userNotes = '') {
	// e.g. "Concern: Back & Neck Pain. Duration: 14 days. Severity: 7/10.\n\nUser notes"
	let encoded = `Concern: ${concernCategory}.\nDuration: ${durationDays} days.\nSeverity: ${severity}/10.`;
	if (userNotes && userNotes.trim().length > 0) {
		encoded += `\n\n${userNotes.trim()}`;
	}
	return encoded;
}

/**
 * Parses the structured prefix back out of additional_notes
 * Returns { concern, duration, severity, notes }
 */
export function parseNotes(rawNotes = '') {
	const result = { concern: 'Unknown', duration: null, severity: null, notes: '' };
	if (!rawNotes) return result;

	const concernMatch = rawNotes.match(/Concern:\s*([^\.]+)\./i);
	if (concernMatch) result.concern = concernMatch[1].trim();

	const durationMatch = rawNotes.match(/Duration:\s*(\d+)\s*days\./i);
	if (durationMatch) result.duration = parseInt(durationMatch[1], 10);

	const severityMatch = rawNotes.match(/Severity:\s*(\d+)\/10\./i);
	if (severityMatch) result.severity = parseInt(severityMatch[1], 10);

	// The rest is user notes
	const splitIndex = rawNotes.indexOf('\n\n');
	if (splitIndex !== -1) {
		result.notes = rawNotes.substring(splitIndex + 2).trim();
	} else if (!concernMatch && !durationMatch && !severityMatch) {
		result.notes = rawNotes.trim();
	}

	return result;
}
