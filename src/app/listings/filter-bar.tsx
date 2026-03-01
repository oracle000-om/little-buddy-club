'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface FilterBarProps {
    currentSpecies: string;
    currentState: string;
    currentSex: string;
    currentZip: string;
    currentSort: string;
    currentRadius: string;
    currentSource: string;
    currentRescue: string;
    hasLocation: boolean;
    states: string[];
}

export function FilterBar({
    currentSpecies,
    currentState,
    currentSex,
    currentSort,
    currentRescue,
    states,
}: FilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const update = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'all' || value === '') {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        params.delete('page');
        router.push(`/?${params.toString()}`);
    }, [router, searchParams]);

    return (
        <div className="filter-bar">
            <select
                className="filter-bar__select"
                value={currentSpecies}
                onChange={(e) => update('species', e.target.value)}
                aria-label="Species"
                id="filter-species"
            >
                <option value="all">All Animals</option>
                <option value="dog">🐶 Dogs</option>
                <option value="cat">🐱 Cats</option>
            </select>

            <select
                className="filter-bar__select"
                value={currentSex}
                onChange={(e) => update('sex', e.target.value)}
                aria-label="Sex"
                id="filter-sex"
            >
                <option value="all">Any Sex</option>
                <option value="male">♂ Male</option>
                <option value="female">♀ Female</option>
            </select>

            <select
                className="filter-bar__select"
                value={currentRescue}
                onChange={(e) => update('rescue', e.target.value)}
                aria-label="Rescue Type"
                id="filter-rescue"
            >
                <option value="all">All Rescues</option>
                <option value="mill">🛡️ Mill Rescue</option>
                <option value="stray">🐾 Found Stray</option>
                <option value="surrender">Owner Surrender</option>
            </select>

            <select
                className="filter-bar__select"
                value={currentState}
                onChange={(e) => update('state', e.target.value)}
                aria-label="State"
                id="filter-state"
            >
                <option value="all">All States</option>
                {states.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            <select
                className="filter-bar__select"
                value={currentSort}
                onChange={(e) => update('sort', e.target.value)}
                aria-label="Sort"
                id="filter-sort"
            >
                <option value="newest">Newest First</option>
                <option value="days">Longest Wait</option>
                <option value="distance">Nearest</option>
            </select>
        </div>
    );
}
