/**
 * LBC segment filter — the core WHERE clause that defines
 * which animals appear on Little Buddy Club.
 *
 * Surfaces:
 *   - All puppies and young animals (regardless of origin)
 *   - All confiscated animals (breeding mills, cruelty cases, hoarding)
 *     regardless of age
 */
export function buildLBCClause() {
    return {
        OR: [
            { ageSegment: 'PUPPY' as const },
            { ageSegment: 'YOUNG' as const },
            { intakeReason: 'CONFISCATE' as const },
        ],
    };
}
