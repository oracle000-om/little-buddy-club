export default function Loading() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '1rem',
        }}>
            <div style={{ fontSize: '3rem', animation: 'pulse 1.5s ease-in-out infinite' }}>🐾</div>
            <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Loading little buddies...</p>
        </div>
    );
}
