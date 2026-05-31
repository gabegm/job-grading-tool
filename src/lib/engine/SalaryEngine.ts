import type {
  SalaryBand,
  LocationMultiplier,
  JobFamilyMultiplier,
  SalaryEstimate,
} from '../types';

// ─── Default Salary Bands (USD) ─────────────────────────────────────

/**
 * Base salary bands for all 25 grades.
 * These are currency-agnostic base values (stored in USD for reference).
 * Actual salaries are adjusted by location and job family multipliers.
 */
export const DEFAULT_SALARY_BANDS: SalaryBand[] = [
  { grade: 1, min: 30000, mid: 40000, max: 50000, currency: 'USD' },
  { grade: 2, min: 45000, mid: 55000, max: 65000, currency: 'USD' },
  { grade: 3, min: 60000, mid: 75000, max: 90000, currency: 'USD' },
  { grade: 4, min: 75000, mid: 90000, max: 105000, currency: 'USD' },
  { grade: 5, min: 85000, mid: 100000, max: 115000, currency: 'USD' },
  { grade: 6, min: 95000, mid: 115000, max: 135000, currency: 'USD' },
  { grade: 7, min: 110000, mid: 135000, max: 160000, currency: 'USD' },
  { grade: 8, min: 125000, mid: 155000, max: 185000, currency: 'USD' },
  { grade: 9, min: 140000, mid: 175000, max: 210000, currency: 'USD' },
  { grade: 10, min: 160000, mid: 200000, max: 240000, currency: 'USD' },
  { grade: 11, min: 180000, mid: 225000, max: 270000, currency: 'USD' },
  { grade: 12, min: 200000, mid: 250000, max: 300000, currency: 'USD' },
  { grade: 13, min: 225000, mid: 280000, max: 340000, currency: 'USD' },
  { grade: 14, min: 250000, mid: 310000, max: 380000, currency: 'USD' },
  { grade: 15, min: 275000, mid: 340000, max: 410000, currency: 'USD' },
  { grade: 16, min: 300000, mid: 375000, max: 450000, currency: 'USD' },
  { grade: 17, min: 325000, mid: 400000, max: 480000, currency: 'USD' },
  { grade: 18, min: 350000, mid: 430000, max: 520000, currency: 'USD' },
  { grade: 19, min: 400000, mid: 500000, max: 600000, currency: 'USD' },
  { grade: 20, min: 450000, mid: 560000, max: 680000, currency: 'USD' },
  { grade: 21, min: 500000, mid: 620000, max: 750000, currency: 'USD' },
  { grade: 22, min: 550000, mid: 680000, max: 820000, currency: 'USD' },
  { grade: 23, min: 600000, mid: 750000, max: 900000, currency: 'USD' },
  { grade: 24, min: 650000, mid: 820000, max: 1000000, currency: 'USD' },
  { grade: 25, min: 700000, mid: 900000, max: 1100000, currency: 'USD' },
];

// ─── Default Location Multipliers ────────────────────────────────────

/**
 * Cost of living indices relative to San Francisco (SF = 1.0).
 * These are approximate and should be customized per company.
 */
export const DEFAULT_LOCATION_MULTIPLIERS: LocationMultiplier[] = [
  { country: 'US', city: 'San Francisco', costOfLivingIndex: 1.0 },
  { country: 'US', city: 'New York', costOfLivingIndex: 0.95 },
  { country: 'US', city: 'Seattle', costOfLivingIndex: 0.92 },
  { country: 'US', city: 'Boston', costOfLivingIndex: 0.90 },
  { country: 'US', city: 'Austin', costOfLivingIndex: 0.85 },
  { country: 'US', city: 'Chicago', costOfLivingIndex: 0.80 },
  { country: 'US', city: 'Los Angeles', costOfLivingIndex: 0.88 },
  { country: 'US', city: 'Denver', costOfLivingIndex: 0.82 },
  { country: 'US', city: 'Atlanta', costOfLivingIndex: 0.78 },
  { country: 'US', city: 'Miami', costOfLivingIndex: 0.80 },
  { country: 'US', city: 'Dallas', costOfLivingIndex: 0.76 },
  { country: 'US', city: 'Phoenix', costOfLivingIndex: 0.75 },
  { country: 'US', city: 'Portland', costOfLivingIndex: 0.83 },
  { country: 'US', city: 'Nashville', costOfLivingIndex: 0.77 },
  { country: 'US', city: 'Other', costOfLivingIndex: 0.80 },
  { country: 'GB', city: 'London', costOfLivingIndex: 0.70 },
  { country: 'DE', city: 'Berlin', costOfLivingIndex: 0.65 },
  { country: 'FR', city: 'Paris', costOfLivingIndex: 0.68 },
  { country: 'JP', city: 'Tokyo', costOfLivingIndex: 0.72 },
  { country: 'SG', city: 'Singapore', costOfLivingIndex: 0.75 },
  { country: 'AU', city: 'Sydney', costOfLivingIndex: 0.78 },
  { country: 'CA', city: 'Toronto', costOfLivingIndex: 0.72 },
  { country: 'AE', city: 'Dubai', costOfLivingIndex: 0.70 },
  { country: 'IN', city: 'Mumbai', costOfLivingIndex: 0.35 },
  { country: 'IN', city: 'Bangalore', costOfLivingIndex: 0.32 },
  { country: 'CN', city: 'Shanghai', costOfLivingIndex: 0.45 },
  { country: 'Other', city: 'Other', costOfLivingIndex: 0.60 },
];

