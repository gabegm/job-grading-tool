import { describe, it, expect } from 'vitest';
import { calculateCeiling, scoreRole, gradeToLabel } from '../src/lib/engine/ScoringEngine';
import type { Company, AnnualRevenue, GlobalHeadcount, GeographicFootprint, CorporateStructure } from '../../src/lib/types';

// ─── Helper: build a minimal company object ────────────────────────

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    name: 'Test Corp',
    annualRevenue: 'under10M' as AnnualRevenue,
    globalHeadcount: 'under100' as GlobalHeadcount,
    geographicFootprint: 'singleCountry' as GeographicFootprint,
    corporateStructure: 'singleBusiness' as CorporateStructure,
    ...overrides,
  };
}

// ─── calculateCeiling tests ────────────────────────────────────────

describe('calculateCeiling', () => {
  it('returns grade 1 for minimum company', () => {
    const result = calculateCeiling(makeCompany({
      annualRevenue: 'under10M',
      globalHeadcount: 'under100',
      geographicFootprint: 'singleCountry',
      corporateStructure: 'singleBusiness',
    }));
    expect(result.grade).toBeGreaterThanOrEqual(1);
    expect(result.grade).toBeLessThanOrEqual(25);
  });

  it('returns highest grade for maximum company', () => {
    const result = calculateCeiling(makeCompany({
      annualRevenue: 'over1B',
      globalHeadcount: 'over10000',
      geographicFootprint: 'global',
      corporateStructure: 'holdingCompany',
    }));
    expect(result.grade).toBeGreaterThanOrEqual(18);
    expect(result.grade).toBeLessThanOrEqual(25);
  });

  it('returns a mid-range grade for mid-size company', () => {
    const result = calculateCeiling(makeCompany({
      annualRevenue: '50to250M',
      globalHeadcount: '501to2500',
      geographicFootprint: 'regional',
      corporateStructure: 'multiBusiness',
    }));
    expect(result.grade).toBeGreaterThanOrEqual(8);
    expect(result.grade).toBeLessThanOrEqual(15);
  });

  it('always returns a label', () => {
    const result = calculateCeiling(makeCompany());
    expect(result.gradeLabel).toBeTruthy();
    expect(typeof result.gradeLabel).toBe('string');
  });

  it('grade labels are descriptive', () => {
    const low = calculateCeiling(makeCompany({
      annualRevenue: 'under10M',
      globalHeadcount: 'under100',
      geographicFootprint: 'singleCountry',
      corporateStructure: 'singleBusiness',
    }));
    const high = calculateCeiling(makeCompany({
      annualRevenue: 'over1B',
      globalHeadcount: 'over10000',
      geographicFootprint: 'global',
      corporateStructure: 'holdingCompany',
    }));
    // Low ceiling should not be CEO-level
    expect(low.gradeLabel).not.toContain('Chief Executive');
    // High ceiling should be CEO-level
    expect(high.gradeLabel).toContain('Chief Executive');
  });
});

// ─── gradeToLabel tests ────────────────────────────────────────────

describe('gradeToLabel', () => {
  it('maps known grades to labels', () => {
    expect(gradeToLabel(1)).toBe('Entry Level');
    expect(gradeToLabel(3)).toBe('Senior Individual Contributor');
    expect(gradeToLabel(6)).toBe('Manager');
    expect(gradeToLabel(8)).toBe('Director');
    expect(gradeToLabel(10)).toBe('Vice President');
    expect(gradeToLabel(18)).toBe('Corporate Officer');
    expect(gradeToLabel(25)).toBe('Chief Executive Officer');
  });

  it('returns "Custom Grade" for unknown grades', () => {
    expect(gradeToLabel(0)).toBe('Custom Grade');
    expect(gradeToLabel(26)).toBe('Custom Grade');
  });
});

// ─── scoreRole tests ───────────────────────────────────────────────

