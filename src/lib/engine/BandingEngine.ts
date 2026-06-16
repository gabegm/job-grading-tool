import type { MarketComplexity, EnterpriseSize } from '../types';

/**
 * Banding Decision Tree
 *
 * Maps a 2×2 matrix (complexity × size) to a career band ID.
 * This is the core's analytical approach — it removes
 * subjectivity from band assignment.
 *
 * Decision matrix:
 *                    | Small Enterprise  | Large Enterprise  |
 * -------------------+-------------------+-------------------+
 * Homogeneous Mkt/Prod | Band 3 (Operational) | Band 2 (Middle Mgmt) |
 * Complex Mkt/Prod     | Band 2 (Middle Mgmt) | Band 1 (Executive)   |
 *
 * @param complexity — 'homogeneous' or 'complex' (per-role)
 * @param size — 'small' or 'large' (per-role or inherited from company)
 * @param defaultBands — the company's career bands, ordered by seniority
 * @returns the recommended band ID (e.g., 'band1', 'band2', 'band3')
 */
export function determineBand(
  complexity: MarketComplexity,
  size: EnterpriseSize,
  defaultBands: { id: string; label: string; range: string }[],
): string {
  const bandMap: Record<string, string> = {
    'homogeneous-small': defaultBands[2]?.id || 'band3',
    'homogeneous-large': defaultBands[1]?.id || 'band2',
    'complex-small': defaultBands[1]?.id || 'band2',
    'complex-large': defaultBands[0]?.id || 'band1',
  };
  return bandMap[`${complexity}-${size}`];
}

/**
 * Derives enterprise size from company headcount.
 * Threshold: 2,500 employees.
 */
export function deriveEnterpriseSize(
  globalHeadcount: string,
): EnterpriseSize {
  const thresholds: Record<string, EnterpriseSize> = {
    under100: 'small',
    '100to500': 'small',
    '501to2500': 'small',
    '2501to10000': 'large',
    over10000: 'large',
  };
  return thresholds[globalHeadcount] || 'small';
}

/**
 * Derives market complexity from corporate structure.
 * Single business = homogeneous; multi-business/holding = complex.
 */
export function deriveMarketComplexity(
  corporateStructure: string,
): MarketComplexity {
  const map: Record<string, MarketComplexity> = {
    singleBusiness: 'homogeneous',
    multiBusiness: 'complex',
    holdingCompany: 'complex',
  };
  return map[corporateStructure] || 'homogeneous';
}

/**
 * Auto-assigns a band for a role based on its complexity and size.
 * If the role already has a manually-assigned band, returns null.
 */
export function autoAssignBand(
  complexity: MarketComplexity | undefined,
  size: EnterpriseSize | undefined,
  defaultBands: { id: string; label: string; range: string }[],
  bandAssignedManually: boolean | undefined,
): string | null {
  if (bandAssignedManually) return null;
  if (!complexity || !size) return null;
  return determineBand(complexity, size, defaultBands);
}
