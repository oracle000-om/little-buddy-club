# 🐾 Little Buddy Club

> Give every puppy and kitten from hard places a fighting chance.

Little Buddy Club is a consumer adoption platform focused on puppies, kittens, and animals rescued from adverse conditions — breeding mills, cruelty confiscations, hoarding cases. It's the younger sibling of [Golden Years Club](https://goldenyears.club) (senior animals) and part of the same ecosystem as [Sniff](https://sniffhome.org) (lost pet reunification).

**Live:** [littlebuddy.club](https://littlebuddy.club)

## The Ecosystem

```
┌──────────────────────────────────────────────────┐
│              Shared PostgreSQL DB                 │
│  Animals · Shelters · Breeds · Inspections        │
└───────┬──────────────┬──────────────┬────────────┘
        │              │              │
   Golden Years    Little Buddy     Sniff
    (seniors)     (young/rescue)  (lost pets)
```

All three products read from the same database. LBC is **read-only** — it does not run scrapers or write to the database.

## Segment Filter

LBC surfaces animals matching **any** of these criteria:

| Segment | Filter |
|---------|--------|
| Puppies | `ageSegment = PUPPY` |
| Young animals | `ageSegment = YOUNG` |
| Confiscation rescues | `intakeReason = CONFISCATE` |

This filter (`buildLBCClause()`) is applied to every animal query site-wide.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5, React 19
- **Database:** PostgreSQL via Prisma 7 (`@prisma/adapter-pg`)
- **Styling:** Vanilla CSS (Nunito font, pastel blue/green palette)
- **Images:** Sharp + custom image proxy for shelter photos
- **Deployment:** Railway (separate service)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL (shared PostgreSQL)

# Generate Prisma client
npx prisma generate

# Start dev server (port 3003)
npm run dev
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, stats, featured animals, search/filter listings |
| `/animal/[id]` | Animal detail — photo gallery, rescue context, compatibility, shelter info |
| `/mill-watch` | USDA breeder inspections + state policy rankings (LBC-unique) |
| `/about` | Mission, ecosystem, how it works |

## Key Files

```
src/
├── lib/
│   ├── segment-filter.ts   # buildLBCClause() — the core LBC filter
│   ├── queries.ts           # All database reads (adapted from GYC)
│   ├── db.ts                # Prisma client singleton
│   └── utils.ts             # Rescue badges, formatters
├── app/
│   ├── page.tsx             # Homepage + listings
│   ├── animal/[id]/         # Animal detail
│   ├── mill-watch/          # USDA inspection data
│   └── api/image-proxy/     # Shelter photo proxy
└── components/
    └── SafeImage.tsx         # Image with fallback
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3003 |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run start` | Start production server |

## License

AGPL-3.0-only
