/**
 * Data access layer — centralized Prisma queries for Little Buddy Club.
 * All database reads go through here so pages stay thin.
 *
 * Key difference from GYC: every animal query includes buildLBCClause()
 * to scope results to puppies, young animals, and confiscation cases.
 */
import { prisma } from './db';
import type { AnimalWithShelter, AnimalWithShelterAndSources, ShelterWithAnimals, MillWatchStateStats, StatePolicy, ResearchFacilityStateStats, ShelterIntakeStats, ConfiscationEvent, PuppyImportStats, CrueltyRegistryStats, PetStoreBanStats, AkcBreedRanking } from './types';
import { parseSearchQuery, type SearchIntent } from './search-parser';
import { geocodeZip, geocodeZipFull, geocodeCounty, haversineDistance } from './geocode';
import { zipToState } from './zip-to-state';
import { buildLBCClause } from './segment-filter';

// ─── Data quality guards ─────────────────────────────────
const PLACEHOLDER_NAMES = [
    'Other / Not Listed', 'Not Listed', 'Unknown', 'N/A', 'NA',
    'None', 'TBD', 'No Name', 'Test', 'TEST', 'Unnamed',
];

// ─── Filters ─────────────────────────────────────────────

export type SortMode = 'newest' | 'distance' | 'days';

export interface AnimalFilters {
    species?: string;
    sex?: string;
    state?: string;
    q?: string;
    zip?: string;
    sort?: string;
    page?: string;
    radius?: string;
    source?: string;
    rescue?: string; // LBC-specific: filter by intake reason
}

export interface AnimalResult extends AnimalWithShelter {
    distance?: number;
}

export interface PaginatedResult {
    animals: AnimalResult[];
    totalCount: number;
    page: number;
    totalPages: number;
    pageSize: number;
}

const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_RADIUS = 100;

// ─── Animal Queries ──────────────────────────────────────