describe('scoreRole', () => {
  const companyCeiling = { grade: 18, gradeLabel: 'Corporate Officer' };

  it('scores an executive role correctly', () => {
    const result = scoreRole(
      companyCeiling,
      'band1', // Executive band
      {
        jobFunctionalKnowledge: 45,
        businessExpertise: 48,
        leadership: 47,
        problemSolving: 46,
        natureOfImpact: 48,
        areaOfImpact: 47,
        interpersonalSkills: 46,
      },
      { managesTeam: true, financialAuthority: 50 },
    );
    expect(result.grade).toBeGreaterThanOrEqual(14);
    expect(result.grade).toBeLessThanOrEqual(25);
    // 45+48+47+46+48+47+46 = 327
    expect(result.totalPoints).toBe(327);
  });

  it('scores a mid-management role correctly', () => {
    const result = scoreRole(
      companyCeiling,
      'band2', // Middle management band
      {
        jobFunctionalKnowledge: 25,
        businessExpertise: 30,
        leadership: 28,
        problemSolving: 26,
        natureOfImpact: 30,
        areaOfImpact: 28,
        interpersonalSkills: 26,
      },
      { managesTeam: true, financialAuthority: 25 },
    );
    expect(result.grade).toBeGreaterThanOrEqual(8);
    expect(result.grade).toBeLessThanOrEqual(14);
  });

  it('scores an operational role correctly', () => {
    const result = scoreRole(
      companyCeiling,
      'band3', // Operational band
      {
        jobFunctionalKnowledge: 15,
        businessExpertise: 18,
        leadership: 10,
        problemSolving: 20,
        natureOfImpact: 18,
        areaOfImpact: 15,
        interpersonalSkills: 12,
      },
      { managesTeam: true, financialAuthority: 25 }, // has management + some authority
    );
    expect(result.grade).toBeGreaterThanOrEqual(5);
    expect(result.grade).toBeLessThanOrEqual(13);
  });

  it('caps grade by company ceiling', () => {
    const tightCeiling = { grade: 8, gradeLabel: 'Director' };
    const result = scoreRole(
      tightCeiling,
      'band1',
      {
        jobFunctionalKnowledge: 50,
        businessExpertise: 50,
        leadership: 50,
        problemSolving: 50,
        natureOfImpact: 50,
        areaOfImpact: 50,
        interpersonalSkills: 50,
      },
      { managesTeam: true, financialAuthority: 50 },
    );
    // Even with max points, grade cannot exceed ceiling of 8
    expect(result.grade).toBeLessThanOrEqual(8);
  });

  it('applies hard gate: no management + no financial authority caps at Grade 4', () => {
    const result = scoreRole(
      companyCeiling,
      'band3',
      {
        jobFunctionalKnowledge: 50,
        businessExpertise: 50,
        leadership: 50,
        problemSolving: 50,
        natureOfImpact: 50,
        areaOfImpact: 50,
        interpersonalSkills: 50,
      },
      { managesTeam: false, financialAuthority: 0 },
    );
    // Hard gate caps at Grade 4 (Senior IC) regardless of points
    expect(result.grade).toBeLessThanOrEqual(4);
  });

  it('does not apply hard gate when either gate passes', () => {
    const result = scoreRole(
      companyCeiling,
      'band3',
      {
        jobFunctionalKnowledge: 50,
        businessExpertise: 50,
        leadership: 50,
        problemSolving: 50,
        natureOfImpact: 50,
        areaOfImpact: 50,
        interpersonalSkills: 50,
      },
      { managesTeam: true, financialAuthority: 0 }, // has management
    );
    // Hard gate should NOT apply — grade should be higher
    expect(result.grade).toBeGreaterThan(4);
  });

  it('returns a label for the scored grade', () => {
    const result = scoreRole(
      companyCeiling,
      'band2',
      {
        jobFunctionalKnowledge: 25,
        businessExpertise: 30,
        leadership: 28,
        problemSolving: 26,
        natureOfImpact: 30,
        areaOfImpact: 28,
        interpersonalSkills: 26,
      },
      { managesTeam: true, financialAuthority: 25 },
    );
    expect(result.label).toBeTruthy();
    expect(typeof result.label).toBe('string');
  });

  it('totalPoints is the sum of all factor points', () => {
    const points = {
      jobFunctionalKnowledge: 10,
      businessExpertise: 20,
      leadership: 15,
      problemSolving: 25,
      natureOfImpact: 18,
      areaOfImpact: 22,
      interpersonalSkills: 12,
    };
    const expectedTotal = Object.values(points).reduce((a, b) => a + b, 0);
    const result = scoreRole(
      companyCeiling,
      'band3',
      points,
      { managesTeam: false, financialAuthority: 5 },
    );
    expect(result.totalPoints).toBe(expectedTotal);
  });
});
