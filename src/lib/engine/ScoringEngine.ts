import type {
  Company,
  Ceiling,
  ScoringResult,
  AnnualRevenue,
  GlobalHeadcount,
  GeographicFootprint,
  CorporateStructure,
  RoleTrack,
  FactorWeighting,
  FactorLevel,
} from '../types';
import { determineBand } from './BandingEngine';
import { validateFactorLevel } from './FactorLevelsEngine';

/**
 * Job Grading Engine — Point-Factor Method
 * ========================================
 *
 * This module implements a two-stage grading system inspired by
 * Google's Point-Factor job evaluation method:
 *
 *   Stage 1: Company Ceiling (calculateCeiling)
 *   ┌─────────────────────────────────────────────────┐
 *   │  Revenue  │  Headcount  │  Footprint  │  Structure │
 *   │   1–5     │    1–5      │    1–5      │    1–5     │
 *   └─────────────────────────────────────────────────┘
 *                Sum → Linear map → Grade 1–25
 *                This is the company's maximum grade (ceiling).
 *
 *   Stage 2: Role Scoring (scoreRole)
 *   ┌─────────────────────────────────────────────────┐
 *   │  7 Factors (0–50 pts each, 350 max)              │
 *   │  ↓                                              │
 *   │  Apply track-specific weights (IC vs Manager)    │
 *   │  ↓                                              │
 *   │  Apply band-specific multiplier (Band 1–6)       │
 *   │  ↓                                              │
 *   │  Apply soft gate (authority check)               │
 *   │  ↓                                              │
 *   │  Cap by company ceiling (CEO can reach ceiling)  │
 *   └─────────────────────────────────────────────────┘
 *
 * Key design decisions:
 *   - Dual tracks: IC and Manager use different weightings
 *     and grade labels, but converge at equivalent grades.
 *   - Career bands: Executive (1–2), Middle (3–4), Operational (5–6)
 *     each have different grade ranges and scoring curves.
 *   - Soft gates: prevent high grades without corresponding
 *     authority/impact, but allow borderline cases.
 *   - CEO reservation: the ceiling grade is reserved for the
 *     CEO; all other roles are capped at ceiling - 1.
 */

// ─── Company Ceiling Calculation ─────────────────────────────────────

/**
 * Calculates the company ceiling grade from 4 inputs.
 * Each input maps to a score (1–5); the combined score determines the ceiling.
 *
 * Algorithm:
 *   1. Map each of 4 company dimensions to a 1–5 score (see scoreMappers below).
 *   2. Sum them → totalScore ranges from 4 (tiny startup) to 20 (enterprise).
 *   3. Linearly map [4, 20] → [1, 25] using the formula:
 *        grade = (totalScore - 4) × (25 - 1) / (20 - 4) + 1
 *      which simplifies to (totalScore - 4) × 1.5 + 1.
 *      We use 1.56 (≈ 24/15.38) to give a slight upward bias so that
 *      mid-size companies land around grade 10–12 rather than 8–10,
 *      reflecting the intuition that a company with global footprint
 *      and multi-business structure is "bigger" than the sum of its parts.
 *   4. Clamp to [1, 25] and map to a label.
 *
 * The 4 dimensions are:
 *   - Annual revenue  (5 levels: under $10M → over $1B)
 *   - Global headcount (5 levels: under 100 → over 10,000)
 *   - Geographic footprint (3 levels: single country → global)
 *   - Corporate structure (3 levels: single business → holding company)
 */
export function calculateCeiling(company: Company): Ceiling {
  const revenueScore = revenueToScore(company.annualRevenue);
  const headcountScore = headcountToScore(company.globalHeadcount);
  const footprintScore = footprintToScore(company.geographicFootprint);
  const structureScore = structureToScore(company.corporateStructure);

  const totalScore = revenueScore + headcountScore + footprintScore + structureScore;

  // Score ranges from 4 (minimum) to 20 (maximum)
  // Maps to grades 1–25 via linear interpolation with slight upward bias
  const grade = Math.max(1, Math.min(25, Math.round((totalScore - 4) * 1.56) + 1));

  return {
    grade,
    gradeLabel: gradeToLabel(grade),
  };
}

// ─── Score Mappings ──────────────────────────────────────────────────
// Each dimension maps to a 1–5 score. The 3-level dimensions
// (footprint, structure) skip 2 and 4 to create larger jumps between
// tiers, reflecting that going from "single country" to "global" is
// a bigger organizational leap than a linear scale would suggest.

