'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';

export function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
            params.set('q', query.trim());
        } else {
            params.delete('q');
        }
        params.delete('page');
        router.push(`/?${params.toString()}`);
    }, [query, router, searchParams]);

    return (
        <div className="search-bar">
            <form className="search-bar__form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="search-bar__input"
                    placeholder="Search by name, breed, location... e.g. &quot;golden retriever puppy in Texas&quot;"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search animals"
                    id="search-input"
                />
                <button type="submit" className="search-bar__btn" id="search-btn">
                    Search
                </button>
            </form>
        </div>
    );
}