/** Fetch filtered, sorted, paginated animal listings with distance. */
export async function getFilteredAnimals(filters: AnimalFilters): Promise<PaginatedResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, unknown> = {
        status: { in: ['AVAILABLE', 'URGENT'] },
        species: { in: ['DOG', 'CAT'] },
        photoUrl: { not: null },
        name: { notIn: PLACEHOLDER_NAMES },
        shelter: { is: { shelterType: { not: 'SANCTUARY' }, state: { not: 'US' }, county: { not: 'Unknown' } } },
        // Combine the intakeDate OR and LBC clause into AND
        AND: [
            {
                OR: [
                    { intakeDate: null },
                    { intakeDate: { gte: new Date(Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000) } },
                ],
            },
            buildLBCClause(),
        ],
    };

    if (filters.species && filters.species !== 'all') {
        where.species = filters.species.toUpperCase();
    }

    if (filters.sex && filters.sex !== 'all') {
        where.sex = filters.sex.toUpperCase();
    }

    // LBC-specific: rescue type filter
    if (filters.rescue && filters.rescue !== 'all') {
        if (filters.rescue === 'mill') {
            (where.AND as Record<string, unknown>[]).push({
                intakeReason: { in: ['CONFISCATE', 'CONFISCATE_MILL', 'CONFISCATE_HOARDING', 'CONFISCATE_CRUELTY'] },
            });
        } else if (filters.rescue === 'stray') {
            (where.AND as Record<string, unknown>[]).push({ intakeReason: 'STRAY' });
        } else if (filters.rescue === 'surrender') {
            (where.AND as Record<string, unknown>[]).push({ intakeReason: 'OWNER_SURRENDER' });
        }
    }

    // Build shelter relation filter conditions
    const shelterWhere: Record<string, unknown> = { ...(where.shelter as { is: Record<string, unknown> }).is };

    if (filters.state && filters.state !== 'all') {
        shelterWhere.state = { equals: filters.state, mode: 'insensitive' };
    }

    if (filters.source && filters.source !== 'all') {
        if (filters.source === 'municipal') {
            shelterWhere.shelterType = { in: ['MUNICIPAL', 'NO_KILL'] };
        } else if (filters.source === 'rescue') {
            shelterWhere.shelterType = { in: ['RESCUE', 'FOSTER_BASED'] };
        } else {
            shelterWhere.shelterType = filters.source.toUpperCase();
        }
    }

    // NLP search
    let searchIntent: SearchIntent | null = null;
    if (filters.q && filters.q.trim()) {
        searchIntent = parseSearchQuery(filters.q);
        await applySearchIntent(where, searchIntent);
    }

    // Parse sort and page
    const sort: SortMode = (['newest', 'distance', 'days'].includes(filters.sort || '')
        ? filters.sort as SortMode
        : 'newest');
    const page = Math.max(1, parseInt(filters.page || '1', 10) || 1);
    const radius = parseInt(filters.radius || '', 10) || DEFAULT_RADIUS;

    // Resolve user location
    const userZip = filters.zip?.trim() || searchIntent?.zip || null;
    let userCoords: { lat: number; lng: number } | null = null;
    if (userZip && userZip.length >= 3) {
        const zipState = zipToState(userZip);
        if (zipState && !shelterWhere.state) {
            shelterWhere.state = { equals: zipState, mode: 'insensitive' };
        }
        if (userZip.length === 5) {
            const fullGeo = await geocodeZipFull(userZip);
            if (fullGeo) {
                userCoords = { lat: fullGeo.lat, lng: fullGeo.lng };
            }
        }
    }

    if (Object.keys(shelterWhere).length > 0) {
        where.shelter = { is: shelterWhere };
    }

    // Sort order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any[] = [];
    if (searchIntent?.sortByWait) {
        orderBy.push({ intakeDate: { sort: 'asc', nulls: 'last' } });
    } else if (sort === 'newest') {
        orderBy.push({ createdAt: 'desc' });
    } else if (sort === 'days') {
        orderBy.push({ intakeDate: { sort: 'asc', nulls: 'last' } });
    } else {
        orderBy.push({ createdAt: 'desc' });
    }

    const needsDistanceSort = sort === 'distance' && userCoords;
    const needsRadiusFilter = userCoords && filters.radius !== 'any';
    const needsInMemoryPagination = needsDistanceSort || needsRadiusFilter;
    const DISTANCE_WINDOW = 2000;
    const skip = needsInMemoryPagination ? 0 : (page - 1) * DEFAULT_PAGE_SIZE;
    const take = needsInMemoryPagination ? DISTANCE_WINDOW : DEFAULT_PAGE_SIZE;

    const [dbAnimals, count] = await Promise.all([
        prisma.animal.findMany({
            where,
            include: { shelter: true, assessment: true, enrichment: true, listing: true },
            orderBy,
            skip,
            take,
        }) as Promise<AnimalWithShelter[]>,
        prisma.animal.count({ where }),
    ]);

    let animals: AnimalResult[] = dbAnimals as AnimalResult[];
    let totalCount = count;

    // Compute distances
    if (userCoords && animals.length > 0) {
        const shelterLocations = new Map<string, { zip?: string; county?: string; state?: string }>();
        for (const a of animals) {
            if (a.shelter.latitude && a.shelter.longitude) continue;
            const key = a.shelter.zipCode || `${a.shelter.county}|${a.shelter.state}`;
            if (!shelterLocations.has(key)) {
                shelterLocations.set(key, {
                    zip: a.shelter.zipCode || undefined,
                    county: a.shelter.county || undefined,
                    state: a.shelter.state || undefined,
                });
            }
        }

        const locationCoords = new Map<string, { lat: number; lng: number } | null>();
        for (const [key, loc] of shelterLocations) {
            if (loc.zip) {
                locationCoords.set(key, await geocodeZip(loc.zip));
            } else if (loc.county && loc.state) {
                locationCoords.set(key, await geocodeCounty(loc.county, loc.state));
            }
        }

        for (const animal of animals) {
            let sLat = animal.shelter.latitude;
            let sLng = animal.shelter.longitude;
            if (!sLat || !sLng) {
                const key = animal.shelter.zipCode || `${animal.shelter.county}|${animal.shelter.state}`;
                const coords = locationCoords.get(key);
                if (coords) { sLat = coords.lat; sLng = coords.lng; }
            }
            if (sLat && sLng) {
                animal.distance = Math.round(haversineDistance(userCoords.lat, userCoords.lng, sLat, sLng) * 10) / 10;
            }
        }

        if (filters.radius !== 'any') {
            animals = animals.filter(a => a.distance !== undefined && a.distance <= radius);
            totalCount = animals.length;
        }

        if (sort === 'distance') {
            animals.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        }
    }

    if (needsInMemoryPagination) {
        const inMemorySkip = (page - 1) * DEFAULT_PAGE_SIZE;
        animals = animals.slice(inMemorySkip, inMemorySkip + DEFAULT_PAGE_SIZE);
    }

    return {
        animals,
        totalCount,
        page,
        totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
        pageSize: DEFAULT_PAGE_SIZE,
    };
}

