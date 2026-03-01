import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const [puppyCount, youngCount, adultCount, seniorCount, unknownCount, confiscate, total] = await Promise.all([
            prisma.animal.count({ where: { status: { in: ['AVAILABLE', 'URGENT'] }, ageSegment: 'PUPPY' } }),
            prisma.animal.count({ where: { status: { in: ['AVAILABLE', 'URGENT'] }, ageSegment: 'YOUNG' } }),
            prisma.animal.count({ where: { status: { in: ['AVAILABLE', 'URGENT'] }, ageSegment: 'ADULT' } }),
            prisma.animal.count({ where: { status: { in: ['AVAILABLE', 'URGENT'] }, ageSegment: 'SENIOR' } }),
            prisma.animal.count({ where: { status: { in: ['AVAILABLE', 'URGENT'] }, ageSegment: 'UNKNOWN' } }),
            prisma.animal.count({ where: { status: { in: ['AVAILABLE', 'URGENT'] }, intakeReason: 'CONFISCATE' } }),
            prisma.animal.count({ where: { status: { in: ['AVAILABLE', 'URGENT'] } } }),
        ]);

        return NextResponse.json({
            segments: { PUPPY: puppyCount, YOUNG: youngCount, ADULT: adultCount, SENIOR: seniorCount, UNKNOWN: unknownCount },
            confiscate,
            total,
            lbcTotal: puppyCount + youngCount + confiscate,
        });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
