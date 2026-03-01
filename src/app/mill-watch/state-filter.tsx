'use client';

import { useRouter } from 'next/navigation';

interface MillStateFilterProps {
    selectedState: string;
    states: string[];
}

export function MillStateFilter({ selectedState, states }: MillStateFilterProps) {
    const router = useRouter();

    return (
        <select
            className="mill-watch__select"
            value={selectedState}
            onChange={(e) => {
                const val = e.target.value;
                router.push(val === 'all' ? '/mill-watch' : `/mill-watch?state=${val}`);
            }}
            aria-label="Filter by state"
            id="mill-state-filter"
        >
            <option value="all">All States</option>
            {states.map(s => (
                <option key={s} value={s}>{s}</option>
            ))}
        </select>
    );
}
