'use client';

export default function Error({ reset }: { reset: () => void }) {
    return (
        <div className="error-state">
            <div className="error-state__icon">🐾</div>
            <h2 className="error-state__title">Something went wrong</h2>
            <p className="error-state__text">
                We hit a bump in the road. Please try again.
            </p>
            <button onClick={() => reset()} className="error-state__retry">
                Try Again →
            </button>
        </div>
    );
}