// ─── NLP Search Intent → Prisma WHERE ────────────────────

async function applySearchIntent(
    where: Record<string, unknown>,
    intent: SearchIntent,
): Promise<void> {
    const andClauses: Record<string, unknown>[] = [];

    if (intent.species && !where.species) {
        andClauses.push({ species: intent.species });
    }
    if (intent.sex) {
        andClauses.push({ sex: intent.sex });
    }
    if (intent.size) {
        andClauses.push({ size: intent.size });
    }
    if (intent.minAge !== null) {
        andClauses.push({
            OR: [
                { ageKnownYears: { gte: intent.minAge } },
                { assessment: { ageEstimatedLow: { gte: intent.minAge } } },
            ],
        });
    }
    if (intent.maxAge !== null) {
        andClauses.push({
            OR: [
                { ageKnownYears: { lte: intent.maxAge } },
                { assessment: { ageEstimatedHigh: { lte: intent.maxAge } } },
            ],
        });
    }
    if (intent.urgency) {
        andClauses.push({ status: 'URGENT' });
    }
    if (intent.state && !where.shelter) {
        andClauses.push({
            shelter: { is: { state: { equals: intent.state, mode: 'insensitive' } } },
        });
    }
    if (intent.city) {
        andClauses.push({
            OR: [
                { shelter: { is: { county: { contains: intent.city, mode: 'insensitive' } } } },
                { shelter: { is: { name: { contains: intent.city, mode: 'insensitive' } } } },
            ],
        });
    }
    if (intent.colors.length > 0) {
        const colorOr = intent.colors.map((c) => ({
            breed: { contains: c, mode: 'insensitive' as const },
        }));
        andClauses.push({ OR: colorOr });
    }
    if (intent.breeds.length > 0) {
        const breedOr = intent.breeds.map((b) => ({
            breed: { contains: b, mode: 'insensitive' as const },
        }));
        andClauses.push({ OR: breedOr });
    }
    if (intent.breedGroups.length > 0) {
        const profiles = await prisma.breedProfile.findMany({
            where: { breedGroup: { in: intent.breedGroups } },
            select: { name: true },
        });
        if (profiles.length > 0) {
            const groupBreedOr = profiles.map((p: { name: string }) => ({
                breed: { contains: p.name, mode: 'insensitive' as const },
            }));
            andClauses.push({ OR: groupBreedOr });
        }
    }
    if (intent.zip) {
        andClauses.push({
            shelter: { is: { zipCode: { startsWith: intent.zip } } },
        });
    }
    if (intent.careLevel) {
        andClauses.push({ estimatedCareLevel: intent.careLevel });
    }
    for (const token of intent.textTokens) {
        andClauses.push({
            OR: [
                { name: { contains: token, mode: 'insensitive' } },
                { breed: { contains: token, mode: 'insensitive' } },
                { shelter: { is: { name: { contains: token, mode: 'insensitive' } } } },
                { shelter: { is: { county: { contains: token, mode: 'insensitive' } } } },
            ],
        });
    }

    if (andClauses.length > 0) {
        where.AND = [...(where.AND as Record<string, unknown>[] || []), ...andClauses];
    }
}

