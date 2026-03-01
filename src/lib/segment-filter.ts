/**
 * LBC segment filter — the core WHERE clause that defines
 * which animals appear on Little Buddy Club.
 *
 * Surfaces:
 *   - All puppies and young animals (regardless of origin)
 *   - All confiscated animals (breeding mills, cruelty cases, hoarding)
 *     regardless of age — including sub-typed confiscation reasons
 *   - All animals with UNKNOWN age segment (not yet classified by
 *     the enrichment pipeline — shown until they age into a segment)
 *
 * As the enrichment pipeline classifies animals, UNKNOWN entries
 * will naturally graduate to PUPPY/YOUNG/ADULT/SENIOR and
 * adult/senior animals will drop off LBC automatically.
 */
import { IntakeReason } from '@/generated/prisma';

const CONFISCATION_REASONS: IntakeReason[] = [
    IntakeReason.CONFISCATE,
    IntakeReason.CONFISCATE_MILL,
    IntakeReason.CONFISCATE_HOARDING,
    IntakeReason.CONFISCATE_CRUELTY,
];

export function buildLBCClause() {
    return {
        OR: [
            { ageSegment: 'PUPPY' as const },
            { ageSegment: 'YOUNG' as const },
            { ageSegment: 'UNKNOWN' as const },
            { intakeReason: { in: CONFISCATION_REASONS } },
        ],
    };
}
