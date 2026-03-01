// Type definitions matching our shared Prisma schema
// (Read-only subset used by Little Buddy Club)

export interface Shelter {
    id: string;
    name: string;
    county: string;
    state: string;
    shelterType: 'MUNICIPAL' | 'RESCUE' | 'NO_KILL' | 'FOSTER_BASED' | 'SANCTUARY';
    address: string | null;
    zipCode: string | null;
    phone: string | null;
    websiteUrl: string | null;
    facebookUrl: string | null;
    totalIntakeAnnual: number;
    totalEuthanizedAnnual: number;
    dataYear: number | null;
    dataSourceName: string | null;
    dataSourceUrl: string | null;
    countyPopulation: number | null;
    totalReturnedToOwner: number | null;
    totalTransferred: number | null;
    latitude: number | null;
    longitude: number | null;
    liveReleaseRate: number | null;
    bestFriendsSaveRate: number | null;
    noKillStatus: string | null;
    lastScrapedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    animals?: Animal[];
}

export interface Animal {
    id: string;
    shelterId: string;
    intakeId: string | null;
    name: string | null;
    species: 'DOG' | 'CAT' | 'OTHER';
    breed: string | null;
    sex: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
    size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE' | null;
    photoUrl: string | null;
    photoUrls: string[];
    videoUrl: string | null;
    status: 'AVAILABLE' | 'URGENT' | 'STALE' | 'RESCUE_PULL' | 'ADOPTED' | 'TRANSFERRED' | 'RETURNED_OWNER' | 'EUTHANIZED' | 'DELISTED';
    ageKnownYears: number | null;
    ageSegment: 'PUPPY' | 'YOUNG' | 'ADULT' | 'SENIOR' | 'UNKNOWN';
    ageSource: 'SHELTER_REPORTED' | 'CV_ESTIMATED' | 'UNKNOWN';
    detectedBreeds: string[];
    breedConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    intakeReason: 'OWNER_SURRENDER' | 'STRAY' | 'OWNER_DECEASED' | 'CONFISCATE' | 'RETURN' | 'TRANSFER' | 'INJURED' | 'OTHER' | 'UNKNOWN';
    intakeReasonDetail: string | null;
    intakeDate: Date | null;
    notes: string | null;
    daysInShelter: number | null;
    firstSeenAt: Date | null;
    lastSeenAt: Date | null;
    shelterEntryCount: number;
    createdAt: Date;
    updatedAt: Date;
    shelter?: Shelter;
    sources?: Source[];
    assessment?: AnimalAssessment | null;
    enrichment?: AnimalEnrichment | null;
    listing?: AnimalListing | null;
}

export interface AnimalAssessment {
    id: string;
    animalId: string;
    ageEstimatedLow: number | null;
    ageEstimatedHigh: number | null;
    ageConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    ageIndicators: string[];
    detectedBreeds: string[];
    breedConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    lifeExpectancyLow: number | null;
    lifeExpectancyHigh: number | null;
    bodyConditionScore: number | null;
    coatCondition: string | null;
    visibleConditions: string[];
    healthNotes: string | null;
    aggressionRisk: number | null;
    fearIndicators: string[];
    stressLevel: string | null;
    behaviorNotes: string | null;
    photoQuality: string | null;
    likelyCareNeeds: string[];
    estimatedCareLevel: string | null;
    dataConflicts: string[];
    estimatedWeightLbs: number | null;
    mobilityAssessment: string | null;
    energyLevel: string | null;
}

export interface AnimalEnrichment {
    id: string;
    animalId: string;
    adoptionUrgency: string | null;
    adoptionReadiness: string | null;
    breedHealthRisk: number | null;
    breedCommonConditions: string[];
    estimatedAnnualCost: string | null;
}

export interface AnimalListing {
    id: string;
    animalId: string;
    houseTrained: boolean | null;
    goodWithCats: boolean | null;
    goodWithDogs: boolean | null;
    goodWithChildren: boolean | null;
    specialNeeds: boolean | null;
    description: string | null;
    environmentNeeds: string[];
    coatType: string | null;
    coatColors: string[];
    coatPattern: string | null;
    isMixed: boolean | null;
    isAltered: boolean | null;
    isMicrochipped: boolean | null;
    isVaccinated: boolean | null;
    adoptionFee: string | null;
    listingUrl: string | null;
    isCourtesyListing: boolean | null;
    weight: string | null;
    birthday: Date | null;
    isFosterHome: boolean | null;
}

export interface Source {
    id: string;
    animalId: string;
    sourceType: 'SHELTER_WEBSITE' | 'FACEBOOK_CROSSPOST' | 'MANUAL_ENTRY' | 'OTHER';
    sourceUrl: string;
    scrapedAt: Date;
}

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
}

export interface StatePolicy {
    id: string;
    state: string;
    stateName: string;
    aldfRank: number | null;
    aldfTier: string | null;
    aldfYear: number | null;
    aldfUrl: string | null;
    mandatoryReporting: boolean | null;
    reportingBody: string | null;
    holdingPeriodDays: number | null;
    spayNeuterRequired: boolean | null;
    breedSpecificLegislation: boolean | null;
    bslDetails: string | null;
    vetCrueltyReporting: boolean | null;
    crossReporting: boolean | null;
    policyNotes: string | null;
}

export interface ShelterFinancials {
    id: string;
    shelterId: string;
    ein: string | null;
    totalRevenue: number | null;
    totalExpenses: number | null;
    totalAssets: number | null;
    netAssets: number | null;
    contributions: number | null;
    proPublicaUrl: string | null;
}

export interface AnimalWithShelter extends Animal {
    shelter: Shelter;
}

export interface AnimalWithShelterAndSources extends Animal {
    shelter: Shelter;
    sources: Source[];
}

export interface ShelterWithAnimals extends Shelter {
    animals: Animal[];
    financials?: ShelterFinancials | null;
}