// ─── "Did You Mean?" Suggestions ─────────────────────────

export interface SearchSuggestion {
    label: string;
    q: string;
    count: number;
}

export async function getSuggestions(intent: SearchIntent): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const relaxations: { label: string; modify: (i: SearchIntent) => SearchIntent }[] = [];

    if (intent.state) {
        relaxations.push({ label: `without ${intent.state}`, modify: (i) => ({ ...i, state: null }) });
    }
    if (intent.city) {
        relaxations.push({ label: `without city filter`, modify: (i) => ({ ...i, city: null }) });
    }
    if (intent.breeds.length > 0) {
        relaxations.push({ label: `any breed`, modify: (i) => ({ ...i, breeds: [] }) });
    }
    if (intent.colors.length > 0) {
        relaxations.push({ label: `any color`, modify: (i) => ({ ...i, colors: [] }) });
    }
    if (intent.sex) {
        relaxations.push({ label: `any gender`, modify: (i) => ({ ...i, sex: null }) });
    }
    if (intent.size) {
        relaxations.push({ label: `any size`, modify: (i) => ({ ...i, size: null }) });
    }
    if (intent.textTokens.length > 0) {
        relaxations.push({ label: `without text filter`, modify: (i) => ({ ...i, textTokens: [] }) });
    }

    for (const relax of relaxations) {
        if (suggestions.length >= 3) break;
        const relaxedIntent = relax.modify({ ...intent });
        const where: Record<string, unknown> = {
            status: { in: ['AVAILABLE', 'URGENT'] },
            AND: [buildLBCClause()],
        };
        await applySearchIntent(where, relaxedIntent);

        const count = await prisma.animal.count({ where });
        if (count > 0) {
            const parts: string[] = [];
            if (relaxedIntent.species) parts.push(relaxedIntent.species.toLowerCase());
            if (relaxedIntent.sex) parts.push(relaxedIntent.sex.toLowerCase());
            if (relaxedIntent.size) parts.push(relaxedIntent.size.toLowerCase());
            for (const b of relaxedIntent.breeds) parts.push(b);
            for (const c of relaxedIntent.colors) parts.push(c);
            if (relaxedIntent.state) parts.push(relaxedIntent.state);
            if (relaxedIntent.city) parts.push(relaxedIntent.city.toLowerCase());
            for (const t of relaxedIntent.textTokens) parts.push(t);
            suggestions.push({ label: relax.label, q: parts.join(' '), count });
        }
    }

    return suggestions;
}

// ─── Single Animal ───────────────────────────────────────

/** Fetch a single animal by ID with shelter and sources. */
export async function getAnimalById(id: string): Promise<AnimalWithShelterAndSources | null> {
    return prisma.animal.findUnique({
        where: { id },
        include: {
            shelter: true,
            sources: true,
            assessment: true,
            enrichment: true,
            listing: true,
        },
    });
}

/** Fetch minimal animal data for metadata generation. */
export async function getAnimalForMetadata(id: string) {
    return prisma.animal.findUnique({
        where: { id },
        include: { shelter: true },
    });
}

// ─── Shelter Queries ─────────────────────────────────────

