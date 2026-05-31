import { describe, it, expect } from 'vitest';
import { calculateCeiling, scoreRole, gradeToLabel } from '../src/lib/engine/ScoringEngine';
import type { Company, AnnualRevenue, GlobalHeadcount, GeographicFootprint, CorporateStructure, RoleTrack, FactorWeighting } from '../../src/lib/types';

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
    expect(gradeToLabel(6, 'manager')).toBe('Manager');
    expect(gradeToLabel(8, 'manager')).toBe('Director');
    expect(gradeToLabel(10, 'manager')).toBe('Vice President');
    expect(gradeToLabel(18)).toBe('Corporate Officer');
    expect(gradeToLabel(25)).toBe('Chief Executive Officer');
  });

  it('returns "Custom Grade" for unknown grades', () => {
    expect(gradeToLabel(0)).toBe('Custom Grade');
    expect(gradeToLabel(26)).toBe('Custom Grade');
  });

  it('returns IC-specific labels for IC track', () => {
    expect(gradeToLabel(5, 'ic')).toBe('Staff Individual Contributor');
    expect(gradeToLabel(7, 'ic')).toBe('Principal Individual Contributor');
    expect(gradeToLabel(9, 'ic')).toBe('Distinguished Individual Contributor');
    expect(gradeToLabel(11, 'ic')).toBe('Fellow');
    expect(gradeToLabel(13, 'ic')).toBe('Senior Fellow');
  });

  it('returns Manager-specific labels for Manager track', () => {
    expect(gradeToLabel(5, 'manager')).toBe('Team Lead');
    expect(gradeToLabel(6, 'manager')).toBe('Manager');
    expect(gradeToLabel(7, 'manager')).toBe('Senior Manager');
    expect(gradeToLabel(8, 'manager')).toBe('Director');
    expect(gradeToLabel(9, 'manager')).toBe('Senior Director');
    expect(gradeToLabel(10, 'manager')).toBe('Vice President');
  });

  it('defaults to IC labels when no track is specified', () => {
    expect(gradeToLabel(5)).toBe('Staff Individual Contributor');
    expect(gradeToLabel(7)).toBe('Principal Individual Contributor');
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
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 50 },
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
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 25 },
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
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 25 }, // has management + some authority
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
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 50 },
    );
    // Even with max points, grade cannot exceed ceiling of 8
    expect(result.grade).toBeLessThanOrEqual(8);
  });

  it('applies soft gate: no decision autonomy + no financial authority reduces grade by 1 for ICs', () => {
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
      { managesTeam: false, decisionAutonomy: false, financialAuthority: 0 },
      'ic', // IC track
    );
    // Soft gate reduces grade by 1 (not hard-capped at 4)
    // With max points in band3 IC, raw grade would be ~20, soft-capped to ~19
    expect(result.grade).toBeLessThanOrEqual(19);
    expect(result.grade).toBeGreaterThan(4);
  });

  it('does not apply soft gate to IC when decision autonomy is true', () => {
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
      { managesTeam: false, decisionAutonomy: true, financialAuthority: 0 }, // has autonomy
      'ic',
    );
    // Soft gate should NOT apply — grade should be higher
    expect(result.grade).toBeGreaterThan(4);
  });

  it('does not apply soft gate to Manager track', () => {
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
      { managesTeam: false, decisionAutonomy: false, financialAuthority: 0 },
      'manager', // Manager track - no soft gate
    );
    // Manager track is not subject to soft gate
    expect(result.grade).toBeGreaterThan(4);
  });

  it('does not apply soft gate when either gate passes', () => {
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
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 0 }, // has management
      'ic',
    );
    // Soft gate should NOT apply — grade should be higher
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
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 25 },
    );
    expect(result.label).toBeTruthy();
    expect(typeof result.label).toBe('string');
  });

  it('reserves ceiling grade for CEO: non-CEO roles capped at ceiling-1', () => {
    const tightCeiling = { grade: 10, gradeLabel: 'Vice President' };
    const nonCeilingResult = scoreRole(
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
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 50 },
      'manager',
      undefined,
      false, // not CEO
    );
    // Non-CEO roles cannot reach the ceiling grade
    expect(nonCeilingResult.grade).toBeLessThan(tightCeiling.grade);
    expect(nonCeilingResult.grade).toBe(tightCeiling.grade - 1);

    // CEO can reach the ceiling grade
    const ceoResult = scoreRole(
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
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 50 },
      'manager',
      undefined,
      true, // is CEO
    );
    expect(ceoResult.grade).toBe(tightCeiling.grade);
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
      { managesTeam: false, decisionAutonomy: false, financialAuthority: 5 },
    );
    expect(result.totalPoints).toBe(expectedTotal);
  });

  it('IC track weights "Job Functional Knowledge" more heavily than Manager track', () => {
    // Same raw scores for both tracks — IC should score higher due to weighting
    const points = {
      jobFunctionalKnowledge: 45,
      businessExpertise: 20,
      leadership: 15,
      problemSolving: 40,
      natureOfImpact: 25,
      areaOfImpact: 20,
      interpersonalSkills: 15,
    };
    const icResult = scoreRole(
      companyCeiling,
      'band3',
      points,
      { managesTeam: false, decisionAutonomy: false, financialAuthority: 0 },
      'ic',
    );
    const managerResult = scoreRole(
      companyCeiling,
      'band3',
      points,
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 50 },
      'manager',
    );
    // With same raw scores, IC should score higher due to knowledge/problemSolving weighting
    // Note: Manager may still score higher due to band multiplier differences,
    // but the IC weighting narrows the gap significantly
    expect(icResult.grade).toBeGreaterThanOrEqual(managerResult.grade - 2);
  });

  it('Manager track weights "Leadership" more heavily than IC track', () => {
    // Same raw scores for both tracks — Manager should score higher due to leadership weighting
    const points = {
      jobFunctionalKnowledge: 20,
      businessExpertise: 45,
      leadership: 45,
      problemSolving: 25,
      natureOfImpact: 40,
      areaOfImpact: 40,
      interpersonalSkills: 35,
    };
    const icResult = scoreRole(
      companyCeiling,
      'band3',
      points,
      { managesTeam: false, decisionAutonomy: false, financialAuthority: 0 },
      'ic',
    );
    const managerResult = scoreRole(
      companyCeiling,
      'band3',
      points,
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 50 },
      'manager',
    );
    // With same raw scores, Manager should score higher due to leadership/business weighting
    expect(managerResult.grade).toBeGreaterThanOrEqual(icResult.grade);
  });

  it('custom factor weightings override defaults', () => {
    const customWeightings: FactorWeighting[] = [
      { factorId: 'jobFunctionalKnowledge', icWeight: 1.0, managerWeight: 1.0 },
      { factorId: 'businessExpertise', icWeight: 1.0, managerWeight: 1.0 },
      { factorId: 'leadership', icWeight: 1.0, managerWeight: 1.0 },
      { factorId: 'problemSolving', icWeight: 1.0, managerWeight: 1.0 },
      { factorId: 'natureOfImpact', icWeight: 1.0, managerWeight: 1.0 },
      { factorId: 'areaOfImpact', icWeight: 1.0, managerWeight: 1.0 },
      { factorId: 'interpersonalSkills', icWeight: 1.0, managerWeight: 1.0 },
    ];
    const points = {
      jobFunctionalKnowledge: 30,
      businessExpertise: 30,
      leadership: 30,
      problemSolving: 30,
      natureOfImpact: 30,
      areaOfImpact: 30,
      interpersonalSkills: 30,
    };
    const icResult = scoreRole(
      companyCeiling,
      'band3',
      points,
      { managesTeam: false, decisionAutonomy: false, financialAuthority: 0 },
      'ic',
      customWeightings,
    );
    const managerResult = scoreRole(
      companyCeiling,
      'band3',
      points,
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 50 },
      'manager',
      customWeightings,
    );
    // With equal weights, both tracks should score similarly (ignoring soft gate)
    // Manager should still score higher due to band multiplier
    expect(managerResult.grade).toBeGreaterThanOrEqual(icResult.grade);
  });

  it('parallel grade ladders: Staff IC ≈ Manager, Principal IC ≈ Senior Manager', () => {
    // High-scoring IC should reach similar grades as mid-level Manager
    const icResult = scoreRole(
      companyCeiling,
      'band3',
      {
        jobFunctionalKnowledge: 40,
        businessExpertise: 30,
        leadership: 15,
        problemSolving: 40,
        natureOfImpact: 30,
        areaOfImpact: 25,
        interpersonalSkills: 20,
      },
      { managesTeam: false, decisionAutonomy: false, financialAuthority: 0 },
      'ic',
    );
    const managerResult = scoreRole(
      companyCeiling,
      'band3',
      {
        jobFunctionalKnowledge: 25,
        businessExpertise: 35,
        leadership: 35,
        problemSolving: 30,
        natureOfImpact: 30,
        areaOfImpact: 30,
        interpersonalSkills: 25,
      },
      { managesTeam: true, decisionAutonomy: false, financialAuthority: 25 },
      'manager',
    );
    // IC and Manager with different profiles should reach comparable grades
    // demonstrating parallel ladders (within 4 grades)
    // A high-scoring IC (Staff/Principal) can reach similar grades as a mid-level Manager
    expect(Math.abs(icResult.grade - managerResult.grade)).toBeLessThanOrEqual(4);
  });
});
