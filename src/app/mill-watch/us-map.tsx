'use client';

import { useState } from 'react';
import type { MillWatchStateStats, ResearchFacilityStateStats, StatePolicy } from '@/lib/types';

type DataLayer = 'breeding' | 'dealers' | 'labs';

/* ──────────────────────────────────────────────────────────────────
   SVG paths for each US state (simplified outlines).
   Source: adapted from public-domain US state SVG data.
   ────────────────────────────────────────────────────────────── */
const STATE_PATHS: Record<string, { d: string; x: number; y: number }> = {
    AL: { d: "M628,466 L628,541 L623,558 L636,559 L636,546 L644,530 L642,466Z", x: 633, y: 510 },
    AK: { d: "M161,485 L148,490 L140,510 L145,525 L168,530 L180,525 L192,537 L180,550 L161,545Z", x: 165, y: 515 },
    AZ: { d: "M205,430 L205,510 L260,510 L265,475 L245,430Z", x: 230, y: 470 },
    AR: { d: "M555,460 L555,510 L615,510 L615,455 L580,455Z", x: 582, y: 480 },
    CA: { d: "M115,300 L100,350 L110,420 L135,470 L145,505 L175,515 L195,500 L205,430 L185,360 L165,300Z", x: 148, y: 400 },
    CO: { d: "M290,350 L290,410 L385,410 L385,350Z", x: 335, y: 378 },
    CT: { d: "M812,235 L812,255 L838,248 L835,230Z", x: 823, y: 243 },
    DE: { d: "M775,318 L780,340 L788,330 L785,310Z", x: 782, y: 322 },
    FL: { d: "M650,545 L685,540 L720,545 L738,570 L730,605 L705,630 L688,620 L665,595 L650,575 L640,555Z", x: 690, y: 575 },
    GA: { d: "M660,455 L660,545 L700,545 L700,505 L690,455Z", x: 678, y: 498 },
    HI: { d: "M280,560 L295,555 L310,560 L305,575 L285,575Z", x: 293, y: 566 },
    ID: { d: "M220,175 L200,205 L205,290 L245,290 L255,230 L240,175Z", x: 225, y: 230 },
    IL: { d: "M575,290 L575,400 L610,410 L615,380 L605,290Z", x: 592, y: 345 },
    IN: { d: "M615,290 L610,400 L650,400 L650,290Z", x: 630, y: 345 },
    IA: { d: "M490,270 L490,325 L570,325 L575,270Z", x: 530, y: 295 },
    KS: { d: "M395,365 L395,425 L515,425 L515,365Z", x: 455, y: 395 },
    KY: { d: "M610,390 L610,425 L695,415 L710,395 L670,385Z", x: 655, y: 405 },
    LA: { d: "M555,520 L555,575 L595,580 L610,565 L610,515Z", x: 580, y: 545 },
    ME: { d: "M835,130 L830,170 L850,185 L860,160 L850,130Z", x: 845, y: 155 },
    MD: { d: "M740,310 L740,340 L790,335 L785,310Z", x: 762, y: 322 },
    MA: { d: "M820,220 L820,238 L855,230 L850,215Z", x: 835, y: 226 },
    MI: { d: "M605,195 L595,230 L605,270 L625,280 L650,270 L660,230 L640,195 L620,200Z", x: 625, y: 235 },
    MN: { d: "M475,145 L475,255 L540,255 L545,195 L520,145Z", x: 507, y: 200 },
    MS: { d: "M590,460 L590,545 L625,558 L628,540 L628,460Z", x: 608, y: 500 },
    MO: { d: "M520,345 L520,435 L575,455 L615,455 L615,400 L575,400 L575,345Z", x: 560, y: 395 },
    MT: { d: "M255,130 L255,200 L380,200 L380,140 L320,125Z", x: 315, y: 165 },
    NE: { d: "M380,290 L380,345 L490,345 L490,290Z", x: 435, y: 315 },
    NV: { d: "M175,270 L175,410 L210,430 L225,370 L205,270Z", x: 195, y: 345 },
    NH: { d: "M830,165 L830,210 L845,205 L845,160Z", x: 837, y: 185 },
    NJ: { d: "M788,265 L785,305 L795,315 L800,288 L795,265Z", x: 792, y: 288 },
    NM: { d: "M260,430 L260,520 L350,520 L350,430Z", x: 305, y: 475 },
    NY: { d: "M735,190 L735,255 L810,240 L815,225 L800,195 L770,185Z", x: 770, y: 220 },
    NC: { d: "M660,395 L660,440 L770,430 L780,415 L730,395Z", x: 715, y: 418 },
    ND: { d: "M380,140 L380,200 L475,200 L475,145 L430,135Z", x: 428, y: 170 },
    OH: { d: "M655,280 L655,370 L710,370 L715,295 L690,275Z", x: 682, y: 325 },
    OK: { d: "M380,415 L380,470 L520,470 L520,435 L440,435 L440,415Z", x: 450, y: 445 },
    OR: { d: "M115,175 L115,265 L205,265 L220,215 L200,175Z", x: 160, y: 218 },
    PA: { d: "M715,255 L715,310 L790,305 L790,265 L740,255Z", x: 750, y: 282 },
    RI: { d: "M835,235 L835,250 L845,247 L845,233Z", x: 840, y: 242 },
    SC: { d: "M680,440 L680,480 L730,470 L740,445 L710,435Z", x: 708, y: 456 },
    SD: { d: "M380,200 L380,270 L475,275 L475,205Z", x: 428, y: 238 },
    TN: { d: "M600,415 L600,447 L700,440 L710,415 L660,410Z", x: 650, y: 428 },
    TX: { d: "M340,435 L330,530 L375,580 L430,590 L480,555 L510,510 L530,465 L520,435Z", x: 420, y: 510 },
    UT: { d: "M230,290 L230,410 L290,410 L290,290Z", x: 258, y: 350 },
    VT: { d: "M810,165 L810,210 L825,210 L828,165Z", x: 818, y: 187 },
    VA: { d: "M685,355 L685,400 L770,395 L785,370 L760,340 L720,350Z", x: 730, y: 372 },
    WA: { d: "M130,105 L130,175 L220,180 L230,140 L190,105Z", x: 170, y: 142 },
    WV: { d: "M700,320 L690,380 L720,395 L735,365 L720,330Z", x: 712, y: 355 },
    WI: { d: "M545,180 L545,265 L600,270 L605,230 L590,180Z", x: 570, y: 222 },
    WY: { d: "M270,210 L270,290 L380,290 L380,210Z", x: 325, y: 248 },
    DC: { d: "M762,330 L762,338 L770,335 L768,328Z", x: 765, y: 333 },
};