function revenueToScore(revenue: AnnualRevenue): number {
  const map: Record<AnnualRevenue, number> = {
    under10M: 1,
    '10to50M': 2,
    '50to250M': 3,
    '250to1B': 4,
    over1B: 5,
  };
  return map[revenue];
}

function headcountToScore(headcount: GlobalHeadcount): number {
  const map: Record<GlobalHeadcount, number> = {
    under100: 1,
    '100to500': 2,
    '501to2500': 3,
    '2501to10000': 4,
    over10000: 5,
  };
  return map[headcount];
}

function footprintToScore(footprint: GeographicFootprint): number {
  const map: Record<GeographicFootprint, number> = {
    singleCountry: 1,
    regional: 3,   // skip 2: regional is a bigger step than linear
    global: 5,     // skip 4: global is a big step beyond regional
  };
  return map[footprint];
}

function structureToScore(structure: CorporateStructure): number {
  const map: Record<CorporateStructure, number> = {
    singleBusiness: 1,
    multiBusiness: 3,  // skip 2: multi-business is a bigger step
    holdingCompany: 5, // skip 4: holding company is the max complexity
  };
  return map[structure];
}

// ─── Default Factor Weightings ─────────────────────────────────────

/**
 * Default per-factor weights for IC vs Manager tracks.
 * These reflect Google's Point-Factor approach:
 * - IC track: weights "Job Functional Knowledge" and "Problem Solving" heavily
 * - Manager track: weights "Leadership" and "Business Expertise" heavily
 */
const DEFAULT_FACTOR_WEIGHTINGS: FactorWeighting[] = [
  { factorId: 'jobFunctionalKnowledge', icWeight: 1.4, managerWeight: 0.8 },
  { factorId: 'businessExpertise', icWeight: 0.8, managerWeight: 1.4 },
  { factorId: 'leadership', icWeight: 0.5, managerWeight: 1.6 },
  { factorId: 'problemSolving', icWeight: 1.3, managerWeight: 1.0 },
  { factorId: 'natureOfImpact', icWeight: 1.0, managerWeight: 1.2 },
  { factorId: 'areaOfImpact', icWeight: 1.0, managerWeight: 1.3 },
  { factorId: 'interpersonalSkills', icWeight: 0.8, managerWeight: 1.3 },
];

// ─── Track-Aware Grade Labels ──────────────────────────────────────

/**
 * Maps a grade number (1–25) to track-specific labels.
 *
 * Grade bands and their meaning:
 *   1  – Entry Level: new graduates, no experience required
 *   2  – Associate: early-career, some experience
 *   3–4 – Senior IC / Senior: experienced individual contributor or
 *         frontline manager (Team Lead)
 *   5–6 – Staff IC / Manager: senior IC or people manager
 *   7  – Senior Manager / Senior IC: experienced manager or senior IC
 *   8  – Director / Principal IC: department-level leadership or
 *         deep technical authority
 *   9  – Senior Director / Distinguished IC: multi-team leadership or
 *         recognized domain expert
 *   10 – VP / Senior IC: division-level leadership
 *   11 – SVP / Fellow: executive leadership or recognized industry expert
 *   12 – EVP / Senior Fellow: C-suite adjacent or top-tier expert
 *   13–15 – Senior Executive / Senior Fellow: C-suite (CTO, CFO, etc.)
 *   16–18 – Corporate Officer: board-level roles (COO, General Counsel)
 *   19–25 – Chief Executive Officer: the company ceiling
 *
 * The IC track uses titles like "Staff IC", "Principal IC", "Fellow".
 * The Manager track uses titles like "Manager", "Director", "VP".
 * Both tracks converge at equivalent grades (e.g., Staff IC ≈ Manager,
 * Principal IC ≈ Director) enabling fair comparison across tracks.
 *
 * Grades 13–15 are shared between tracks (Senior Executive / Senior Fellow)
 * because at this level the distinction between management and IC blurs.
 */
