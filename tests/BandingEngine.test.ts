import { describe, it, expect } from 'vitest';
import { determineBand, deriveEnterpriseSize, deriveMarketComplexity, autoAssignBand } from '../src/lib/engine/BandingEngine';

const defaultBands = [
  { id: 'band1', label: 'C-Suite / Board', range: 'Grades 13–25' },
  { id: 'band2', label: 'Senior Leadership', range: 'Grades 6–12' },
  { id: 'band3', label: 'Individual Contributors & Frontline Managers', range: 'Grades 1–5' },
];

describe('determineBand', () => {
  it('maps homogeneous + small to band3 (operational)', () => {
    expect(determineBand('homogeneous', 'small', defaultBands)).toBe('band3');
  });

  it('maps homogeneous + large to band2 (middle management)', () => {
    expect(determineBand('homogeneous', 'large', defaultBands)).toBe('band2');
  });

  it('maps complex + small to band2 (middle management)', () => {
    expect(determineBand('complex', 'small', defaultBands)).toBe('band2');
  });

  it('maps complex + large to band1 (executive)', () => {
    expect(determineBand('complex', 'large', defaultBands)).toBe('band1');
  });

  it('falls back to band3 when no bands provided (homogeneous + small)', () => {
    expect(determineBand('homogeneous', 'small', [])).toBe('band3');
  });

  it('falls back to band1 when only 1 band provided (complex + large)', () => {
    expect(determineBand('complex', 'large', [{ id: 'band1', label: 'X', range: 'Y' }])).toBe('band1');
  });
});

describe('deriveEnterpriseSize', () => {
  it('maps under100 to small', () => {
    expect(deriveEnterpriseSize('under100')).toBe('small');
  });

  it('maps 501to2500 to small', () => {
    expect(deriveEnterpriseSize('501to2500')).toBe('small');
  });

  it('maps 2501to10000 to large', () => {
    expect(deriveEnterpriseSize('2501to10000')).toBe('large');
  });

  it('maps over10000 to large', () => {
    expect(deriveEnterpriseSize('over10000')).toBe('large');
  });

  it('defaults to small for unknown headcount', () => {
    expect(deriveEnterpriseSize('unknown' as any)).toBe('small');
  });
});

describe('deriveMarketComplexity', () => {
  it('maps singleBusiness to homogeneous', () => {
    expect(deriveMarketComplexity('singleBusiness')).toBe('homogeneous');
  });

  it('maps multiBusiness to complex', () => {
    expect(deriveMarketComplexity('multiBusiness')).toBe('complex');
  });

  it('maps holdingCompany to complex', () => {
    expect(deriveMarketComplexity('holdingCompany')).toBe('complex');
  });

  it('defaults to homogeneous for unknown structure', () => {
    expect(deriveMarketComplexity('unknown' as any)).toBe('homogeneous');
  });
});

describe('autoAssignBand', () => {
  it('returns band3 for homogeneous + small', () => {
    expect(autoAssignBand('homogeneous', 'small', defaultBands, false)).toBe('band3');
  });

  it('returns band1 for complex + large', () => {
    expect(autoAssignBand('complex', 'large', defaultBands, false)).toBe('band1');
  });

  it('returns null when bandAssignedManually is true', () => {
    expect(autoAssignBand('complex', 'large', defaultBands, true)).toBeNull();
  });

  it('returns null when complexity is undefined', () => {
    expect(autoAssignBand(undefined, 'large', defaultBands, false)).toBeNull();
  });

  it('returns null when size is undefined', () => {
    expect(autoAssignBand('complex', undefined, defaultBands, false)).toBeNull();
  });
});