const STATE_NAMES: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
    NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
    ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
    RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
    TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
    WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington D.C.',
};

function getHeatColor(value: number, maxValue: number, palette: 'warm' | 'cool' = 'warm'): string {
    if (maxValue === 0) return 'var(--color-bg-raised)';
    const ratio = Math.min(value / maxValue, 1);
    if (palette === 'cool') {
        if (ratio === 0) return 'hsla(160, 40%, 50%, 0.2)';
        if (ratio < 0.25) return 'hsla(200, 50%, 60%, 0.4)';
        if (ratio < 0.5) return 'hsla(220, 55%, 55%, 0.55)';
        if (ratio < 0.75) return 'hsla(250, 55%, 50%, 0.65)';
        return 'hsla(270, 60%, 40%, 0.8)';
    }
    if (ratio === 0) return 'hsla(160, 40%, 50%, 0.3)';
    if (ratio < 0.25) return 'hsla(45, 70%, 55%, 0.5)';
    if (ratio < 0.5) return 'hsla(30, 75%, 50%, 0.6)';
    if (ratio < 0.75) return 'hsla(15, 80%, 48%, 0.7)';
    return 'hsla(0, 75%, 45%, 0.8)';
}

interface USMapProps {
    stats: MillWatchStateStats[];
    policies: StatePolicy[];
    labStats: ResearchFacilityStateStats[];
}