export function gradeToLabel(grade: number, track?: RoleTrack): string {
  const icLabels: Record<number, string> = {
    1: 'Entry Level',
    2: 'Associate',
    3: 'Senior Individual Contributor',
    4: 'Senior Individual Contributor',
    5: 'Staff Individual Contributor',
    6: 'Staff Individual Contributor',
    7: 'Principal Individual Contributor',
    8: 'Principal Individual Contributor',
    9: 'Distinguished Individual Contributor',
    10: 'Distinguished Individual Contributor',
    11: 'Fellow',
    12: 'Fellow',
    13: 'Senior Fellow',
    14: 'Senior Fellow',
    15: 'Senior Fellow',
    16: 'Corporate Officer',
    17: 'Corporate Officer',
    18: 'Corporate Officer',
    19: 'Chief Executive Officer',
    20: 'Chief Executive Officer',
    21: 'Chief Executive Officer',
    22: 'Chief Executive Officer',
    23: 'Chief Executive Officer',
    24: 'Chief Executive Officer',
    25: 'Chief Executive Officer',
  };

  const managerLabels: Record<number, string> = {
    1: 'Entry Level',
    2: 'Associate',
    3: 'Senior Individual Contributor',
    4: 'Senior Individual Contributor',
    5: 'Team Lead',
    6: 'Manager',
    7: 'Senior Manager',
    8: 'Director',
    9: 'Senior Director',
    10: 'Vice President',
    11: 'Senior Vice President',
    12: 'Executive Vice President',
    13: 'Senior Executive',
    14: 'Senior Executive',
    15: 'Senior Executive',
    16: 'Corporate Officer',
    17: 'Corporate Officer',
    18: 'Corporate Officer',
    19: 'Chief Executive Officer',
    20: 'Chief Executive Officer',
    21: 'Chief Executive Officer',
    22: 'Chief Executive Officer',
    23: 'Chief Executive Officer',
    24: 'Chief Executive Officer',
    25: 'Chief Executive Officer',
  };

  const labels = track === 'manager' ? managerLabels : icLabels;
  return labels[grade] || 'Custom Grade';
}

// ─── Role Scoring ────────────────────────────────────────────────────

/**
 * Scores a role based on career band, track (IC/Manager), factor answers,
 * factor weightings, and gate answers.
 * Returns the final grade capped by the company ceiling.
 * @param isCeilingRole — if true (e.g., CEO), allows reaching the ceiling grade.
 *                        if false, caps at ceiling - 1 to reserve the ceiling for the CEO.
 * @param marketComplexity — optional banding decision tree input
 * @param enterpriseSize — optional banding decision tree input
 * @param defaultBands — optional career bands for banding decision tree
 * @param factorLevels — optional band-specific factor levels for validation
 */
export function scoreRole(
  companyCeiling: Ceiling,
  careerBand: string,
  factorAnswers: Record<string, number>,
  gateAnswers: { managesTeam: boolean; decisionAutonomy: boolean; financialAuthority: number },
  track: RoleTrack = 'ic',
  factorWeightings?: FactorWeighting[],
  isCeilingRole: boolean = false,
  marketComplexity?: 'homogeneous' | 'complex',
  enterpriseSize?: 'small' | 'large',
  defaultBands?: { id: string; label: string; range: string }[],
  factorLevels?: FactorLevel[],
): ScoringResult & { recommendedBand?: string; factorLevelWarnings?: string[] } {
  // NEW: Auto-assign band from decision tree if not manually assigned
  let recommendedBand: string | undefined;
  if (marketComplexity && enterpriseSize && defaultBands) {
    recommendedBand = determineBand(marketComplexity, enterpriseSize, defaultBands);
    // Use recommended band if no explicit band was provided
    if (!careerBand || careerBand === '') {
      careerBand = recommendedBand;
    }
  }

  // NEW: Validate each factor score against band-specific levels
  const factorLevelWarnings: string[] = [];
  if (factorLevels && careerBand) {
    const factorIds = Object.keys(factorAnswers);
    for (const factorId of factorIds) {
      const points = factorAnswers[factorId];
      const validation = validateFactorLevel(factorId, points, careerBand, track, factorLevels);
      if (!validation.valid && validation.warning) {
        factorLevelWarnings.push(validation.warning);
      }
    }
  }

  // Step 1: Calculate raw points from 7 factors (0–50 each, 350 max)
  const rawPoints = Object.values(factorAnswers).reduce((sum, pts) => sum + pts, 0);

  // Step 2: Apply track-specific factor weightings
  const weightedPoints = applyFactorWeightings(rawPoints, factorAnswers, track, factorWeightings);

  // Step 3: Apply band-specific multiplier (now track-aware)
  const adjustedGrade = applyBandMultiplier(weightedPoints, careerBand, track);

  // Step 4: Apply soft gate (not hard gate)
  const cappedGrade = applySoftGate(adjustedGrade, gateAnswers, track);

  // Step 5: Cap by company ceiling (CEO can reach ceiling; others capped at ceiling-1)
  const maxGrade = isCeilingRole ? companyCeiling.grade : Math.max(1, companyCeiling.grade - 1);
  const finalGrade = Math.min(cappedGrade, maxGrade);

  return {
    grade: finalGrade,
    label: gradeToLabel(finalGrade, track),
    totalPoints: rawPoints,
    recommendedBand,
    factorLevelWarnings: factorLevelWarnings.length > 0 ? factorLevelWarnings : undefined,
  };
}

