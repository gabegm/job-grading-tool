import type {
  Company,
  Ceiling,
  ScoringResult,
  AnnualRevenue,
  GlobalHeadcount,
  GeographicFootprint,
  CorporateStructure,
} from '../types';

// ─── Company Ceiling Calculation ─────────────────────────────────────

/**
 * Calculates the company ceiling grade from 4 inputs.
 * Each input maps to a score; the combined score determines the ceiling.
 */
export function calculateCeiling(company: Company): Ceiling {
  const revenueScore = revenueToScore(company.annualRevenue);
  const headcountScore = headcountToScore(company.globalHeadcount);
  const footprintScore = footprintToScore(company.geographicFootprint);
  const structureScore = structureToScore(company.corporateStructure);

  const totalScore = revenueScore + headcountScore + footprintScore + structureScore;

  // Score ranges from 4 (minimum) to 20 (maximum)
  // Maps to grades 1–25
  const grade = Math.max(1, Math.min(25, Math.round((totalScore - 4) * 1.56) + 1));

  return {
    grade,
    gradeLabel: gradeToLabel(grade),
  };
}

// ─── Score Mappings ──────────────────────────────────────────────────

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
    regional: 3,
    global: 5,
  };
  return map[footprint];
}

function structureToScore(structure: CorporateStructure): number {
  const map: Record<CorporateStructure, number> = {
    singleBusiness: 1,
    multiBusiness: 3,
    holdingCompany: 5,
  };
  return map[structure];
}

// ─── Grade Labels ────────────────────────────────────────────────────

/** Maps a grade number to a human-readable label. */
export function gradeToLabel(grade: number): string {
  const labels: Record<number, string> = {
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

  return labels[grade] || 'Custom Grade';
}

// ─── Role Scoring ────────────────────────────────────────────────────

/**
 * Scores a role based on career band, factor answers, and gate answers.
 * Returns the final grade capped by the company ceiling.
 */
export function scoreRole(
  companyCeiling: Ceiling,
  careerBand: string,
  factorAnswers: Record<string, number>,
  gateAnswers: { managesTeam: boolean; financialAuthority: number },
): ScoringResult {
  // Step 1: Calculate raw points from 7 factors (0–50 each, 350 max)
  const totalPoints = Object.values(factorAnswers).reduce((sum, pts) => sum + pts, 0);

  // Step 2: Apply band-specific multiplier
  const adjustedPoints = applyBandMultiplier(totalPoints, careerBand);

  // Step 3: Evaluate gates
  const cappedGrade = applyHardGate(adjustedPoints, gateAnswers);

  // Step 4: Cap by company ceiling
  const finalGrade = Math.min(cappedGrade, companyCeiling.grade);

  return {
    grade: finalGrade,
    label: gradeToLabel(finalGrade),
    totalPoints,
  };
}

// ─── Band-Specific Scoring ───────────────────────────────────────────

/**
 * Same raw score maps to different grades depending on career band.
 * Executive roles are expected to score higher across all factors.
 */
function applyBandMultiplier(rawPoints: number, band: string): number {
  // Band 1 (Executive): 0–100 → G1–5, 101–200 → G6–12, 201–350 → G13–25
  // Band 2 (Mid Mgmt):  0–100 → G5–9, 101–200 → G10–14, 201–350 → G15–20
  // Band 3 (Operational): 0–100 → G9–13, 101–200 → G13–17, 201–350 → G17–22

  const bandIndex = parseInt(band.replace('band', ''), 10) || 3;

  if (bandIndex <= 2) {
    // Executive bands (1–2)
    if (rawPoints <= 100) {
      return Math.round((rawPoints / 100) * 5);
    } else if (rawPoints <= 200) {
      return Math.round(5 + ((rawPoints - 100) / 100) * 7);
    } else {
      return Math.round(12 + ((rawPoints - 200) / 150) * 13);
    }
  } else if (bandIndex <= 4) {
    // Middle management bands (3–4)
    if (rawPoints <= 100) {
      return Math.round(5 + (rawPoints / 100) * 4);
    } else if (rawPoints <= 200) {
      return Math.round(9 + ((rawPoints - 100) / 100) * 5);
    } else {
      return Math.round(14 + ((rawPoints - 200) / 150) * 6);
    }
  } else {
    // Operational bands (5–6)
    if (rawPoints <= 100) {
      return Math.round(9 + (rawPoints / 100) * 4);
    } else if (rawPoints <= 200) {
      return Math.round(13 + ((rawPoints - 100) / 100) * 4);
    } else {
      return Math.round(17 + ((rawPoints - 200) / 150) * 5);
    }
  }
}

// ─── Hard Gate ───────────────────────────────────────────────────────

/**
 * If a role has no team management AND no financial authority,
 * cap the grade at Senior Individual Contributor (Grade 4) regardless of points.
 */
function applyHardGate(grade: number, gateAnswers: { managesTeam: boolean; financialAuthority: number }): number {
  const noManagement = !gateAnswers.managesTeam;
  const noFinancialAuthority = gateAnswers.financialAuthority <= 5;

  if (noManagement && noFinancialAuthority) {
    return Math.min(grade, 4); // Cap at Senior IC
  }

  return grade;
}
