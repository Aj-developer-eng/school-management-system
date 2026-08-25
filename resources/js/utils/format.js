/**
 * Format a 24-hour time string (HH:MM or HH:MM:SS) into 12-hour format with AM/PM.
 * Returns null for empty/invalid input so callers can render a placeholder.
 */
export function formatTime(time) {
    if (!time) return null;

    const [hoursStr, minutesStr] = time.split(':');
    const hours = Number(hoursStr);
    const minutes = minutesStr ?? '00';

    if (Number.isNaN(hours)) return null;

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;

    return `${displayHours}:${minutes} ${period}`;
}

/**
 * Render a time range (start – end) in 12-hour format.
 * Falls back to a placeholder when neither value is present.
 */
export function formatTimeRange(startTime, endTime, placeholder = '—') {
    const start = formatTime(startTime);
    const end = formatTime(endTime);

    if (!start && !end) return placeholder;

    return `${start ?? '—'} — ${end ?? '—'}`;
}

/**
 * Format an ISO date/datetime string into a human-readable date
 * (e.g. "Aug 25, 2026"). Returns the placeholder for empty/invalid input.
 */
export function formatDate(date, placeholder = '—') {
    if (!date) return placeholder;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return placeholder;

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format an ISO datetime string into a human-readable date + 12-hour time
 * (e.g. "Aug 25, 2026 2:30 PM"). Returns the placeholder for empty/invalid input.
 */
export function formatDateTime(date, placeholder = '—') {
    if (!date) return placeholder;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return placeholder;

    const datePart = parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
    const timePart = parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    return `${datePart} ${timePart}`;
}

/**
 * Format an ISO datetime string into a 12-hour time with AM/PM
 * (e.g. "2:30 PM"). Returns the placeholder for empty/invalid input.
 */
export function formatDateTimeTime(date, placeholder = '—') {
    if (!date) return placeholder;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return placeholder;

    return parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}
