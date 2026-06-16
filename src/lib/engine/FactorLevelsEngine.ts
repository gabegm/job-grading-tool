import type { FactorLevel, RoleTrack } from '../types';

/**
 * Maps question IDs (from the questionnaire) to factor level prefixes.
 * This bridges the gap between questionnaire question IDs and factor level IDs.
 */
const QUESTION_TO_FACTOR_PREFIX: Record<string, string> = {
  jobFunctionalKnowledge: 'FK',
  businessExpertise: 'BE',
  leadership: 'LS',
  problemSolving: 'PS',
  natureOfImpact: 'NI',
  areaOfImpact: 'AI',
  interpersonalSkills: 'IS',
};

/**
 * Validates that a factor score falls within the expected range
 * for the role's band and track.
 *
 * Returns a warning if the score is outside the expected range,
 * which may indicate a misclassified role (wrong band or wrong track).
 */
export function validateFactorLevel(
  factorId: string,
  points: number,
  bandId: string,
  track: RoleTrack,
  factorLevels: FactorLevel[],
): { valid: boolean; level?: string; warning?: string } {
  // Extract the factor prefix (FK, BE, LS, PS, NI, AI, IS) from the factorId
  const factorPrefix = getFactorPrefix(factorId);
  const levels = factorLevels
    .filter(fl => fl.bandId === bandId && (fl.track === track || fl.track === 'both') && fl.id.startsWith(factorPrefix))
    .sort((a, b) => b.minPoints - a.minPoints);

  if (levels.length === 0) {
    return { valid: false, warning: `No factor levels defined for factor "${factorId}" in band "${bandId}" and track "${track}".` };
  }

  const matchingLevel = levels.find(fl => points >= fl.minPoints && points <= fl.maxPoints);

  if (matchingLevel) {
    return { valid: true, level: matchingLevel.id };
  }

  // Points outside any defined level range
  const highestLevel = levels[0];
  const lowestLevel = levels[levels.length - 1];
  return {
    valid: false,
    warning: `Score of ${points} is outside the expected range (${lowestLevel.minPoints}–${highestLevel.maxPoints}) for ${factorId} in ${bandId} ${track}. This may indicate a misclassified role.`,
  };
}

/**
 * Gets the factor prefix (FK, BE, LS, etc.) from a factor ID or question ID.
 */
function getFactorPrefix(factorId: string): string {
  // If it's already a factor level ID (FK1, BE2, etc.), extract the prefix
  if (factorId.match(/^(FK|BE|LS|PS|NI|AI|IS)/)) {
    return factorId.slice(0, 2);
  }
  // Otherwise, look up the mapping from question ID
  return QUESTION_TO_FACTOR_PREFIX[factorId] || factorId.slice(0, 2);
}

/**
 * Gets the factor level for a specific factor and points,
 * for a given band and track.
 */
export function getFactorLevel(
  factorId: string,
  points: number,
  bandId: string,
  track: RoleTrack,
  factorLevels: FactorLevel[],
): { level?: string; description?: string } {
  const factorPrefix = getFactorPrefix(factorId);
  const levels = factorLevels
    .filter(fl => fl.bandId === bandId && (fl.track === track || fl.track === 'both') && fl.id.startsWith(factorPrefix));

  const matchingLevel = levels.find(fl => points >= fl.minPoints && points <= fl.maxPoints);
  if (matchingLevel) {
    return { level: matchingLevel.id, description: matchingLevel.description };
  }
  return {};
}

/**
 * Gets all factor levels for a role, sorted by factor.
 */
export function getRoleFactorLevels(
  bandId: string,
  track: RoleTrack,
  factorPoints: Record<string, number>,
  factorLevels: FactorLevel[],
): Array<{ factorId: string; points: number; level?: string; description?: string; valid: boolean }> {
  const factorIds = Object.keys(factorPoints);
  return factorIds.map(factorId => {
    const points = factorPoints[factorId];
    const factorPrefix = getFactorPrefix(factorId);
    const levels = factorLevels
      .filter(fl => fl.bandId === bandId && (fl.track === track || fl.track === 'both') && fl.id.startsWith(factorPrefix));
    const matchingLevel = levels.find(fl => points >= fl.minPoints && points <= fl.maxPoints);
    return {
      factorId,
      points,
      level: matchingLevel?.id,
      description: matchingLevel?.description,
      valid: !!matchingLevel,
    };
  });
}
