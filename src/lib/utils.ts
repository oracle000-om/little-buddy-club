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

/** Clean animal name for display — strips asterisks, status suffixes, IDs. */
export function cleanAnimalName(name: string | null): string {
    if (!name) return 'Unknown';
    let cleaned = name.trim();
    // Strip leading/trailing asterisks (shelter markup)
    cleaned = cleaned.replace(/^\*+|\*+$/g, '');
    // Strip common suffixes like "- At shelter", "- foster", "- adopted"
    cleaned = cleaned.replace(/\s*-\s*(at shelter|in foster|foster|adopted|hold|pending|rescue|available|urgent|medical).*$/i, '');
    // Strip trailing IDs like "A650448"
    if (/^[A-Z]\d{4,}$/.test(cleaned)) return 'Unknown';
    // Clean up
    cleaned = cleaned.trim();
    if (!cleaned || cleaned.length < 2) return 'Unknown';
    return toTitleCase(cleaned);
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
        CONFISCATE_MILL: 'Rescued from a breeding operation',
        CONFISCATE_HOARDING: 'Rescued from a hoarding situation',
        CONFISCATE_CRUELTY: 'Rescued from a cruelty case',
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
export function getRescueBadge(
    intakeReason: string,
    ageSegment?: string | null,
): { emoji: string; label: string; variant: string } | null {
    // Confiscation sub-types (future: CONFISCATE_MILL, CONFISCATE_HOARDING, CONFISCATE_CRUELTY)
    if (intakeReason === 'CONFISCATE' || intakeReason.startsWith('CONFISCATE_')) {
        const isParent = ageSegment === 'ADULT' || ageSegment === 'SENIOR';
        if (isParent) {
            return { emoji: '💔', label: 'Parent', variant: 'parent' };
        }
        return { emoji: '🛡️', label: 'Mill Rescue', variant: 'rescue' };
    }
    switch (intakeReason) {
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

// ─── CV Assessment Helpers ───────────────────────────────

/**
 * Get the best available age as a single number.
 * Known age from shelter is trusted first. CV midpoint is the fallback.
 */
export function getBestAge(
    knownYears: number | null,
    estimatedLow: number | null,
    estimatedHigh: number | null,
): { age: number; source: 'shelter' | 'estimated' } | null {
    if (knownYears !== null) {
        return { age: knownYears, source: 'shelter' };
    }
    if (estimatedLow !== null && estimatedHigh !== null) {
        return { age: Math.round((estimatedLow + estimatedHigh) / 2), source: 'estimated' };
    }
    return null;
}

/**
 * Calculate expected "Next Chapter" years from age + breed life expectancy.
 * Uses range-against-range computation instead of collapsing to a midpoint.
 */
export function formatNextChapterYears(
    ageKnownYears: number | null,
    ageEstimatedLow: number | null,
    ageEstimatedHigh: number | null,
    lifeExpLow: number | null,
    lifeExpHigh: number | null,
): { text: string; isRange: boolean; isValid: boolean } {
    if (lifeExpLow === null || lifeExpHigh === null) return { text: '', isRange: false, isValid: false };

    // Build the best age range from all available data
    let ageLow: number | null = null;
    let ageHigh: number | null = null;

    if (ageKnownYears !== null && ageEstimatedLow !== null && ageEstimatedHigh !== null) {
        // Both sources: union (widest range) for maximum honesty
        ageLow = Math.min(ageKnownYears, ageEstimatedLow);
        ageHigh = Math.max(ageKnownYears, ageEstimatedHigh);
    } else if (ageEstimatedLow !== null && ageEstimatedHigh !== null) {
        ageLow = ageEstimatedLow;
        ageHigh = ageEstimatedHigh;
    } else if (ageKnownYears !== null) {
        ageLow = ageKnownYears;
        ageHigh = ageKnownYears;
    }

    if (ageLow === null || ageHigh === null) return { text: '', isRange: false, isValid: false };

    // Range-against-range: best case vs worst case
    const roundHalf = (n: number) => Math.round(n * 2) / 2;
    const remainingLow = roundHalf(Math.max(0, lifeExpLow - ageHigh));   // worst case
    const remainingHigh = roundHalf(Math.max(0, lifeExpHigh - ageLow));  // best case

    if (remainingHigh === 0) return { text: 'near end of expected lifespan', isRange: false, isValid: true };

    const fmt = (n: number) => `${n}`;
    if (remainingLow === remainingHigh) return { text: `${fmt(remainingLow)} years`, isRange: false, isValid: true };
    if (remainingLow === 0) return { text: `up to ${fmt(remainingHigh)} years`, isRange: true, isValid: true };
    return { text: `${fmt(remainingLow)}–${fmt(remainingHigh)} years`, isRange: true, isValid: true };
}

/**
 * Format a list of detected breeds as a Primary / Secondary / Tertiary string.
 */
export function formatBreedAssessment(detectedBreeds: string[] | null | undefined): string {
    if (!detectedBreeds || detectedBreeds.length === 0) {
        return 'Pending';
    }
    return detectedBreeds.slice(0, 3).map(b => toTitleCase(b)).join(' / ');
}