export function USMap({ stats, policies, labStats }: USMapProps) {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [layer, setLayer] = useState<DataLayer>('breeding');

    const statsMap = new Map(stats.map(s => [s.state.toUpperCase(), s]));
    const policyMap = new Map(policies.map(p => [p.state.toUpperCase(), p]));
    const labMap = new Map(labStats.map(s => [s.state.toUpperCase(), s]));
    const maxViolations = Math.max(...stats.map(s => s.breederCritical), 1);
    const maxDealerViolations = Math.max(...stats.map(s => s.dealerCritical), 1);
    const maxLabAnimals = Math.max(...labStats.map(s => s.totalDogs + s.totalCats), 1);

    const totals = stats.reduce(
        (acc, s) => ({
            inspections: acc.inspections + s.totalInspections,
            critical: acc.critical + s.totalCritical,
            nonCritical: acc.nonCritical + s.totalNonCritical,
            animals: acc.animals + s.totalAnimals,
            facilities: acc.facilities + s.totalFacilities,
            breeders: acc.breeders + s.breederFacilities,
            dealers: acc.dealers + s.dealerFacilities,
        }),
        { inspections: 0, critical: 0, nonCritical: 0, animals: 0, facilities: 0, breeders: 0, dealers: 0 },
    );

    const labTotals = labStats.reduce(
        (acc, s) => ({
            facilities: acc.facilities + s.totalFacilities,
            dogs: acc.dogs + s.totalDogs,
            cats: acc.cats + s.totalCats,
            painD: acc.painD + s.totalPainD,
        }),
        { facilities: 0, dogs: 0, cats: 0, painD: 0 },
    );

    const activeState = selectedState || hoveredState;
    const activeStats = activeState ? statsMap.get(activeState) : null;
    const activeLabStats = activeState ? labMap.get(activeState) : null;
    const activePolicy = activeState ? policyMap.get(activeState) : null;

    return (
        <div className="us-map-container">
            {/* Data Layer Toggle */}
            <div className="us-map__toggle">
                <button
                    className={`us-map__toggle-btn ${layer === 'breeding' ? 'us-map__toggle-btn--active' : ''}`}
                    onClick={() => setLayer('breeding')}
                >
                    🐕 Breeders
                </button>
                <button
                    className={`us-map__toggle-btn ${layer === 'dealers' ? 'us-map__toggle-btn--active' : ''}`}
                    onClick={() => setLayer('dealers')}
                >
                    🏪 Pet Stores
                </button>
                <button
                    className={`us-map__toggle-btn ${layer === 'labs' ? 'us-map__toggle-btn--active' : ''}`}
                    onClick={() => setLayer('labs')}
                >
                    🔬 Research / Labs
                </button>
            </div>

            {/* National Summary */}
            <div className="us-map__summary">
                {layer === 'breeding' ? (
                    <>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value">{totals.breeders.toLocaleString()}</div>
                            <div className="us-map__stat-label">🐕 Breeders</div>
                        </div>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value">{totals.inspections.toLocaleString()}</div>
                            <div className="us-map__stat-label">Inspections</div>
                        </div>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value us-map__stat-value--critical">{stats.reduce((a, s) => a + s.breederCritical, 0).toLocaleString()}</div>
                            <div className="us-map__stat-label">Critical Violations</div>
                        </div>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value">{totals.animals.toLocaleString()}</div>
                            <div className="us-map__stat-label">Animals Inspected</div>
                        </div>
                    </>
                ) : layer === 'dealers' ? (
                    <>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value">{totals.dealers.toLocaleString()}</div>
                            <div className="us-map__stat-label">🏪 Pet Stores</div>
                        </div>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value us-map__stat-value--critical">{stats.reduce((a, s) => a + s.dealerCritical, 0).toLocaleString()}</div>
                            <div className="us-map__stat-label">Critical Violations</div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value">{labTotals.facilities.toLocaleString()}</div>
                            <div className="us-map__stat-label">🔬 Research Facilities</div>
                        </div>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value">{labTotals.dogs.toLocaleString()}</div>
                            <div className="us-map__stat-label">🐕 Dogs Used</div>
                        </div>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value">{labTotals.cats.toLocaleString()}</div>
                            <div className="us-map__stat-label">🐈 Cats Used</div>
                        </div>
                        <div className="us-map__stat">
                            <div className="us-map__stat-value us-map__stat-value--critical">{labTotals.painD.toLocaleString()}</div>
                            <div className="us-map__stat-label">Pain w/o Relief</div>
                        </div>
                    </>
                )}
            </div>

            <div className="us-map__layout">
                {/* Interactive Map */}
                <div className="us-map__map-wrap">
                    <svg
                        viewBox="90 90 800 530"
                        className="us-map__svg"
                        role="img"
                        aria-label={`Interactive map of US states colored by ${layer === 'breeding' ? 'inspection violations' : 'research animal usage'}`}
                    >
                        {Object.entries(STATE_PATHS).map(([code, { d }]) => {
                            const isActive = activeState === code;
                            let fillColor: string;
                            let ariaDesc: string;
                            if (layer === 'breeding') {
                                const violations = statsMap.get(code)?.breederCritical ?? 0;
                                fillColor = getHeatColor(violations, maxViolations, 'warm');
                                ariaDesc = `${violations} breeder critical violations`;
                            } else if (layer === 'dealers') {
                                const violations = statsMap.get(code)?.dealerCritical ?? 0;
                                fillColor = getHeatColor(violations, maxDealerViolations, 'warm');
                                ariaDesc = `${violations} pet store critical violations`;
                            } else {
                                const labSt = labMap.get(code);
                                const labCount = labSt ? labSt.totalDogs + labSt.totalCats : 0;
                                fillColor = getHeatColor(labCount, maxLabAnimals, 'cool');
                                ariaDesc = `${labCount} animals in research`;
                            }

                            return (
                                <path
                                    key={code}
                                    d={d}
                                    fill={fillColor}
                                    stroke={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                                    strokeWidth={isActive ? 2.5 : 0.8}
                                    style={{ cursor: 'pointer', transition: 'fill 0.2s, stroke-width 0.2s' }}
                                    onClick={() => setSelectedState(selectedState === code ? null : code)}
                                    onMouseEnter={() => setHoveredState(code)}
                                    onMouseLeave={() => setHoveredState(null)}
                                    role="button"
                                    aria-label={`${STATE_NAMES[code] || code}: ${ariaDesc}`}
                                />
                            );
                        })}
                        {/* State labels */}
                        {Object.entries(STATE_PATHS).map(([code, { x, y }]) => (
                            <text
                                key={`label-${code}`}
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="9"
                                fontWeight="700"
                                fill="var(--color-text)"
                                pointerEvents="none"
                                style={{ opacity: 0.7 }}
                            >
                                {code}
                            </text>
                        ))}
                    </svg>

                    {/* Legend */}
                    <div className="us-map__legend">
                        <span className="us-map__legend-label">Fewer</span>
                        <div className="us-map__legend-bar">
                            {layer === 'breeding' ? (
                                <>
                                    <div style={{ background: 'hsla(160, 40%, 50%, 0.3)' }} />
                                    <div style={{ background: 'hsla(45, 70%, 55%, 0.5)' }} />
                                    <div style={{ background: 'hsla(30, 75%, 50%, 0.6)' }} />
                                    <div style={{ background: 'hsla(15, 80%, 48%, 0.7)' }} />
                                    <div style={{ background: 'hsla(0, 75%, 45%, 0.8)' }} />
                                </>
                            ) : (
                                <>
                                    <div style={{ background: 'hsla(200, 50%, 60%, 0.4)' }} />
                                    <div style={{ background: 'hsla(220, 55%, 55%, 0.55)' }} />
                                    <div style={{ background: 'hsla(250, 55%, 50%, 0.65)' }} />
                                    <div style={{ background: 'hsla(270, 60%, 40%, 0.8)' }} />
                                </>
                            )}
                        </div>
                        <span className="us-map__legend-label">{layer === 'labs' ? 'More Animals' : 'More Violations'}</span>
                    </div>
                </div>

                {/* State Detail Panel */}
                <div className="us-map__panel">
                    {activeState ? (
                        <>
                            <h3 className="us-map__panel-title">
                                {STATE_NAMES[activeState] || activeState}
                            </h3>

                            {/* Breeding layer panel */}
                            {layer === 'breeding' && activeStats && (
                                <div className="us-map__panel-grid">
                                    <div className="us-map__panel-stat">
                                        <span className="us-map__panel-stat-value">{activeStats.breederFacilities}</span>
                                        <span className="us-map__panel-stat-label">Breeders</span>
                                    </div>
                                    <div className="us-map__panel-stat">
                                        <span className="us-map__panel-stat-value">{activeStats.totalInspections}</span>
                                        <span className="us-map__panel-stat-label">Inspections</span>
                                    </div>
                                    <div className="us-map__panel-stat us-map__panel-stat--critical">
                                        <span className="us-map__panel-stat-value">{activeStats.breederCritical}</span>
                                        <span className="us-map__panel-stat-label">Critical</span>
                                    </div>
                                    <div className="us-map__panel-stat">
                                        <span className="us-map__panel-stat-value">{activeStats.totalAnimals.toLocaleString()}</span>
                                        <span className="us-map__panel-stat-label">Animals</span>
                                    </div>
                                    <div className="us-map__panel-stat">
                                        <span className="us-map__panel-stat-value">
                                            {activeStats.breederFacilities > 0
                                                ? Math.round((activeStats.facilitiesWithViolations / activeStats.totalFacilities) * 100)
                                                : 0}%
                                        </span>
                                        <span className="us-map__panel-stat-label">With Violations</span>
                                    </div>
                                </div>
                            )}

                            {/* Dealers layer panel */}
                            {layer === 'dealers' && activeStats && (
                                <div className="us-map__panel-grid">
                                    <div className="us-map__panel-stat">
                                        <span className="us-map__panel-stat-value">{activeStats.dealerFacilities}</span>
                                        <span className="us-map__panel-stat-label">Pet Stores</span>
                                    </div>
                                    <div className="us-map__panel-stat us-map__panel-stat--critical">
                                        <span className="us-map__panel-stat-value">{activeStats.dealerCritical}</span>
                                        <span className="us-map__panel-stat-label">Critical</span>
                                    </div>
                                </div>
                            )}

                            {/* Labs layer panel */}
                            {layer === 'labs' && (
                                <>
                                    {activeLabStats ? (
                                        <div className="us-map__panel-grid">
                                            <div className="us-map__panel-stat">
                                                <span className="us-map__panel-stat-value">{activeLabStats.totalFacilities}</span>
                                                <span className="us-map__panel-stat-label">Lab Facilities</span>
                                            </div>
                                            <div className="us-map__panel-stat">
                                                <span className="us-map__panel-stat-value">{activeLabStats.totalDogs.toLocaleString()}</span>
                                                <span className="us-map__panel-stat-label">🐕 Dogs</span>
                                            </div>
                                            <div className="us-map__panel-stat">
                                                <span className="us-map__panel-stat-value">{activeLabStats.totalCats.toLocaleString()}</span>
                                                <span className="us-map__panel-stat-label">🐈 Cats</span>
                                            </div>
                                            <div className="us-map__panel-stat us-map__panel-stat--critical">
                                                <span className="us-map__panel-stat-value">{activeLabStats.totalPainD.toLocaleString()}</span>
                                                <span className="us-map__panel-stat-label">Pain w/o Relief</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                            No research facility data for this state.
                                        </p>
                                    )}

                                    {activePolicy?.beagleBill !== null && (
                                        <div className="us-map__panel-breakdown">
                                            <div className="us-map__panel-breakdown-row">
                                                <span>🐾 Beagle Bill</span>
                                                <span>{activePolicy?.beagleBill ? `✅ Enacted${activePolicy.beagleBillYear ? ` (${activePolicy.beagleBillYear})` : ''}` : '❌ None'}</span>
                                            </div>
                                            {activePolicy?.beagleBillDetails && (
                                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                                    {activePolicy.beagleBillDetails}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Shared: Welfare Policy */}
                            {activePolicy && (
                                <div className="us-map__panel-policy">
                                    <h4 className="us-map__panel-policy-title">📋 Welfare Policy</h4>
                                    {activePolicy.aldfRank && (
                                        <div className="us-map__panel-row">
                                            <span>ALDF Ranking</span>
                                            <span>#{activePolicy.aldfRank} / 50 ({activePolicy.aldfTier || 'N/A'})</span>
                                        </div>
                                    )}
                                    {activePolicy.holdingPeriodDays !== null && (
                                        <div className="us-map__panel-row">
                                            <span>Holding Period</span>
                                            <span>{activePolicy.holdingPeriodDays} days</span>
                                        </div>
                                    )}
                                    {activePolicy.mandatoryReporting !== null && (
                                        <div className="us-map__panel-row">
                                            <span>Mandatory Reporting</span>
                                            <span>{activePolicy.mandatoryReporting ? '✅ Yes' : '❌ No'}</span>
                                        </div>
                                    )}
                                    {activePolicy.vetCrueltyReporting !== null && (
                                        <div className="us-map__panel-row">
                                            <span>Vet Cruelty Reporting</span>
                                            <span>{activePolicy.vetCrueltyReporting ? '✅ Required' : '❌ Not Required'}</span>
                                        </div>
                                    )}
                                    {activePolicy.cosmeticsTestingBan !== null && (
                                        <div className="us-map__panel-row">
                                            <span>Cosmetics Testing Ban</span>
                                            <span>{activePolicy.cosmeticsTestingBan ? '✅ Banned' : '❌ Allowed'}</span>
                                        </div>
                                    )}
                                    {activePolicy.catDeclawingBan !== null && (
                                        <div className="us-map__panel-row">
                                            <span>Cat Declawing Ban</span>
                                            <span>{activePolicy.catDeclawingBan ? '✅ Banned' : '❌ Allowed'}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="us-map__panel-empty">
                            <div className="us-map__panel-empty-icon">🗺️</div>
                            <p>Click or hover on a state to see {layer === 'breeding' ? 'breeder data' : layer === 'dealers' ? 'pet store data' : 'research facility stats'} and welfare policies.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
