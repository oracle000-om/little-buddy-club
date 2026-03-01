import Link from 'next/link';
import type { Metadata } from 'next';
import { getFilteredAnimals, getDistinctStates, getSuggestions, getLBCStats } from '@/lib/queries';
import { parseSearchQuery } from '@/lib/search-parser';
import { FilterBar } from './listings/filter-bar';
import { SearchBar } from './listings/search-bar';
import { AnimalGrid } from './listings/animal-grid';
import { Pagination } from './listings/pagination';
import { cleanAnimalName } from '@/lib/utils';
import type { SearchSuggestion, PaginatedResult } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Little Buddy Club — Adopt a Puppy, Kitten, or Mill Survivor',
    description: 'Browse puppies, kittens, and animals rescued from commercial breeding. Meet mill parents looking for their first real home. Give a little buddy a fresh start.',
    openGraph: {
        title: 'Little Buddy Club',
        description: 'Every little buddy deserves a chance — adopt a puppy, kitten, or mill survivor.',
        type: 'website',
        siteName: 'Little Buddy Club',
    },
};

interface SearchParams {
    species?: string;
    state?: string;
    sex?: string;
    q?: string;
    zip?: string;
    sort?: string;
    page?: string;
    radius?: string;
    source?: string;
    rescue?: string;
}

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;

    let result: PaginatedResult = { animals: [], totalCount: 0, page: 1, totalPages: 1, pageSize: 24 };
    let states: string[] = [];
    let suggestions: SearchSuggestion[] = [];
    let stats = { totalAnimals: 0, totalShelters: 0, totalStates: 0 };
    let error = false;

    try {
        [result, states, stats] = await Promise.all([
            getFilteredAnimals(params),
            getDistinctStates(),
            getLBCStats(),
        ]);

        if (result.animals.length === 0 && params.q?.trim()) {
            const intent = parseSearchQuery(params.q);
            suggestions = await getSuggestions(intent);
        }
    } catch (e) {
        console.error('Failed to load listings:', e);
        error = true;
    }

    if (error) {
        return (
            <div className="listings-page">
                <div className="container">
                    <div className="error-state">
                        <div className="error-state__icon">🐾</div>
                        <h2 className="error-state__title">Unable to load listings</h2>
                        <p className="error-state__text">
                            We&apos;re having trouble connecting to our database right now.
                            Please try again in a few moments.
                        </p>
                        <Link href="/" className="error-state__retry">Try Again →</Link>
                    </div>
                </div>
            </div>
        );
    }

    const { animals, totalCount, page, totalPages } = result;
    const isSearching = !!(params.q || params.species || params.state || params.sex || params.rescue);

    return (
        <div className="listings-page">
            <div className="container">
                {/* Hero — only show on first page with no active search */}
                {!isSearching && page === 1 && (
                    <>
                        <section className="hero">
                            <h1 className="hero__title">
                                Every little buddy deserves a <span>chance</span>
                            </h1>
                            <p className="hero__subtitle">
                                Puppies, kittens, and survivors of mills, labs, hoarding, dogfighting, and unlicensed breeders — all in one place.
                            </p>
                            <div className="hero__stats">
                                <div className="hero__stat">
                                    <div className="hero__stat-value">{stats.totalAnimals.toLocaleString()}</div>
                                    <div className="hero__stat-label">Animals Available</div>
                                </div>
                                <div className="hero__stat">
                                    <div className="hero__stat-value">{stats.totalShelters.toLocaleString()}</div>
                                    <div className="hero__stat-label">Shelters</div>
                                </div>
                                <div className="hero__stat">
                                    <div className="hero__stat-value">{stats.totalStates}</div>
                                    <div className="hero__stat-label">States</div>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                <div className="listings-header">
                    <span className="page-badge">🐾 {totalCount.toLocaleString()} Little Buddies</span>
                </div>

                <p className="listings-header__description">
                    Puppies, kittens, and rescued survivors — all looking for their forever homes.
                </p>

                <SearchBar />

                <FilterBar
                    currentSpecies={params.species || 'all'}
                    currentState={params.state || 'all'}
                    currentSex={params.sex || 'all'}
                    currentZip={params.zip || ''}
                    currentSort={params.sort || 'newest'}
                    currentRadius={params.radius || '100'}
                    currentSource={params.source || 'all'}
                    currentRescue={params.rescue || 'all'}
                    hasLocation={!!(params.zip || params.q)}
                    states={states}
                />

                {animals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">🔍</div>
                        <p className="empty-state__text">
                            No animals match your current filters. Try adjusting your search criteria.
                        </p>
                        {suggestions.length > 0 && (
                            <div className="empty-state__suggestions">
                                <p className="empty-state__suggestions-label">Did you mean:</p>
                                {suggestions.map((s) => (
                                    <Link
                                        key={s.q}
                                        href={`/?q=${encodeURIComponent(s.q)}`}
                                        className="empty-state__suggestion"
                                    >
                                        &ldquo;{s.q}&rdquo; — {s.label} ({s.count} results)
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <AnimalGrid animals={animals} totalCount={totalCount} page={page} totalPages={totalPages} />
                        {totalPages > 1 && (
                            <Pagination page={page} totalPages={totalPages} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