/** Fetch a shelter by ID with its LBC-segment animals. */
export async function getShelterById(id: string): Promise<ShelterWithAnimals | null> {
    return prisma.shelter.findUnique({
        where: { id },
        include: {
            animals: {
                where: {
                    status: { in: ['AVAILABLE', 'URGENT'] },
                    ...buildLBCClause(),
                },
                orderBy: { createdAt: 'desc' },
            },
            financials: true,
        },
    });
}

// ─── Stats ───────────────────────────────────────────────

/** Get LBC segment stats for the homepage. */
export async function getLBCStats(): Promise<{ totalAnimals: number; totalShelters: number; totalStates: number }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lbcWhere: any = {
        status: { in: ['AVAILABLE', 'URGENT'] },
        species: { in: ['DOG', 'CAT'] },
        AND: [buildLBCClause()],
    };

    const [totalAnimals, shelters] = await Promise.all([
        prisma.animal.count({ where: lbcWhere }),
        prisma.shelter.findMany({
            where: {
                animals: { some: lbcWhere },
            },
            select: { state: true },
        }),
    ]);

    const uniqueStates = new Set(shelters.map(s => s.state));

    return {
        totalAnimals,
        totalShelters: shelters.length,
        totalStates: uniqueStates.size,
    };
}

/** Fetch featured animals for the homepage hero. */
export async function getFeaturedAnimals(count: number = 6): Promise<AnimalWithShelter[]> {
    // Get a pool of photogenic animals and pick randomly
    const pool = await prisma.animal.findMany({
        where: {
            status: { in: ['AVAILABLE', 'URGENT'] },
            species: { in: ['DOG', 'CAT'] },
            photoUrl: { not: null },
            name: { notIn: PLACEHOLDER_NAMES },
            AND: [buildLBCClause()],
        },
        include: { shelter: true, assessment: true, enrichment: true, listing: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
    }) as AnimalWithShelter[];

    // Shuffle and take the requested count
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
}

/** Fetch distinct states with LBC-segment animals. */
export async function getDistinctStates(): Promise<string[]> {
    const VALID_US_STATES = new Set([
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        'DC', 'PR',
    ]);

    const shelters = await prisma.shelter.findMany({
        where: {
            animals: {
                some: {
                    status: { in: ['AVAILABLE', 'URGENT'] },
                    AND: [buildLBCClause()],
                },
            },
        },
        select: { state: true },
    });
    return [...new Set(shelters.map((s) => s.state.toUpperCase()))]
        .filter((s) => VALID_US_STATES.has(s))
        .sort();
}

// ─── Mill Watch Queries (Aggregate Only — No PII) ────────

/** Shape returned by breeder inspection queries. */
export interface BreederInspection {
    id: string;
    certNumber: string;
    licenseType: string;
    legalName: string;
    siteName: string | null;
    city: string | null;
    state: string;
    zipCode: string | null;
    inspectionDate: Date;
    inspectionType: string | null;
    criticalViolations: number;
    nonCritical: number;
    animalCount: number | null;
    latitude: number | null;
    longitude: number | null;
    lastScrapedAt: Date;
}

/** Fetch breeder inspections with optional state filter. */
export async function getBreederInspections(state?: string): Promise<BreederInspection[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (state && state !== 'all') {
        where.state = { equals: state, mode: 'insensitive' };
    }
    return prisma.breederInspection.findMany({
        where,
        orderBy: { inspectionDate: 'desc' },
        take: 100,
    }) as Promise<BreederInspection[]>;
}

/** Fetch aggregate state-level stats from breeder inspections. No individual PII. */
export async function getMillWatchStats(): Promise<MillWatchStateStats[]> {
    const rows: {
        state: string;
        total_inspections: bigint; total_critical: bigint; total_non_critical: bigint;
        total_animals: bigint; total_facilities: bigint; facilities_with_violations: bigint;
        breeder_facilities: bigint; dealer_facilities: bigint;
        breeder_critical: bigint; dealer_critical: bigint;
    }[] = await prisma.$queryRaw`
            SELECT
                state,
                COUNT(*)::bigint AS total_inspections,
                COALESCE(SUM(critical_violations), 0)::bigint AS total_critical,
                COALESCE(SUM(non_critical), 0)::bigint AS total_non_critical,
                COALESCE(SUM(animal_count), 0)::bigint AS total_animals,
                COUNT(DISTINCT cert_number)::bigint AS total_facilities,
                COUNT(DISTINCT CASE WHEN critical_violations > 0 OR non_critical > 0 THEN cert_number END)::bigint AS facilities_with_violations,
                COUNT(DISTINCT CASE WHEN license_type = 'A' THEN cert_number END)::bigint AS breeder_facilities,
                COUNT(DISTINCT CASE WHEN license_type = 'B' THEN cert_number END)::bigint AS dealer_facilities,
                COALESCE(SUM(CASE WHEN license_type = 'A' THEN critical_violations ELSE 0 END), 0)::bigint AS breeder_critical,
                COALESCE(SUM(CASE WHEN license_type = 'B' THEN critical_violations ELSE 0 END), 0)::bigint AS dealer_critical
            FROM breeder_inspections
            GROUP BY state
            ORDER BY total_critical DESC
        `;

    return rows.map(r => ({
        state: r.state,
        totalInspections: Number(r.total_inspections),
        totalCritical: Number(r.total_critical),
        totalNonCritical: Number(r.total_non_critical),
        totalAnimals: Number(r.total_animals),
        totalFacilities: Number(r.total_facilities),
        facilitiesWithViolations: Number(r.facilities_with_violations),
        avgAnimalsPerFacility: Number(r.total_facilities) > 0
            ? Math.round(Number(r.total_animals) / Number(r.total_facilities))
            : 0,
        breederFacilities: Number(r.breeder_facilities),
        dealerFacilities: Number(r.dealer_facilities),
        breederCritical: Number(r.breeder_critical),
        dealerCritical: Number(r.dealer_critical),
    }));
}

/** Fetch all state policies. */
export async function getStatePolicies(): Promise<StatePolicy[]> {
    return prisma.statePolicy.findMany({
        orderBy: { aldfRank: { sort: 'asc', nulls: 'last' } },
    }) as Promise<StatePolicy[]>;
}

/** Get states that have breeder inspections. */
export async function getInspectionStates(): Promise<string[]> {
    const inspections = await prisma.breederInspection.findMany({
        select: { state: true },
        distinct: ['state'],
        orderBy: { state: 'asc' },
    });
    return inspections.map(i => i.state);
}

// ─── Breeder Directory ───────────────────────────────────

export interface BreederProfile {
    certNumber: string;
    legalName: string;
    licenseType: string;
    city: string | null;
    state: string;
    zipCode: string | null;
    latitude: number | null;
    longitude: number | null;
    totalInspections: number;
    totalCritical: number;
    totalNonCritical: number;
    totalAnimals: number | null;
    violationScore: number;
    lastInspectionDate: Date;
    firstInspectionDate: Date;
}

/** Fetch breeder profiles grouped by certNumber, optionally filtered. */
export async function getBreederDirectory(filters?: {
    state?: string;
    violationsOnly?: boolean;
    sort?: 'violations' | 'animals' | 'recent';
}): Promise<BreederProfile[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filters?.state && filters.state !== 'all') {
        where.state = { equals: filters.state, mode: 'insensitive' };
    }

    const inspections = await prisma.breederInspection.findMany({
        where,
        orderBy: { inspectionDate: 'desc' },
    }) as BreederInspection[];

    const breederMap = new Map<string, BreederProfile>();
    for (const insp of inspections) {
        const existing = breederMap.get(insp.certNumber);
        if (existing) {
            existing.totalInspections++;
            existing.totalCritical += insp.criticalViolations;
            existing.totalNonCritical += insp.nonCritical;
            if (insp.animalCount) {
                existing.totalAnimals = Math.max(existing.totalAnimals || 0, insp.animalCount);
            }
            existing.violationScore = existing.totalCritical * 3 + existing.totalNonCritical;
            if (insp.inspectionDate > existing.lastInspectionDate) {
                existing.lastInspectionDate = insp.inspectionDate;
            }
            if (insp.inspectionDate < existing.firstInspectionDate) {
                existing.firstInspectionDate = insp.inspectionDate;
            }
        } else {
            breederMap.set(insp.certNumber, {
                certNumber: insp.certNumber,
                legalName: insp.legalName,
                licenseType: insp.licenseType,
                city: insp.city,
                state: insp.state,
                zipCode: insp.zipCode,
                latitude: insp.latitude,
                longitude: insp.longitude,
                totalInspections: 1,
                totalCritical: insp.criticalViolations,
                totalNonCritical: insp.nonCritical,
                totalAnimals: insp.animalCount,
                violationScore: insp.criticalViolations * 3 + insp.nonCritical,
                lastInspectionDate: insp.inspectionDate,
                firstInspectionDate: insp.inspectionDate,
            });
        }
    }

    let breeders = Array.from(breederMap.values());

    if (filters?.violationsOnly) {
        breeders = breeders.filter(b => b.violationScore > 0);
    }

    const sort = filters?.sort || 'violations';
    if (sort === 'violations') {
        breeders.sort((a, b) => b.violationScore - a.violationScore);
    } else if (sort === 'animals') {
        breeders.sort((a, b) => (b.totalAnimals || 0) - (a.totalAnimals || 0));
    } else if (sort === 'recent') {
        breeders.sort((a, b) => b.lastInspectionDate.getTime() - a.lastInspectionDate.getTime());
    }

    return breeders;
}

