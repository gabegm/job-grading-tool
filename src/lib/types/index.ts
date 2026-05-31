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
  options: AnswerOption[];
}

export interface Factor {
  id: string;
  label: string;
  maxPoints: number;
  questions: Question[];
}

export interface GateQuestion {
  id: string;
  text: string;
  type: 'boolean' | 'dropdown';
  options?: AnswerOption[];
}

export interface Questionnaire {
  careerBands: CareerBand[];
  factors: Factor[];
  gateQuestions: GateQuestion[];
}

// ─── Role ────────────────────────────────────────────────────────────

export type RoleSource = 'manual' | 'csv-import';
export type RoleStatus = 'ungraded' | 'graded';

export interface Role {
  id: string;
  title: string;
  department: string;
  location: string;
  locations?: string[] | null; // array of locations for imported roles (grouped by title)
  reportsTo: string | null;
  source: RoleSource;
  careerBand: string;
  answers: Record<string, string | boolean>;
  assignedGrade: number;
  assignedGradeLabel: string;
  totalPoints: number;
  status: RoleStatus;
  locked?: boolean; // CEO/C-suite roles are locked at ceiling grade
}

// ─── Full Project ────────────────────────────────────────────────────

export interface Project {
  version: string;
  company: Company;
  ceiling: Ceiling;
  questionnaire: Questionnaire;
  roles: Role[];
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
