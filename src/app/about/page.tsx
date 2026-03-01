import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'About — Little Buddy Club',
    description: 'Learn about Little Buddy Club — our mission, the ecosystem, and how we connect puppies and kittens from hard places with loving homes.',
};

export default function AboutPage() {
    return (
        <div className="detail-page">
            <div className="container" style={{ maxWidth: '800px' }}>
                <Link href="/" className="detail-back">← Back to listings</Link>

                <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
                    About Little Buddy Club
                </h1>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">Our Mission</h2>
                    <p className="detail-description__text">
                        Little Buddy Club gives every puppy and kitten from hard places a fighting chance.
                        {'\n\n'}
                        We surface animals rescued from breeding mills, cruelty confiscations, and hoarding cases —
                        alongside all puppies and young animals in shelters across the country. Our goal is to connect
                        these animals with loving families who can give them the fresh start they deserve.
                    </p>
                </div>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">The Ecosystem</h2>
                    <p className="detail-description__text">
                        Little Buddy Club is part of a family of products working to help animals:
                        {'\n\n'}
                        🏆 <strong><a href="https://goldenyears.club" target="_blank" rel="noopener">Golden Years Club</a></strong> — Surfacing senior animals on shelter euthanasia lists, giving them visibility, dignity, and a last chance.
                        {'\n\n'}
                        🐾 <strong>Little Buddy Club</strong> — Puppies, kittens, and animals rescued from adverse conditions. You&apos;re here!
                        {'\n\n'}
                        🔍 <strong><a href="https://sniffhome.org" target="_blank" rel="noopener">Sniff</a></strong> — Lost pet reunification using visual AI matching.
                        {'\n\n'}
                        All three products share the same database — an animal can appear on multiple platforms simultaneously.
                        A puppy confiscated from a breeding mill appears on both Golden Years Club (general listing) and
                        Little Buddy Club (targeted for young/rescue animals).
                    </p>
                </div>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">How It Works</h2>
                    <p className="detail-description__text">
                        We don&apos;t run shelters — we aggregate and surface data from 3,000+ shelters across 50 states.
                        {'\n\n'}
                        Our data pipeline scrapes shelter websites twice daily, enriches listings with computer vision
                        (age estimation, breed detection, health assessment), and surfaces animals that match our
                        segment: puppies, young animals, and those rescued from adverse conditions.
                        {'\n\n'}
                        When you find an animal you&apos;re interested in, we link you directly to the shelter&apos;s
                        listing or provide their contact information. We&apos;re a signal amplifier, not a middleman.
                    </p>
                </div>

                <div className="detail-description">
                    <h2 className="detail-description__title">Mill Watch</h2>
                    <p className="detail-description__text">
                        Our <Link href="/mill-watch">Mill Watch</Link> feature is unique to Little Buddy Club.
                        It surfaces USDA breeder inspection data — including violation records, animal counts,
                        and state animal welfare policy rankings from the Animal Legal Defense Fund.
                        {'\n\n'}
                        This data adds context that shelters don&apos;t typically provide — helping you understand
                        where rescue animals came from and what policies exist to protect them.
                    </p>
                </div>
            </div>
        </div>
    );
}