/** Find breeders near a given coordinate (for proximity panel on detail page). */
export async function getNearbyBreeders(
    lat: number,
    lng: number,
    radiusMiles: number = 50,
    limit: number = 5,
): Promise<(BreederProfile & { distanceMiles: number })[]> {
    const allBreeders = await getBreederDirectory({ violationsOnly: true });

    return allBreeders
        .filter(b => b.latitude != null && b.longitude != null)
        .map(b => ({
            ...b,
            distanceMiles: haversineDistance(lat, lng, b.latitude!, b.longitude!),
        }))
        .filter(b => b.distanceMiles <= radiusMiles)
        .sort((a, b) => a.distanceMiles - b.distanceMiles)
        .slice(0, limit);
}

// ─── Expanded Data Source Queries ─────────────────────────

/** Aggregate research facility stats by state (no PII — facility-level only). */
export async function getResearchFacilityStats(): Promise<ResearchFacilityStateStats[]> {
    const rows: {
        state: string;
        total_facilities: bigint;
        total_dogs: bigint;
        total_cats: bigint;
        total_pain_d: bigint;
    }[] = await prisma.$queryRaw`
        SELECT
            state,
            COUNT(DISTINCT cert_number)::bigint AS total_facilities,
            COALESCE(SUM(total_dogs), 0)::bigint AS total_dogs,
            COALESCE(SUM(total_cats), 0)::bigint AS total_cats,
            COALESCE(SUM(pain_category_d), 0)::bigint AS total_pain_d
        FROM research_facilities
        GROUP BY state
        ORDER BY total_dogs DESC
    `;

    return rows.map(r => ({
        state: r.state,
        totalFacilities: Number(r.total_facilities),
        totalDogs: Number(r.total_dogs),
        totalCats: Number(r.total_cats),
        totalPainD: Number(r.total_pain_d),
    }));
}

