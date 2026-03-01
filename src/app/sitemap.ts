import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { buildLBCClause } from '@/lib/segment-filter';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://littlebuddy.club';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
        { url: `${baseUrl}/mill-watch`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/family`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];

    // Dynamic animal pages (LBC segment only)
    try {
        const animals = await prisma.animal.findMany({
            where: {
                status: { in: ['AVAILABLE', 'URGENT'] },
                AND: [buildLBCClause()],
            },
            select: { id: true, updatedAt: true },
            take: 5000,
        });

        const animalPages: MetadataRoute.Sitemap = animals.map((a) => ({
            url: `${baseUrl}/animal/${a.id}`,
            lastModified: a.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 0.7,
        }));

        return [...staticPages, ...animalPages];
    } catch {
        return staticPages;
    }
}
