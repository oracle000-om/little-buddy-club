import type { Metadata } from 'next';
import { getMillWatchStats, getStatePolicies, getResearchFacilityStats } from '@/lib/queries';
import { USMap } from './us-map';
import type { ResearchFacilityStateStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Industry Watch — Transparency Dashboard | Little Buddy Club',
    description: 'State-by-state USDA inspection data, research facility stats, and animal welfare policy rankings. Understand the industries that affect animals.',
};

export default async function MillWatchPage() {
    let stats: Awaited<ReturnType<typeof getMillWatchStats>> = [];
    let policies: Awaited<ReturnType<typeof getStatePolicies>> = [];
    let labStats: ResearchFacilityStateStats[] = [];
    let error = false;

    try {
        [stats, policies, labStats] = await Promise.all([
            getMillWatchStats(),
            getStatePolicies(),
            getResearchFacilityStats(),
        ]);
    } catch (e) {
        console.error('Mill Watch query failed:', e);
        error = true;
    }

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
                        State-by-state USDA inspection data and welfare policy rankings. Understanding the industry that harms animals.
                    </p>
                </div>

                {/* Educational Introduction */}
                <div className="mill-watch__intro">
                    <h2 className="mill-watch__intro-title">What is a puppy mill?</h2>
                    <p className="mill-watch__intro-text">
                        A puppy mill is a commercial breeding operation that prioritizes profit over the welfare of animals.
                        Dogs are often kept in overcrowded, unsanitary conditions with little to no veterinary care.
                        Breeding females spend their entire lives producing puppies — then are discarded when they can no longer breed.
                    </p>
                    <p className="mill-watch__intro-text">
                        The USDA licenses and inspects commercial breeders under the Animal Welfare Act. The data below is aggregated
                        from those inspection reports at the state level. When you see critical violations, you&apos;re seeing
                        documented failures to meet the <em>minimum</em> standard of care.
                    </p>
                    <div className="mill-watch__violations-key">
                        <div className="mill-watch__violation-def">
                            <span className="inspection-card__tag inspection-card__tag--critical">⚠️ Critical</span>
                            <span>Directly harming animal health or welfare — untreated injuries, overcrowding, no veterinary care</span>
                        </div>
                        <div className="mill-watch__violation-def">
                            <span className="inspection-card__tag inspection-card__tag--warning">⚠ Non-Critical</span>
                            <span>Facility or record-keeping issues — damaged cages, poor housekeeping, expired documentation</span>
                        </div>
                    </div>
                </div>

                {/* Interactive Map */}
                <USMap stats={stats} policies={policies} labStats={labStats} />
            </div>
        </div>
    );
}