/** Fetch shelter intake trends by state, most recent data. */
export async function getShelterIntakeTrends(state?: string): Promise<ShelterIntakeStats[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (state && state !== 'all') {
        where.state = { equals: state, mode: 'insensitive' };
    }

    return prisma.shelterIntakeStats.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 200,
    }) as Promise<ShelterIntakeStats[]>;
}

/** Fetch recent confiscation events, optionally filtered by state. */
export async function getConfiscationEvents(state?: string, limit = 50): Promise<ConfiscationEvent[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (state && state !== 'all') {
        where.state = { equals: state, mode: 'insensitive' };
    }

    return prisma.confiscationEvent.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
    }) as Promise<ConfiscationEvent[]>;
}

/** Aggregate puppy import stats by country for a given year. */
export async function getPuppyImportStats(year?: number): Promise<PuppyImportStats[]> {
    const where: Record<string, unknown> = {};
    if (year) where.reportYear = year;

    const rows = await prisma.puppyImport.groupBy({
        by: ['originCountry', 'reportYear'],
        where,
        _sum: { dogCount: true, puppyCount: true },
        orderBy: { _sum: { dogCount: 'desc' } },
        take: 50,
    });

    return rows.map(r => ({
        originCountry: r.originCountry,
        totalDogs: r._sum.dogCount ?? 0,
        totalPuppies: r._sum.puppyCount ?? 0,
        reportYear: r.reportYear,
    }));
}

