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

/** Maps a grade number to track-specific labels. */
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
 */
export function scoreRole(
  companyCeiling: Ceiling,
  careerBand: string,
  factorAnswers: Record<string, number>,
  gateAnswers: { managesTeam: boolean; financialAuthority: number },
  track: RoleTrack = 'ic',
  factorWeightings?: FactorWeighting[],
  isCeilingRole: boolean = false,
): ScoringResult {
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
  };
}

// ─── Factor Weighting ───────────────────────────────────────────────

/**
 * Applies track-specific weights to individual factor scores.
 * This is the core of Google's Point-Factor approach:
 * the same raw score maps to different weighted scores
 * depending on whether the role is IC or Manager.
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

  // Scale back to the 0-350 range so band multipliers still work
  // This preserves the original point range while reflecting track priorities
  if (totalRaw > 0) {
    const scale = rawPoints / totalRaw;
    return Math.round(weightedSum * scale);
  }

  return 0;
}

// ─── Band-Specific Scoring ───────────────────────────────────────────

/**
 * Same raw score maps to different grades depending on career band AND track.
 * Executive roles are expected to score higher across all factors.
 * IC and Manager tracks within the same band have different grade mappings,
 * enabling parallel ladders (e.g., Staff IC ≈ Manager, Principal IC ≈ Director).
 */
function applyBandMultiplier(rawPoints: number, band: string, track: RoleTrack): number {
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
 * Replaces the hard gate with a softer cap.
 * For ICs with no management AND no financial authority,
 * the grade is gently reduced (by 1 level) rather than abruptly truncated.
 * This allows high-scoring ICs to reach senior grades
 * through expertise and impact, not managerial authority.
 * Note: With track-aware band multipliers, this is now a minor adjustment.
 */
function applySoftGate(grade: number, gateAnswers: { managesTeam: boolean; financialAuthority: number }, track: RoleTrack): number {
  const noManagement = !gateAnswers.managesTeam;
  const noFinancialAuthority = gateAnswers.financialAuthority <= 5;

  if (track === 'ic' && noManagement && noFinancialAuthority) {
    // Soft cap: reduce grade by 1 level instead of hard-capping at 4
    // This allows a world-class IC to reach Staff/Principal grades
    // while still reflecting that they lack organizational authority
    const softCapped = Math.max(grade - 1, 4);
    return Math.min(grade, softCapped);
  }

  return grade;
}
