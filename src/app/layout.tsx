import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import "./listings.css";
import "./detail.css";
import "./mill-watch.css";

export const metadata: Metadata = {
    title: "Little Buddy Club",
    description: "Give every puppy and kitten from hard places a fighting chance. Browse puppies, kittens, and animals rescued from adverse conditions available for adoption.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://littlebuddy.club'),
    openGraph: {
        title: "Little Buddy Club",
        description: "Give every puppy and kitten from hard places a fighting chance.",
        type: "website",
        siteName: "Little Buddy Club",
    },
    twitter: {
        card: "summary",
        title: "Little Buddy Club",
        description: "Browse puppies, kittens, and rescue animals available for adoption.",
    },
};

export const viewport: Viewport = {
    themeColor: "#4A9CA8",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <header className="header">
                    <div className="container">
                        <Link href="/" className="header__logo">
                            <span className="header__logo-icon">🐾</span>
                            <span className="header__logo-text">Little Buddy <span>Club</span></span>
                        </Link>
                        <nav>
                            <ul className="header__nav">
                                <li><Link href="/mill-watch">Mill Watch</Link></li>
                                <li><Link href="/about">About</Link></li>
                            </ul>
                        </nav>
                    </div>
                </header>

                <main>
                    {children}
                </main>

                <footer className="footer">
                    <div className="container">
                        <p className="footer__tagline">Every little buddy deserves a fresh start.</p>
                        <p>Little Buddy Club &copy; 2026</p>
                        <div className="footer__links">
                            <Link href="/about">About</Link>
                            <span className="footer__sep">·</span>
                            <a href="https://goldenyears.club" target="_blank" rel="noopener">Golden Years Club</a>
                            <span className="footer__sep">·</span>
                            <a href="https://sniffhome.org" target="_blank" rel="noopener">Sniff</a>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
