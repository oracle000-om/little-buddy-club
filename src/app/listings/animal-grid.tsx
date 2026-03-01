'use client';

import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { cleanAnimalName, toTitleCase, formatDaysInShelter, getRescueBadge, formatAgeSegment } from '@/lib/utils';
import type { AnimalResult } from '@/lib/queries';

interface AnimalGridProps {
    animals: AnimalResult[];
    totalCount: number;
    page: number;
    totalPages: number;
}

export function AnimalGrid({ animals, totalCount, page, totalPages }: AnimalGridProps) {
    const start = (page - 1) * 24 + 1;
    const end = Math.min(page * 24, totalCount);

    return (
        <>
            <p style={{ color: 'var(--color-text-dim)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)', fontWeight: 600 }}>
                Showing {start}–{end} of {totalCount.toLocaleString()} little buddies
            </p>
            <div className="animal-grid">
                {animals.map((animal) => {
                    const badge = getRescueBadge(animal.intakeReason, animal.ageSegment);
                    const photoSrc = animal.photoUrl
                        ? `/api/image-proxy?url=${encodeURIComponent(animal.photoUrl)}`
                        : null;

                    return (
                        <Link
                            key={animal.id}
                            href={`/animal/${animal.id}`}
                            className="animal-card"
                            id={`animal-${animal.id}`}
                        >
                            <div className="animal-card__photo">
                                {photoSrc ? (
                                    <SafeImage
                                        src={photoSrc}
                                        alt={animal.name || 'Animal photo'}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        style={{ objectFit: 'cover' }}
                                        unoptimized
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--color-bg-raised)' }}>
                                        {animal.species === 'CAT' ? '🐱' : '🐶'}
                                    </div>
                                )}

                                {badge && (
                                    <span className={`animal-card__badge animal-card__badge--${badge.variant}`}>
                                        {badge.emoji} {badge.label}
                                    </span>
                                )}

                                <span className="animal-card__species">
                                    {animal.species === 'CAT' ? '🐱' : '🐶'}
                                </span>
                            </div>

                            <div className="animal-card__body">
                                <div className="animal-card__name">
                                    {cleanAnimalName(animal.name)}
                                </div>
                                <div className="animal-card__breed">
                                    {toTitleCase(animal.breed || 'Unknown Breed')}
                                </div>
                                <div className="animal-card__meta">
                                    {animal.ageSegment && animal.ageSegment !== 'UNKNOWN' && (
                                        <span className="animal-card__tag">
                                            {formatAgeSegment(animal.ageSegment)}
                                        </span>
                                    )}
                                    {animal.sex && animal.sex !== 'UNKNOWN' && (
                                        <span className="animal-card__tag">
                                            {animal.sex === 'MALE' ? '♂ Male' : '♀ Female'}
                                        </span>
                                    )}
                                    {animal.daysInShelter !== null && (
                                        <span className="animal-card__tag">
                                            📅 {formatDaysInShelter(animal.daysInShelter)}
                                        </span>
                                    )}
                                    {animal.distance !== undefined && (
                                        <span className="animal-card__tag">
                                            📍 {animal.distance} mi
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