// ─── Default Job Family Multipliers ──────────────────────────────────

/**
 * Market adjustment factors by job family.
 * In-demand families (e.g., Engineering) have higher multipliers.
 * Saturated families (e.g., Customer Support) have lower multipliers.
 */
export const DEFAULT_JOB_FAMILY_MULTIPLIERS: JobFamilyMultiplier[] = [
  { family: 'Engineering', grade: 8, marketAdjustment: 1.15 },
  { family: 'Engineering', grade: 10, marketAdjustment: 1.20 },
  { family: 'Engineering', grade: 12, marketAdjustment: 1.18 },
  { family: 'Engineering', grade: 14, marketAdjustment: 1.15 },
  { family: 'Product', grade: 8, marketAdjustment: 1.10 },
  { family: 'Product', grade: 10, marketAdjustment: 1.12 },
  { family: 'Product', grade: 12, marketAdjustment: 1.10 },
  { family: 'Sales', grade: 8, marketAdjustment: 1.10 },
  { family: 'Sales', grade: 10, marketAdjustment: 1.08 },
  { family: 'Sales', grade: 12, marketAdjustment: 1.05 },
  { family: 'Marketing', grade: 8, marketAdjustment: 0.95 },
  { family: 'Marketing', grade: 10, marketAdjustment: 0.95 },
  { family: 'Marketing', grade: 12, marketAdjustment: 0.95 },
  { family: 'Human Resources', grade: 8, marketAdjustment: 0.90 },
  { family: 'Human Resources', grade: 10, marketAdjustment: 0.90 },
  { family: 'Human Resources', grade: 12, marketAdjustment: 0.90 },
  { family: 'Finance', grade: 8, marketAdjustment: 1.05 },
  { family: 'Finance', grade: 10, marketAdjustment: 1.05 },
  { family: 'Finance', grade: 12, marketAdjustment: 1.05 },
  { family: 'Customer Support', grade: 8, marketAdjustment: 0.85 },
  { family: 'Customer Support', grade: 10, marketAdjustment: 0.85 },
  { family: 'Customer Support', grade: 12, marketAdjustment: 0.85 },
  { family: 'Operations', grade: 8, marketAdjustment: 0.90 },
  { family: 'Operations', grade: 10, marketAdjustment: 0.90 },
  { family: 'Operations', grade: 12, marketAdjustment: 0.90 },
  { family: 'Legal', grade: 8, marketAdjustment: 1.10 },
  { family: 'Legal', grade: 10, marketAdjustment: 1.10 },
  { family: 'Legal', grade: 12, marketAdjustment: 1.10 },
  { family: 'Data Science', grade: 8, marketAdjustment: 1.15 },
  { family: 'Data Science', grade: 10, marketAdjustment: 1.18 },
  { family: 'Data Science', grade: 12, marketAdjustment: 1.15 },
  { family: 'Design', grade: 8, marketAdjustment: 1.05 },
  { family: 'Design', grade: 10, marketAdjustment: 1.05 },
  { family: 'Design', grade: 12, marketAdjustment: 1.05 },
  { family: 'Other', grade: 8, marketAdjustment: 0.95 },
  { family: 'Other', grade: 10, marketAdjustment: 0.95 },
  { family: 'Other', grade: 12, marketAdjustment: 0.95 },
];

// ─── Salary Calculation ──────────────────────────────────────────────

/**
 * Calculates salary estimate for a role based on grade, location, and job family.
 * This is the Market Pricing Engine (Module 2) that sits on top of the Job Architecture Engine (Module 1).
 */
export function calculateSalaryEstimate(
  grade: number,
  country: string,
  city: string,
  jobFamily: string,
  salaryBands?: SalaryBand[],
  locationMultipliers?: LocationMultiplier[],
  jobFamilyMultipliers?: JobFamilyMultiplier[],
): SalaryEstimate {
  const bands = salaryBands || DEFAULT_SALARY_BANDS;
  const locMults = locationMultipliers || DEFAULT_LOCATION_MULTIPLIERS;
  const famMults = jobFamilyMultipliers || DEFAULT_JOB_FAMILY_MULTIPLIERS;

  // Find base salary band for this grade
  const baseBand = bands.find(b => b.grade === grade);
  if (!baseBand) {
    return { min: 0, mid: 0, max: 0, currency: 'USD' };
  }

  // Find location multiplier
  const locMult = locMults.find(l => l.country === country && l.city === city);
  const locationFactor = locMult ? locMult.costOfLivingIndex : 0.80; // default for unknown locations

  // Find job family multiplier for this grade
  const famMult = famMults.find(f => f.family === jobFamily && f.grade === grade);
  const familyFactor = famMult ? famMult.marketAdjustment : 0.95; // default for unknown families

  // Calculate adjusted salary
  const min = Math.round(baseBand.min * locationFactor * familyFactor);
  const mid = Math.round(baseBand.mid * locationFactor * familyFactor);
  const max = Math.round(baseBand.max * locationFactor * familyFactor);

  return {
    min,
    mid,
    max,
    currency: baseBand.currency,
  };
}

/**
 * Formats a salary estimate for display.
 */
export function formatSalary(estimate: SalaryEstimate): string {
  const currencySymbol = estimate.currency === 'USD' ? '$' : estimate.currency;
  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${currencySymbol}${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${currencySymbol}${(n / 1000).toFixed(0)}K`;
    return `${currencySymbol}${n}`;
  };

  return `${formatNumber(estimate.min)} – ${formatNumber(estimate.mid)} – ${formatNumber(estimate.max)}`;
}
