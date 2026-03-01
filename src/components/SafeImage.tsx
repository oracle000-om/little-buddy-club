'use client';

import Image from 'next/image';
import { useState } from 'react';

export function SafeImage({ src, alt, ...props }: React.ComponentProps<typeof Image>) {
    const [error, setError] = useState(false);
    if (error || !src) {
        return <div style={{ width: '100%', height: '100%', background: '#EEF6F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🐾</div>;
    }
    return <Image src={src} alt={alt} onError={() => setError(true)} {...props} />;
}
