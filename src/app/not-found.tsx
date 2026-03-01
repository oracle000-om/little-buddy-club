import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="error-state">
            <div className="error-state__icon">🔍</div>
            <h2 className="error-state__title">Page not found</h2>
            <p className="error-state__text">
                This little buddy might have found a home already!
            </p>
            <Link href="/" className="error-state__retry">
                Browse Available Animals →
            </Link>
        </div>
    );
}