// ─── Factor Weighting ───────────────────────────────────────────────

/**
 * Applies track-specific weights to individual factor scores.
 * This is the core of Google's Point-Factor approach:
 * the same raw score maps to different weighted scores
 * depending on whether the role is IC or Manager.
 *
 * Algorithm:
 *   1. For each of 7 factors, look up the track-specific weight
 *      (icWeight or managerWeight). If no custom weighting exists,
 *      use 1.0 (no adjustment).
 *   2. Multiply each factor's raw score (0–50) by its weight.
 *   3. Sum the weighted scores.
 *   4. **Normalize back to 0–350**: multiply by (rawPoints / totalRaw).
 *      This is critical — without normalization, a Manager role with
 *      high leadership weights could exceed 350 points, breaking the
 *      band multiplier tables. The normalization ensures the weighted
 *      score stays in the same range as the raw score, while still
 *      reflecting the track's priorities.
 *
 * Example: An IC scoring 45 on "Job Functional Knowledge" (weight 1.4)
 * gets 63 raw-weighted points. A Manager scoring the same gets 45
 * (weight 0.8). After normalization, both scores stay in 0–350,
 * but the IC's knowledge-heavy profile is rewarded relative to a
 * Manager's leadership-heavy profile.
 */
function applyFactorWeightings(
  rawPoints: number,
  factorAnswers: Record<string, number>,
  track: RoleTrack,
  factorWeightings?: FactorWeighting[],
): number {
  const weightings = factorWeightings || DEFAULT_FACTOR_WEIGHTINGS;

  let weightedSum = 0;
  let totalRaw = 0;

  for (const [factorId, rawScore] of Object.entries(factorAnswers)) {
    const weighting = weightings.find(w => w.factorId === factorId);
    const weight = weighting
      ? track === 'manager'
        ? weighting.managerWeight
        : weighting.icWeight
      : 1.0; // default: no weighting

    weightedSum += rawScore * weight;
    totalRaw += rawScore;
  }

  // Scale back to the 0-350 range so band multipliers still work.
  // This preserves the original point range while reflecting track priorities.
  // Without this normalization, weighted scores could exceed 350 (e.g., a
  // Manager with high leadership weights on all 7 factors: 7 × 50 × 1.6 = 560).
  if (totalRaw > 0) {
    const scale = rawPoints / totalRaw;
    return Math.round(weightedSum * scale);
  }

  return 0;
}

// ─── Band-Specific Scoring ───────────────────────────────────────────

/**
 * Converts weighted points (0–350) to a grade using band-specific
 * piecewise-linear mapping tables.
 *
 * The mapping is split into 3 segments (0–100, 101–200, 201–350)
 * with different slopes for each segment. This creates a curve where
 * higher-scoring roles get more grade "bang for their points" in the
 * middle range, reflecting that senior roles require disproportionately
 * more impact to move up a grade.
 *
 * Breakpoints (100, 200) were chosen to create three roughly equal
 * point bands. The slopes were tuned so that:
 *   - Low scorers (0–100) map to the lower end of the band's grade range
 *   - Mid scorers (101–200) map to the middle of the range
 *   - High scorers (201–350) map to the upper end
 *
 * Three band tiers with different grade ranges:
 *   Band 1–2 (Executive):  G5–25 — C-suite and board-level roles
 *   Band 3–4 (Middle mgmt): G5–18 — VPs, Directors, Senior Directors
 *   Band 5–6 (Operational): G5–22 — ICs (Staff/Principal/Distinguished)
 *                          and Managers (Team Lead through Senior Director)
 *
 * Within operational bands, IC and Manager tracks diverge:
 *   - IC track: lower grade range (Staff IC ≈ G5–18)
 *   - Manager track: higher grade range (Manager ≈ G9–22)
 * This enables parallel ladders where a high-scoring IC can reach
 * the same grade as a mid-level Manager (e.g., Staff IC ≈ Manager).
 */