/** Aggregate cruelty registry counts by state (no PII). */
export async function getCrueltyRegistryStats(): Promise<CrueltyRegistryStats[]> {
    const rows = await prisma.crueltyRegistryEntry.groupBy({
        by: ['state', 'jurisdiction', 'registrySource'],
        where: { isActive: true },
        _sum: { count: true },
        _count: { offenseType: true },
        orderBy: { _sum: { count: 'desc' } },
    });

    // For fighting/cruelty breakdown, do a second pass
    return rows.map(r => ({
        state: r.state,
        jurisdiction: r.jurisdiction,
        registrySource: r.registrySource,
        activeEntries: r._sum.count ?? 0,
        fightingCount: 0, // populated by scraper offline
        crueltyCount: 0,
    }));
}

/** Get pet store ban counts by state. */
export async function getPetStoreBanStats(): Promise<PetStoreBanStats[]> {
    const bans = await prisma.petStoreBan.findMany({
        orderBy: { state: 'asc' },
    });

    const byState = new Map<string, PetStoreBanStats>();
    for (const ban of bans) {
        const existing = byState.get(ban.state);
        if (!existing) {
            byState.set(ban.state, {
                state: ban.state,
                statewideban: ban.banType === 'STATEWIDE',
                municipalBanCount: ban.banType === 'MUNICIPAL' ? 1 : 0,
                speciesCovered: [...ban.speciesCovered],
            });
        } else {
            if (ban.banType === 'STATEWIDE') existing.statewideban = true;
            if (ban.banType === 'MUNICIPAL') existing.municipalBanCount++;
        }
    }

    return Array.from(byState.values());
}

/** Get AKC breed rankings for a given year. */
export async function getAkcBreedRankings(year?: number): Promise<AkcBreedRanking[]> {
    const where: Record<string, unknown> = {};
    if (year) {
        where.reportYear = year;
    } else {
        // Get most recent year
        const latest = await prisma.akcBreedRanking.findFirst({
            orderBy: { reportYear: 'desc' },
            select: { reportYear: true },
        });
        if (latest) where.reportYear = latest.reportYear;
    }

    const rows = await prisma.akcBreedRanking.findMany({
        where,
        orderBy: { rank: 'asc' },
    });

    return rows.map(r => ({
        breedName: r.breedName,
        rank: r.rank,
        reportYear: r.reportYear,
        priorYearRank: r.priorYearRank,
        registrations: r.registrations,
    }));
}

/** Fetch states with Beagle Bills (lab animal adoption mandates). */
export async function getBeagleBillStates(): Promise<StatePolicy[]> {
    return prisma.statePolicy.findMany({
        where: { beagleBill: true },
        orderBy: { state: 'asc' },
    }) as Promise<StatePolicy[]>;
}
