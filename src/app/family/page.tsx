import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Family — Little Buddy Club',
    description: 'Meet the family of products working to help animals — Golden Years Club, Little Buddy Club, and Sniff.',
};

export default function FamilyPage() {
    return (
        <div className="detail-page">
            <div className="container" style={{ maxWidth: '800px' }}>
                <Link href="/" className="detail-back">← Back to listings</Link>

                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-4xl)', fontWeight: 400, marginBottom: 'var(--space-lg)' }}>
                    The Family
                </h1>

                <p className="detail-description__text" style={{ marginBottom: 'var(--space-xl)', opacity: 0.85 }}>
                    Three products, one mission — give every animal a fair shot.
                    They share the same database, so an animal can appear across platforms simultaneously.
                </p>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">🏆 Golden Years Club</h2>
                    <p className="detail-description__text">
                        Surfacing senior animals on shelter euthanasia lists.
                        These are the dogs and cats running out of time — Golden Years Club gives them
                        visibility, dignity, and a last chance at a real home.
                    </p>
                    <p style={{ marginTop: 'var(--space-md)' }}>
                        <a href="https://goldenyears.club" target="_blank" rel="noopener"
                            style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                            Visit goldenyears.club →
                        </a>
                    </p>
                </div>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">🐾 Little Buddy Club</h2>
                    <p className="detail-description__text">
                        Puppies, kittens, and mill survivors — all in one place.
                        We pull listings from 3,000+ shelters daily and surface young animals alongside
                        adults rescued from commercial breeding operations. You&apos;re here.
                    </p>
                    <p style={{ marginTop: 'var(--space-md)' }}>
                        <Link href="/"
                            style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                            Browse listings →
                        </Link>
                    </p>
                </div>

                <div className="detail-description">
                    <h2 className="detail-description__title">🔍 Sniff</h2>
                    <p className="detail-description__text">
                        Lost pet reunification powered by visual AI matching.
                        Upload a photo of a found animal and Sniff searches shelter intake records
                        to find potential matches — helping lost pets get home faster.
                    </p>
                    <p style={{ marginTop: 'var(--space-md)' }}>
                        <a href="https://sniffhome.org" target="_blank" rel="noopener"
                            style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                            Visit sniffhome.org →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