function applyBandMultiplier(rawPoints: number, band: string, track: RoleTrack): number {
  const bandIndex = parseInt(band.replace('band', ''), 10) || 3;

  if (bandIndex <= 2) {
    // Executive bands (1–2): G5–25
    // Low (0–100):  G5  — entry-level executive
    // Mid (101–200): G5–12 — mid-level executive
    // High (201–350): G12–25 — senior executive / C-suite
    if (rawPoints <= 100) {
      return Math.round((rawPoints / 100) * 5);
    } else if (rawPoints <= 200) {
      return Math.round(5 + ((rawPoints - 100) / 100) * 7);
    } else {
      return Math.round(12 + ((rawPoints - 200) / 150) * 13);
    }
  } else if (bandIndex <= 4) {
    // Middle management bands (3–4): G5–18
    // Low (0–100):  G5–9  — entry-level management
    // Mid (101–200): G9–14 — mid-level management
    // High (201–350): G14–18 — senior management
    if (rawPoints <= 100) {
      return Math.round(5 + (rawPoints / 100) * 4);
    } else if (rawPoints <= 200) {
      return Math.round(9 + ((rawPoints - 100) / 100) * 5);
    } else {
      return Math.round(14 + ((rawPoints - 200) / 150) * 6);
    }
  } else {
    // Operational bands (5–6): G5–22
    // IC track: lower grade range (Staff/Principal/Distinguished)
    // Manager track: higher grade range (Manager/Senior Director)
    if (track === 'ic') {
      // IC: 0–100 → G5–8, 101–200 → G8–12, 201–350 → G12–18
      if (rawPoints <= 100) {
        return Math.round(5 + (rawPoints / 100) * 3);
      } else if (rawPoints <= 200) {
        return Math.round(8 + ((rawPoints - 100) / 100) * 4);
      } else {
        return Math.round(12 + ((rawPoints - 200) / 150) * 6);
      }
    } else {
      // Manager: 0–100 → G9–13, 101–200 → G13–17, 201–350 → G17–22
      if (rawPoints <= 100) {
        return Math.round(9 + (rawPoints / 100) * 4);
      } else if (rawPoints <= 200) {
        return Math.round(13 + ((rawPoints - 100) / 100) * 4);
      } else {
        return Math.round(17 + ((rawPoints - 200) / 150) * 5);
      }
    }
  }
}

// ─── Soft Gate ───────────────────────────────────────────────────────

/**
 * Applies a soft gate that prevents roles from reaching high grades
 * without the corresponding authority or impact.
 *
 * This replaces a hard gate (which would abruptly cap grades) with
 * a softer cap: if both gate criteria fail, the grade is reduced by
 * exactly 1 level (minimum grade 4). This is a "nudge" rather than
 * a hard stop, allowing borderline cases to still reach reasonable
 * grades.
 *
 * Track-specific gate criteria:
 *   IC track:  Decision Autonomy + Financial Authority
 *   Manager track: Team Management + Financial Authority
 *
 * Why track-specific? Because autonomy means different things
 * for ICs vs Managers. An IC needs decision-making authority
 * over their work; a Manager needs authority over a team.
 * Both need financial authority (budget ownership) at higher grades.
 *
 * The floor of grade 4 ensures that even if both gates fail,
 * a role can still reach at least "Senior IC / Senior" level,
 * which is the floor for any meaningful role in the system.
 */
function applySoftGate(
  grade: number,
  gateAnswers: { managesTeam: boolean; decisionAutonomy: boolean; financialAuthority: number },
  track: RoleTrack,
): number {
  const noFinancialAuthority = gateAnswers.financialAuthority <= 5;

  if (track === 'ic') {
    // For ICs: check decision autonomy + financial authority
    const noAutonomy = !gateAnswers.decisionAutonomy;
    if (noAutonomy && noFinancialAuthority) {
      // Soft cap: reduce grade by 1 level (minimum grade 4)
      const softCapped = Math.max(grade - 1, 4);
      return Math.min(grade, softCapped);
    }
  } else {
    // For Managers: check team management + financial authority
    const noManagement = !gateAnswers.managesTeam;
    if (noManagement && noFinancialAuthority) {
      // Soft cap: reduce grade by 1 level (minimum grade 4)
      const softCapped = Math.max(grade - 1, 4);
      return Math.min(grade, softCapped);
    }
  }

  return grade;
}
