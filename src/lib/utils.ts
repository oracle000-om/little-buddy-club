/**
 * Utility functions for Little Buddy Club.
 * Adapted from GYC — removes senior-specific functions,
 * adds rescue story formatting.
 */

// ─── Text Formatting ─────────────────────────────────────

/** Normalize ALL-CAPS text to Title Case. */
export function toTitleCase(str: string): string {
    if (!str) return str;
    if (/[a-z]/.test(str)) return str;
    const smalls = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of']);
    return str.toLowerCase().split(/\s+/).map((w, i) =>
        i === 0 || !smalls.has(w)
            ? w.charAt(0).toUpperCase() + w.slice(1)
            : w
    ).join(' ');
}

/** Format shelter location for display. */
export function formatShelterLocation(
    shelter: { county?: string | null; state?: string | null; zipCode?: string | null },
    opts: { titleCase?: boolean } = {},
): string {
    const parts: string[] = [];
    if (shelter.county && shelter.county !== 'Unknown') {
        parts.push(opts.titleCase ? toTitleCase(shelter.county) : shelter.county);
    }
    if (shelter.state && shelter.state !== 'US') {
        parts.push(shelter.state);
    }
    return parts.join(', ');
}

/** Clean text for display — decodes HTML entities, fixes mojibake, strips tags. */
export function cleanDisplayText(text: string | null): string | null {
    if (!text) return null;
    let cleaned = text;
    // Decode numeric HTML entities
    cleaned = cleaned.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
    cleaned = cleaned.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    // Named entities
    cleaned = cleaned.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
    // Fix common mojibake
    cleaned = cleaned.replace(/Ã¢â‚¬â„¢/g, "'").replace(/Ã¢â‚¬/g, '"').replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"').replace(/â€"/g, '—').replace(/â€"/g, '–');
    // Strip tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    return cleaned.trim() || null;
}

// ─── Age & Time Formatting ───────────────────────────────

/** Format age for display — puppies get months, young animals get years. */
export function formatAge(
    knownYears: number | null,
    estimatedLow: number | null,
    estimatedHigh: number | null,
    source: string,
): string {
    if (knownYears !== null) {
        if (knownYears === 0) return 'Under 1 year';
        if (knownYears === 1) return '1 year old';
        return `${knownYears} years old`;
    }
    if (estimatedLow !== null && estimatedHigh !== null) {
        if (estimatedHigh <= 1) return 'Under 1 year';
        if (estimatedLow === estimatedHigh) return `~${estimatedLow} years old`;
        return `~${estimatedLow}–${estimatedHigh} years old`;
    }
    if (estimatedLow !== null) return `~${estimatedLow}+ years old`;
    if (estimatedHigh !== null) return `Up to ~${estimatedHigh} years old`;
    return source !== 'UNKNOWN' ? 'Age unknown' : 'Age unknown';
}

/** Format intake date as "X days ago" or "today". */
export function formatIntakeDate(date: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)}+ years ago`;
}

/** Format days in shelter for display. */
export function formatDaysInShelter(days: number | null): string | null {
    if (days === null || days === undefined) return null;
    if (days === 0) return 'Just arrived';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)}+ years`;
}

// ─── Rescue Story Formatting (LBC-Specific) ──────────────

/** Get a human-friendly label for the intake reason. */
export function formatIntakeReason(reason: string, detail: string | null): string | null {
    const labels: Record<string, string> = {
        CONFISCATE: 'Rescued from adverse conditions',
        STRAY: 'Found as a stray',
        OWNER_SURRENDER: 'Owner surrender',
        OWNER_DECEASED: "Owner's passing",
        RETURN: 'Returned to shelter',
        TRANSFER: 'Transferred from another shelter',
        INJURED: 'Found injured',
        OTHER: detail || 'Other',
        UNKNOWN: '',
    };
    return labels[reason] || null;
}

/** Get a rescue badge label + emoji for display on cards. */
export function getRescueBadge(intakeReason: string): { emoji: string; label: string; variant: string } | null {
    switch (intakeReason) {
        case 'CONFISCATE':
            return { emoji: '🛡️', label: 'Rescued', variant: 'rescue' };
        case 'STRAY':
            return { emoji: '🐾', label: 'Found Stray', variant: 'stray' };
        case 'INJURED':
            return { emoji: '💛', label: 'Healing', variant: 'healing' };
        case 'TRANSFER':
            return { emoji: '🔄', label: 'Transferred', variant: 'transfer' };
        default:
            return null;
    }
}

/** Get a human-friendly age segment label. */
export function formatAgeSegment(segment: string): string {
    switch (segment) {
        case 'PUPPY': return 'Puppy';
        case 'YOUNG': return 'Young';
        case 'ADULT': return 'Adult';
        case 'SENIOR': return 'Senior';
        default: return '';
    }
}

// ─── Shelter Stats ───────────────────────────────────────

/** Calculate save rate from intake/euthanized numbers. */
export function getSaveRate(totalIntake: number, totalEuthanized: number): number | null {
    if (totalIntake <= 0) return null;
    return Math.round(((totalIntake - totalEuthanized) / totalIntake) * 100 * 10) / 10;
}

/** Format shelter stats as a one-line summary. */
export function formatShelterStats(totalIntake: number, totalEuthanized: number): string | null {
    const rate = getSaveRate(totalIntake, totalEuthanized);
    if (rate === null) return null;
    return `${rate}% live release rate`;
}

// ─── Google Maps ─────────────────────────────────────────

/** Build a Google Maps search URL for a shelter's address. */
export function buildShelterMapUrl(
    shelter: { latitude?: number | null; longitude?: number | null; address?: string | null; county?: string | null; state?: string | null },
): string | null {
    if (shelter.latitude && shelter.longitude) {
        return `https://www.google.com/maps/search/?api=1&query=${shelter.latitude},${shelter.longitude}`;
    }
    const parts = [shelter.address, shelter.county, shelter.state].filter(Boolean);
    if (parts.length > 0) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
    }
    return null;
}
