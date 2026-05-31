import { describe, it, expect } from 'vitest';
import {
  calculateSalaryEstimate,
  formatSalary,
  DEFAULT_SALARY_BANDS,
  DEFAULT_LOCATION_MULTIPLIERS,
  DEFAULT_JOB_FAMILY_MULTIPLIERS,
} from '../src/lib/engine/SalaryEngine';

// ─── Default Data Tests ────────────────────────────────────────────

describe('Default Data', () => {
  it('has 25 salary bands (grades 1-25)', () => {
    expect(DEFAULT_SALARY_BANDS.length).toBe(25);
    expect(DEFAULT_SALARY_BANDS[0].grade).toBe(1);
    expect(DEFAULT_SALARY_BANDS[24].grade).toBe(25);
  });

  it('has location multipliers for major cities', () => {
    expect(DEFAULT_LOCATION_MULTIPLIERS.length).toBeGreaterThan(10);
    const sf = DEFAULT_LOCATION_MULTIPLIERS.find(l => l.city === 'San Francisco');
    expect(sf).toBeTruthy();
    expect(sf!.costOfLivingIndex).toBe(1.0);
  });

  it('has job family multipliers for common families', () => {
    expect(DEFAULT_JOB_FAMILY_MULTIPLIERS.length).toBeGreaterThan(10);
    const eng = DEFAULT_JOB_FAMILY_MULTIPLIERS.find(f => f.family === 'Engineering');
    expect(eng).toBeTruthy();
  });
});

// ─── calculateSalaryEstimate Tests ──────────────────────────────────

describe('calculateSalaryEstimate', () => {
  it('returns correct salary for grade 8 in San Francisco Engineering', () => {
    const result = calculateSalaryEstimate(
      8,
      'US',
      'San Francisco',
      'Engineering',
    );
    // Grade 8 base: min=125000, mid=155000, max=185000
    // SF multiplier: 1.0
    // Engineering grade 8 multiplier: 1.15
    expect(result.currency).toBe('USD');
    expect(result.min).toBeGreaterThanOrEqual(140000);
    expect(result.min).toBeLessThanOrEqual(145000);
    expect(result.mid).toBeGreaterThanOrEqual(175000);
    expect(result.mid).toBeLessThanOrEqual(180000);
    expect(result.max).toBeGreaterThanOrEqual(210000);
    expect(result.max).toBeLessThanOrEqual(215000);
  });

  it('adjusts salary for different locations', () => {
    const sfSalary = calculateSalaryEstimate(8, 'US', 'San Francisco', 'Engineering');
    const nySalary = calculateSalaryEstimate(8, 'US', 'New York', 'Engineering');
    const bangaloreSalary = calculateSalaryEstimate(8, 'IN', 'Bangalore', 'Engineering');

    // SF should be highest, NY slightly lower, Bangalore much lower
    expect(sfSalary.min).toBeGreaterThan(nySalary.min);
    expect(nySalary.min).toBeGreaterThan(bangaloreSalary.min);
  });

  it('adjusts salary for different job families', () => {
    const engSalary = calculateSalaryEstimate(8, 'US', 'San Francisco', 'Engineering');
    const supportSalary = calculateSalaryEstimate(8, 'US', 'San Francisco', 'Customer Support');

    // Engineering should be higher than Customer Support
    expect(engSalary.min).toBeGreaterThan(supportSalary.min);
  });

  it('handles unknown locations with default multiplier', () => {
    const result = calculateSalaryEstimate(8, 'XX', 'Unknown', 'Engineering');
    expect(result.currency).toBe('USD');
    expect(result.min).toBeGreaterThan(0);
  });

  it('handles unknown job families with default multiplier', () => {
    const result = calculateSalaryEstimate(8, 'US', 'San Francisco', 'Unknown');
    expect(result.currency).toBe('USD');
    expect(result.min).toBeGreaterThan(0);
  });

  it('returns zero for unknown grade', () => {
    const result = calculateSalaryEstimate(99, 'US', 'San Francisco', 'Engineering');
    expect(result.min).toBe(0);
    expect(result.mid).toBe(0);
    expect(result.max).toBe(0);
  });
});

// ─── formatSalary Tests ─────────────────────────────────────────────

describe('formatSalary', () => {
  it('formats salary in K notation', () => {
    const estimate = { min: 85000, mid: 100000, max: 115000, currency: 'USD' };
    expect(formatSalary(estimate)).toBe('$85K – $100K – $115K');
  });

  it('formats salary in M notation', () => {
    const estimate = { min: 1250000, mid: 1550000, max: 1850000, currency: 'USD' };
    expect(formatSalary(estimate)).toBe('$1.3M – $1.6M – $1.9M');
  });

  it('handles small salaries', () => {
    const estimate = { min: 30000, mid: 40000, max: 50000, currency: 'USD' };
    expect(formatSalary(estimate)).toBe('$30K – $40K – $50K');
  });
});
