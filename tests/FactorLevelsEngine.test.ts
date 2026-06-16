import { describe, it, expect } from 'vitest';
import { validateFactorLevel, getFactorLevel, getRoleFactorLevels } from '../src/lib/engine/FactorLevelsEngine';
import { DEFAULT_FACTOR_LEVELS } from '../src/lib/constants/factorLevels';

describe('validateFactorLevel', () => {
  it('returns valid with level FK1 for band1, 45 points', () => {
    const result = validateFactorLevel('FK1', 45, 'band1', 'both', DEFAULT_FACTOR_LEVELS);
    expect(result.valid).toBe(true);
    expect(result.level).toBe('FK1');
  });

  it('returns valid with level FK2 for band1, 30 points', () => {
    const result = validateFactorLevel('FK1', 30, 'band1', 'both', DEFAULT_FACTOR_LEVELS);
    expect(result.valid).toBe(true);
    expect(result.level).toBe('FK2');
  });

  it('returns valid with level FK3 for band1, 20 points', () => {
    const result = validateFactorLevel('FK1', 20, 'band1', 'both', DEFAULT_FACTOR_LEVELS);
    expect(result.valid).toBe(true);
    expect(result.level).toBe('FK3');
  });

  it('returns warning for points outside range (0 points)', () => {
    const result = validateFactorLevel('FK1', 0, 'band1', 'both', DEFAULT_FACTOR_LEVELS);
    expect(result.valid).toBe(false);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain('outside the expected range');
  });

  it('returns warning for points above max (55 points)', () => {
    const result = validateFactorLevel('FK1', 55, 'band1', 'both', DEFAULT_FACTOR_LEVELS);
    expect(result.valid).toBe(false);
    expect(result.warning).toBeDefined();
  });

  it('returns warning when no levels match the band', () => {
    const result = validateFactorLevel('FK1', 30, 'band99', 'both', DEFAULT_FACTOR_LEVELS);
    expect(result.valid).toBe(false);
    expect(result.warning).toContain('No factor levels defined');
  });

  it('filters by track: LS levels only apply to manager', () => {
    const result = validateFactorLevel('LS1', 45, 'band1', 'ic', DEFAULT_FACTOR_LEVELS);
    // LS levels are manager-only, so no match for IC
    expect(result.valid).toBe(false);
  });

  it('matches LS levels for manager track', () => {
    const result = validateFactorLevel('LS1', 45, 'band1', 'manager', DEFAULT_FACTOR_LEVELS);
    expect(result.valid).toBe(true);
    expect(result.level).toBe('LS1');
  });
});

describe('getFactorLevel', () => {
  it('returns level and description for matching points', () => {
    const result = getFactorLevel('FK1', 45, 'band1', 'both', DEFAULT_FACTOR_LEVELS);
    expect(result.level).toBe('FK1');
    expect(result.description).toContain('multiple disciplines');
  });

  it('returns empty object when no match', () => {
    const result = getFactorLevel('FK1', 0, 'band1', 'both', DEFAULT_FACTOR_LEVELS);
    expect(result).toEqual({});
  });
});

describe('getRoleFactorLevels', () => {
  it('returns levels for all factors', () => {
    const factorPoints = { FK1: 45, BE1: 30, LS1: 40, PS1: 25, NI1: 50, AI1: 20, IS1: 35 };
    const result = getRoleFactorLevels('band1', 'manager', factorPoints, DEFAULT_FACTOR_LEVELS);
    expect(result).toHaveLength(7);
    expect(result[0].factorId).toBe('FK1');
    expect(result[0].level).toBe('FK1');
    expect(result[0].valid).toBe(true);
  });

  it('marks out-of-range points as invalid', () => {
    const factorPoints = { FK1: 0, BE1: 50 };
    const result = getRoleFactorLevels('band1', 'both', factorPoints, DEFAULT_FACTOR_LEVELS);
    expect(result[0].valid).toBe(false);
    expect(result[1].valid).toBe(true);
  });
});
