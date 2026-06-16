// ─── Company & Ceiling ───────────────────────────────────────────────

export type AnnualRevenue =
  | 'under10M'
  | '10to50M'
  | '50to250M'
  | '250to1B'
  | 'over1B';

export type GlobalHeadcount =
  | 'under100'
  | '100to500'
  | '501to2500'
  | '2501to10000'
  | 'over10000';

export type GeographicFootprint = 'singleCountry' | 'regional' | 'global';

export type CorporateStructure = 'singleBusiness' | 'multiBusiness' | 'holdingCompany';

// ─── Banding Decision Tree ──────────────────────────────────────────

export type MarketComplexity = 'homogeneous' | 'complex';
export type EnterpriseSize = 'small' | 'large';

export interface Company {
  name: string;
  annualRevenue: AnnualRevenue;
  globalHeadcount: GlobalHeadcount;
  geographicFootprint: GeographicFootprint;
  corporateStructure: CorporateStructure;
}

export interface Ceiling {
  grade: number;
  gradeLabel: string;
}

// ─── Questionnaire ───────────────────────────────────────────────────

export interface CareerBand {
  id: string;
  label: string;
  range: string;
}

export interface AnswerOption {
  label: string;
  points: number;
}

export interface Question {
  id: string;
  text: string;
  helpText?: string; // guidance to prevent person-evaluation bias
  options: AnswerOption[];
}

export interface Factor {
  id: string;
  label: string;
  helpText?: string; // overall factor description
  maxPoints: number;
  questions: Question[];
}

export interface GateQuestion {
  id: string;
  text: string;
  helpText?: string;
  type: 'boolean' | 'dropdown';
  options?: AnswerOption[];
  appliesTo?: 'manager' | 'ic' | 'both'; // which tracks this gate applies to
}

export interface Questionnaire {
  careerBands: CareerBand[];
  factors: Factor[];
  gateQuestions: GateQuestion[];
  factorWeightings: FactorWeighting[];
  factorLevels?: FactorLevel[]; // NEW: band-specific factor levels
}

// ─── Role ────────────────────────────────────────────────────────────

export type RoleSource = 'manual' | 'csv-import';
export type RoleStatus = 'ungraded' | 'graded';
export type RoleTrack = 'ic' | 'manager';

export interface FactorWeighting {
  factorId: string;
  icWeight: number;
  managerWeight: number;
}

export interface Role {
  id: string;
  title: string;
  department: string;
  location: string;
  locations?: string[] | null; // array of locations for imported roles (grouped by title)
  reportsTo: string | null;
  source: RoleSource;
  careerBand: string;
  track: RoleTrack; // 'ic' or 'manager'
  marketComplexity?: MarketComplexity;
  enterpriseSize?: EnterpriseSize;
  bandAssignedManually?: boolean;
  answers: Record<string, string | boolean>;
  assignedGrade: number;
  assignedGradeLabel: string;
  totalPoints: number;
  status: RoleStatus;
  locked?: boolean; // CEO/C-suite roles are locked at ceiling grade
  salaryEstimate?: SalaryEstimate; // computed from grade + location + family
}

// ─── Full Project ────────────────────────────────────────────────────

export interface Project {
  version: string;
  company: Company;
  ceiling: Ceiling;
  questionnaire: Questionnaire;
  roles: Role[];
  salaryBands?: SalaryBand[];
  locationMultipliers?: LocationMultiplier[];
  jobFamilyMultipliers?: JobFamilyMultiplier[];
}

// ─── Validation ──────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Scoring Result ──────────────────────────────────────────────────

export interface ScoringResult {
  grade: number;
  label: string;
  totalPoints: number;
}

// ─── Salary / Compensation ───────────────────────────────────────────

export interface SalaryBand {
  grade: number;
  min: number;
  mid: number;
  max: number;
  currency: string;
  effectiveDate?: string;
}

export interface LocationMultiplier {
  country: string;
  city: string;
  costOfLivingIndex: number;
}

export interface JobFamilyMultiplier {
  family: string;
  grade: number;
  marketAdjustment: number;
}

export interface SalaryEstimate {
  min: number;
  mid: number;
  max: number;
  currency: string;
}

// ─── Factor Levels (band-specific) ──────────────────────────────

export type FactorLevelId = 'FK1' | 'FK2' | 'FK3' | 'BE1' | 'BE2' | 'BE3'
  | 'LS1' | 'LS2' | 'LS3' | 'PS1' | 'PS2' | 'PS3'
  | 'NI1' | 'NI2' | 'NI3' | 'AI1' | 'AI2' | 'AI3'
  | 'IS1' | 'IS2' | 'IS3';

export interface FactorLevel {
  id: FactorLevelId;
  bandId: string; // e.g., 'band1', 'band2', 'band3'
  track: 'ic' | 'manager' | 'both';
  description: string;
  minPoints: number;
  maxPoints: number;
}

// ─── Cross-Comparison ───────────────────────────────────────────────

export interface CrossComparisonCell {
  grade: number;
  department: string;
  positions: { id: string; title: string; points: number }[];
}

export interface CrossComparisonMatrix {
  data: Record<number, Record<string, { id: string; title: string; points: number }[]>>;
}
