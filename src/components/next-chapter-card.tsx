import type { AnimalAssessment } from '@/lib/types';
import { formatNextChapterYears, formatBreedAssessment } from '@/lib/utils';
import React from 'react';

export function NextChapterCard({
    assessment,
    ageKnownYears,
    name,
}: {
    assessment: AnimalAssessment | null | undefined;
    ageKnownYears: number | null;
    name?: string | null;
}) {
    if (!assessment) return null;

    const nextChapter = formatNextChapterYears(
        ageKnownYears,
        assessment.ageEstimatedLow,
        assessment.ageEstimatedHigh,
        assessment.lifeExpectancyLow,
        assessment.lifeExpectancyHigh,
    );

    if (!nextChapter.isValid) return null;

    const breedFmt = formatBreedAssessment(assessment.detectedBreeds);
    const firstName = name || 'this little buddy';

    return (
        <div className="next-chapter-card">
            <div className="next-chapter-card__header">
                <span className="next-chapter-card__badge">✨ Evaluated by AI</span>
                <h3 className="next-chapter-card__title">Their Next Chapter</h3>
            </div>

            <p className="next-chapter-card__description">
                Using computer vision and veterinary breed data, we estimate {firstName} has <strong>{nextChapter.text}</strong> ahead with their new family.
            </p>

            <div className="next-chapter-card__stats">
                <div className="next-chapter-card__stat">
                    <span className="next-chapter-card__stat-label">Estimated Age</span>
                    <span className="next-chapter-card__stat-value">
                        {assessment.ageEstimatedLow != null && assessment.ageEstimatedHigh != null
                            ? `${assessment.ageEstimatedLow}–${assessment.ageEstimatedHigh} yrs`
                            : 'Unknown'}
                    </span>
                </div>
                {assessment.detectedBreeds && assessment.detectedBreeds.length > 0 && (
                    <div className="next-chapter-card__stat">
                        <span className="next-chapter-card__stat-label">Estimated Mix</span>
                        <span className="next-chapter-card__stat-value">{breedFmt}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
