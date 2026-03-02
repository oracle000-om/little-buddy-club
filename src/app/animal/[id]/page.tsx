import Link from 'next/link';
import type { Metadata } from 'next';
import { getAnimalById, getAnimalForMetadata, getNearbyBreeders } from '@/lib/queries';
import { SafeImage } from '@/components/SafeImage';
import { NextChapterCard } from '@/components/next-chapter-card';
import { cleanAnimalName, toTitleCase, formatAge, formatIntakeReason, getRescueBadge, formatAgeSegment, formatDaysInShelter, formatShelterLocation, cleanDisplayText, getSaveRate, buildShelterMapUrl } from '@/lib/utils';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const animal = await getAnimalForMetadata(id);
    if (!animal) return { title: 'Animal Not Found — Little Buddy Club' };

    const name = cleanAnimalName(animal.name);
    const breed = toTitleCase(animal.breed || 'Unknown Breed');
    const shelter = animal.shelter?.name || '';
    const title = `${name} — ${breed} | Little Buddy Club`;
    const description = `Meet ${name}, a ${breed} available for adoption at ${shelter}. Give this little buddy a fresh start.`;

    return {
        title,
        description,
        openGraph: { title, description, type: 'article' },
    };
}

export default async function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const animal = await getAnimalById(id);

    if (!animal) notFound();

    const name = cleanAnimalName(animal.name);
    const breed = toTitleCase(animal.breed || 'Unknown Breed');
    const badge = getRescueBadge(animal.intakeReason, animal.ageSegment);
    const intakeLabel = formatIntakeReason(animal.intakeReason, animal.intakeReasonDetail);
    const ageLabel = formatAge(
        animal.ageKnownYears,
        animal.assessment?.ageEstimatedLow ?? null,
        animal.assessment?.ageEstimatedHigh ?? null,
        animal.ageSource,
    );
    const photos = [animal.photoUrl, ...animal.photoUrls].filter(Boolean) as string[];
    const mainPhoto = photos[0];
    const listing = animal.listing;
    const description = cleanDisplayText(listing?.description ?? null);
    const saveRate = animal.shelter ? getSaveRate(animal.shelter.totalIntakeAnnual, animal.shelter.totalEuthanizedAnnual) : null;
    const mapUrl = animal.shelter ? buildShelterMapUrl(animal.shelter) : null;

    // Breeder proximity — fetch nearby breeders with violations
    let nearbyBreeders: Awaited<ReturnType<typeof getNearbyBreeders>> = [];
    try {
        if (animal.shelter?.latitude && animal.shelter?.longitude) {
            nearbyBreeders = await getNearbyBreeders(animal.shelter.latitude, animal.shelter.longitude);
        }
    } catch {
        // Non-critical — silently skip if breeder data unavailable
    }

    return (
        <div className="detail-page">
            <div className="container">
                <Link href="/" className="detail-back" id="back-to-listings">← Back to listings</Link>

                {/* Photo Gallery */}
                {mainPhoto && (
                    <div className="detail-gallery">
                        <SafeImage
                            src={`/api/image-proxy?url=${encodeURIComponent(mainPhoto)}`}
                            alt={`Photo of ${name}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 1200px"
                            style={{ objectFit: 'cover' }}
                            priority
                            unoptimized
                        />
                    </div>
                )}

                {photos.length > 1 && (
                    <div className="detail-gallery__thumbs">
                        {photos.slice(0, 6).map((url, i) => (
                            <div key={i} className="detail-gallery__thumb">
                                <SafeImage
                                    src={`/api/image-proxy?url=${encodeURIComponent(url)}`}
                                    alt={`${name} photo ${i + 1}`}
                                    width={80}
                                    height={60}
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className="detail-header">
                    <div>
                        <h1 className="detail-header__name">{name}</h1>
                        <p className="detail-header__breed">{breed}</p>
                    </div>
                    {listing?.listingUrl && (
                        <a
                            href={listing.listingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="detail-header__cta"
                            id="adopt-cta"
                        >
                            🏠 Meet {name}
                        </a>
                    )}
                </div>

                {/* Rescue Context Panel */}
                {(animal.intakeReason === 'CONFISCATE' || animal.intakeReason.startsWith('CONFISCATE_')) && (
                    <div className={`rescue-context ${badge?.variant === 'parent' ? 'rescue-context--parent' : ''}`}>
                        <div className="rescue-context__header">
                            <span className="rescue-context__icon">{badge?.emoji || '🛡️'}</span>
                            <h2 className="rescue-context__title">
                                {badge?.variant === 'parent' ? 'Survivor Story' : 'Rescue Story'}
                            </h2>
                        </div>
                        <p className="rescue-context__text">
                            {badge?.variant === 'parent' ? (
                                <>{name} is a survivor — likely a former breeding animal rescued from a commercial operation. Parents like {name} have spent their lives producing litters in conditions no animal should endure. Now free, they deserve a loving home where they can finally just be a dog.{animal.intakeReasonDetail && ` ${animal.intakeReasonDetail}`} These animals may be shy at first, but with patience and care they blossom into the most grateful companions you&#39;ll ever meet.</>
                            ) : (
                                <>{name} was rescued from adverse conditions — potentially a breeding mill, cruelty case, or hoarding situation.{intakeLabel && ` Intake reason: ${intakeLabel}.`}{animal.intakeReasonDetail && ` ${animal.intakeReasonDetail}`} Animals from these situations often need extra patience and love as they learn to trust people.</>
                            )}
                        </p>
                    </div>
                )}

                {/* Their Next Chapter */}
                <NextChapterCard assessment={animal.assessment} ageKnownYears={animal.ageKnownYears} name={name} />

                {/* Info Grid */}
                <div className="detail-info">
                    {/* Quick Facts */}
                    <div className="detail-card">
                        <div className="detail-card__title">Quick Facts</div>
                        <div className="detail-card__row">
                            <span className="detail-card__label">Age</span>
                            <span className="detail-card__value">{ageLabel}</span>
                        </div>
                        <div className="detail-card__row">
                            <span className="detail-card__label">Species</span>
                            <span className="detail-card__value">{animal.species === 'DOG' ? '🐶 Dog' : '🐱 Cat'}</span>
                        </div>
                        {animal.sex && animal.sex !== 'UNKNOWN' && (
                            <div className="detail-card__row">
                                <span className="detail-card__label">Sex</span>
                                <span className="detail-card__value">{animal.sex === 'MALE' ? '♂ Male' : '♀ Female'}</span>
                            </div>
                        )}
                        {animal.size && (
                            <div className="detail-card__row">
                                <span className="detail-card__label">Size</span>
                                <span className="detail-card__value">{toTitleCase(animal.size)}</span>
                            </div>
                        )}
                        {animal.ageSegment && animal.ageSegment !== 'UNKNOWN' && (
                            <div className="detail-card__row">
                                <span className="detail-card__label">Life Stage</span>
                                <span className="detail-card__value">{formatAgeSegment(animal.ageSegment)}</span>
                            </div>
                        )}
                        {listing?.weight && (
                            <div className="detail-card__row">
                                <span className="detail-card__label">Weight</span>
                                <span className="detail-card__value">{listing.weight}</span>
                            </div>
                        )}
                        {animal.daysInShelter !== null && (
                            <div className="detail-card__row">
                                <span className="detail-card__label">Waiting</span>
                                <span className="detail-card__value">{formatDaysInShelter(animal.daysInShelter)}</span>
                            </div>
                        )}
                        {badge && (
                            <div className="detail-card__row">
                                <span className="detail-card__label">Origin</span>
                                <span className="detail-card__value">{badge.emoji} {badge.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Compatibility */}
                    <div className="detail-card">
                        <div className="detail-card__title">Compatibility</div>
                        <div className="detail-tags">
                            {listing?.goodWithDogs !== null && listing?.goodWithDogs !== undefined && (
                                <span className={`detail-tag detail-tag--${listing.goodWithDogs ? 'yes' : 'no'}`}>
                                    {listing.goodWithDogs ? '✓' : '✗'} Dogs
                                </span>
                            )}
                            {listing?.goodWithCats !== null && listing?.goodWithCats !== undefined && (
                                <span className={`detail-tag detail-tag--${listing.goodWithCats ? 'yes' : 'no'}`}>
                                    {listing.goodWithCats ? '✓' : '✗'} Cats
                                </span>
                            )}
                            {listing?.goodWithChildren !== null && listing?.goodWithChildren !== undefined && (
                                <span className={`detail-tag detail-tag--${listing.goodWithChildren ? 'yes' : 'no'}`}>
                                    {listing.goodWithChildren ? '✓' : '✗'} Kids
                                </span>
                            )}
                            {listing?.houseTrained !== null && listing?.houseTrained !== undefined && (
                                <span className={`detail-tag detail-tag--${listing.houseTrained ? 'yes' : 'info'}`}>
                                    {listing.houseTrained ? '✓ House Trained' : 'Not House Trained'}
                                </span>
                            )}
                            {listing?.specialNeeds && (
                                <span className="detail-tag detail-tag--info">💛 Special Needs</span>
                            )}
                            {listing?.isAltered !== null && listing?.isAltered !== undefined && (
                                <span className={`detail-tag detail-tag--${listing.isAltered ? 'yes' : 'info'}`}>
                                    {listing.isAltered ? '✓ Spayed/Neutered' : 'Not Altered'}
                                </span>
                            )}
                            {listing?.isVaccinated && (
                                <span className="detail-tag detail-tag--yes">✓ Vaccinated</span>
                            )}
                            {listing?.isMicrochipped && (
                                <span className="detail-tag detail-tag--yes">✓ Microchipped</span>
                            )}
                        </div>
                        {listing?.adoptionFee && (
                            <div className="detail-card__row" style={{ marginTop: 'var(--space-md)' }}>
                                <span className="detail-card__label">Adoption Fee</span>
                                <span className="detail-card__value">{listing.adoptionFee}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {description && (
                    <div className="detail-description">
                        <h2 className="detail-description__title">About {name}</h2>
                        <p className="detail-description__text">{description}</p>
                    </div>
                )}

                {/* Shelter Card */}
                {animal.shelter && (
                    <div className="detail-shelter">
                        <h2 className="detail-shelter__name">
                            {animal.shelter.websiteUrl ? (
                                <a href={animal.shelter.websiteUrl} target="_blank" rel="noopener noreferrer">
                                    {toTitleCase(animal.shelter.name)}
                                </a>
                            ) : (
                                toTitleCase(animal.shelter.name)
                            )}
                        </h2>
                        <p className="detail-shelter__location">
                            📍 {formatShelterLocation(animal.shelter, { titleCase: true })}
                            {mapUrl && (
                                <> · <a href={mapUrl} target="_blank" rel="noopener noreferrer">View on Map</a></>
                            )}
                        </p>
                        <div className="detail-shelter__stats">
                            {saveRate !== null && (
                                <div>
                                    <span className="detail-shelter__stat-value">{saveRate}%</span> save rate
                                </div>
                            )}
                            {animal.shelter.noKillStatus === 'YES' && (
                                <div>✅ No-Kill</div>
                            )}
                            {animal.shelter.phone && (
                                <div>📞 {animal.shelter.phone}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Breeder Proximity Panel */}
                {nearbyBreeders.length > 0 && (
                    <div className="breeder-proximity">
                        <h3 className="breeder-proximity__title">🔍 Nearby Breeders with Violations</h3>
                        <div className="breeder-proximity__list">
                            {nearbyBreeders.map(b => (
                                <div key={b.certNumber} className="breeder-proximity__item">
                                    <div>
                                        <span className="breeder-proximity__name">{b.legalName}</span>
                                        <span className="breeder-proximity__distance">
                                            {' · '}{Math.round(b.distanceMiles)} mi away
                                        </span>
                                    </div>
                                    <div className="breeder-proximity__violations">
                                        {b.totalCritical > 0 && (
                                            <span className="inspection-card__tag inspection-card__tag--critical">
                                                ⚠️ {b.totalCritical}
                                            </span>
                                        )}
                                        {b.totalNonCritical > 0 && (
                                            <span className="inspection-card__tag inspection-card__tag--warning">
                                                {b.totalNonCritical}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
