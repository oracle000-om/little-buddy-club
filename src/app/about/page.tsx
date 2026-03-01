import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'About — Little Buddy Club',
    description: 'Little Buddy Club connects puppies, kittens, and survivors of mills, labs, hoarding, dogfighting, and unlicensed breeders with loving homes.',
};

export default function AboutPage() {
    return (
        <div className="detail-page">
            <div className="container" style={{ maxWidth: '800px' }}>
                <Link href="/" className="detail-back">← Back to listings</Link>

                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-4xl)', fontWeight: 400, marginBottom: 'var(--space-lg)' }}>
                    About Little Buddy Club
                </h1>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">Our Mission</h2>
                    <p className="detail-description__text">
                        Little Buddy Club gives every puppy, kitten, and rescue survivor a fighting chance.
                        {'\n\n'}
                        We surface young animals from shelters across the country alongside adults rescued from
                        mills, research labs, hoarding situations, dogfighting rings, and unlicensed breeders.
                        Our goal is to connect them all with families who see their worth.
                    </p>
                </div>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">Three Pillars</h2>
                    <p className="detail-description__text">
                        <strong>🐾 Adopt young animals</strong> — Puppies, kittens, and young animals looking for their first home.
                        We pull listings from 3,000+ shelters daily and enrich them with breed, age, and health data.
                        {'\n\n'}
                        <strong>💔 Save survivors</strong> — Animals rescued from mills, labs, hoarding, dogfighting, and
                        unlicensed breeders often have the hardest time finding homes. They&apos;ve been through the worst,
                        but they deserve a life outside a cage. We surface them alongside younger animals so they&apos;re not invisible.
                        {'\n\n'}
                        <strong>🔍 Understand the industry</strong> — Our <Link href="/mill-watch">Industry Watch</Link> feature
                        surfaces aggregate USDA inspection data and state-level welfare policy rankings. Awareness is the first step
                        toward change.
                    </p>
                </div>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">The Family</h2>
                    <p className="detail-description__text">
                        Little Buddy Club is part of a family of products working to help animals.
                        They share the same database — an animal can appear across platforms simultaneously.
                        {'\n\n'}
                        <Link href="/family" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Meet the family →</Link>
                    </p>
                </div>

                <div className="detail-description" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="detail-description__title">How It Works</h2>
                    <p className="detail-description__text">
                        We don&apos;t run shelters — we aggregate and surface data from thousands of them.
                        {'\n\n'}
                        Our data pipeline scrapes shelter websites twice daily, enriches listings with computer vision
                        (age estimation, breed detection, health assessment), and surfaces animals that match our
                        segment: puppies, young animals, and those rescued from mills, labs, hoarding, dogfighting, or unlicensed breeders.
                        {'\n\n'}
                        When you find an animal you&apos;re interested in, we link you directly to the shelter&apos;s
                        listing or provide their contact information. We&apos;re a signal amplifier, not a middleman.
                    </p>
                </div>

                <div className="detail-description">
                    <h2 className="detail-description__title">Industry Watch</h2>
                    <p className="detail-description__text">
                        <Link href="/mill-watch">Industry Watch</Link> is unique to Little Buddy Club. It surfaces aggregate USDA
                        inspection data — state-level violation trends, animal counts, and welfare policy rankings — to help
                        the public understand the scope of commercial breeding in America.
                        {'\n\n'}
                        Why does this matter? Many rescue animals on this platform came from these operations.
                        Industry Watch provides context about the systems that produce these animals, without targeting
                        any individuals.
                    </p>
                </div>
            </div>
        </div>
    );
}
