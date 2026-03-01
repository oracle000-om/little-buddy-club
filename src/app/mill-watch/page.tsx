import type { Metadata } from 'next';
import { getBreederInspections, getInspectionStates, getStatePolicies } from '@/lib/queries';
import Link from 'next/link';
import { MillStateFilter } from './state-filter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Mill Watch — Little Buddy Club',
    description: 'USDA breeder inspection data, violation records, and state animal welfare policy rankings. Tracking breeding mills that harm animals.',
};

interface SearchParams {
    state?: string;
}

export default async function MillWatchPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const selectedState = params.state || 'all';

    let inspections: Awaited<ReturnType<typeof getBreederInspections>> = [];
    let states: string[] = [];
    let policies: Awaited<ReturnType<typeof getStatePolicies>> = [];
    let error = false;

    try {
        [inspections, states, policies] = await Promise.all([
            getBreederInspections(selectedState),
            getInspectionStates(),
            getStatePolicies(),
        ]);
    } catch (e) {
        console.error('Mill Watch query failed:', e);
        error = true;
    }

    const selectedPolicy = selectedState !== 'all'
        ? policies.find(p => p.state.toUpperCase() === selectedState.toUpperCase())
        : null;

    if (error) {
        return (
            <div className="mill-watch">
                <div className="container">
                    <div className="error-state">
                        <div className="error-state__icon">⚠️</div>
                        <h2 className="error-state__title">Unable to load Mill Watch</h2>
                        <p className="error-state__text">Please try again in a few moments.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mill-watch">
            <div className="container">
                <div className="mill-watch__header">
                    <h1 className="mill-watch__title">🔍 Mill Watch</h1>
                    <p className="mill-watch__subtitle">
                        USDA breeder inspection records with violation data. Tracking the operations that harm animals.
                    </p>
                </div>

                {/* State Filter */}
                <div className="mill-watch__filters">
                    <MillStateFilter selectedState={selectedState} states={states} />
                </div>

                {/* State Policy Card (if state selected) */}
                {selectedPolicy && (
                    <div className="policy-card">
                        <div className="policy-card__title">
                            📋 {selectedPolicy.stateName} Animal Welfare Policy
                        </div>
                        {selectedPolicy.aldfRank && (
                            <div className="policy-card__row">
                                <span className="detail-card__label">ALDF Ranking</span>
                                <span className="detail-card__value">
                                    #{selectedPolicy.aldfRank} / 50 ({selectedPolicy.aldfTier || 'N/A'})
                                </span>
                            </div>
                        )}
                        {selectedPolicy.holdingPeriodDays !== null && (
                            <div className="policy-card__row">
                                <span className="detail-card__label">Holding Period</span>
                                <span className="detail-card__value">{selectedPolicy.holdingPeriodDays} days</span>
                            </div>
                        )}
                        {selectedPolicy.mandatoryReporting !== null && (
                            <div className="policy-card__row">
                                <span className="detail-card__label">Mandatory Reporting</span>
                                <span className="detail-card__value">{selectedPolicy.mandatoryReporting ? '✅ Yes' : '❌ No'}</span>
                            </div>
                        )}
                        {selectedPolicy.breedSpecificLegislation !== null && (
                            <div className="policy-card__row">
                                <span className="detail-card__label">Breed-Specific Legislation</span>
                                <span className="detail-card__value">{selectedPolicy.breedSpecificLegislation ? '⚠️ Yes' : '✅ No'}</span>
                            </div>
                        )}
                        {selectedPolicy.vetCrueltyReporting !== null && (
                            <div className="policy-card__row">
                                <span className="detail-card__label">Vet Cruelty Reporting</span>
                                <span className="detail-card__value">{selectedPolicy.vetCrueltyReporting ? '✅ Required' : '❌ Not Required'}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Inspection Cards */}
                {inspections.length === 0 ? (
                    <div className="mill-watch__empty">
                        <p>No inspection records found{selectedState !== 'all' ? ` for ${selectedState}` : ''}.</p>
                    </div>
                ) : (
                    <div className="inspection-grid">
                        {inspections.map((insp) => (
                            <div key={insp.id} className="inspection-card">
                                <div className="inspection-card__name">{insp.legalName}</div>
                                <div className="inspection-card__location">
                                    📍 {[insp.city, insp.state].filter(Boolean).join(', ')}
                                    {insp.zipCode && ` ${insp.zipCode}`}
                                </div>
                                <div className="inspection-card__meta">
                                    {insp.criticalViolations > 0 && (
                                        <span className="inspection-card__tag inspection-card__tag--critical">
                                            ⚠️ {insp.criticalViolations} Critical
                                        </span>
                                    )}
                                    {insp.nonCritical > 0 && (
                                        <span className="inspection-card__tag inspection-card__tag--warning">
                                            {insp.nonCritical} Non-Critical
                                        </span>
                                    )}
                                    {insp.criticalViolations === 0 && insp.nonCritical === 0 && (
                                        <span className="inspection-card__tag inspection-card__tag--info">
                                            No Violations
                                        </span>
                                    )}
                                </div>
                                <div className="inspection-card__details">
                                    <span className="inspection-card__detail-label">Inspection</span>
                                    <span className="inspection-card__detail-value">
                                        {new Date(insp.inspectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="inspection-card__detail-label">Type</span>
                                    <span className="inspection-card__detail-value">{insp.inspectionType || 'N/A'}</span>
                                    <span className="inspection-card__detail-label">License</span>
                                    <span className="inspection-card__detail-value">{insp.certNumber}</span>
                                    {insp.animalCount !== null && (
                                        <>
                                            <span className="inspection-card__detail-label">Animals</span>
                                            <span className="inspection-card__detail-value">{insp.animalCount}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
