import type {
  Project,
  Company,
  Ceiling,
  Questionnaire,
  Role,
  ValidationResult,
  AnnualRevenue,
  GlobalHeadcount,
  GeographicFootprint,
  CorporateStructure,
  RoleSource,
  RoleTrack,
  FactorWeighting,
  SalaryBand,
  LocationMultiplier,
  JobFamilyMultiplier,
} from '../types';
import { calculateCeiling, gradeToLabel } from '../engine/ScoringEngine';
import { DEFAULT_SALARY_BANDS, DEFAULT_LOCATION_MULTIPLIERS, DEFAULT_JOB_FAMILY_MULTIPLIERS } from '../engine/SalaryEngine';
import { DEFAULT_FACTOR_LEVELS } from '../constants/factorLevels';
import { deriveEnterpriseSize, deriveMarketComplexity } from '../engine/BandingEngine';

// ─── Default Questionnaire ───────────────────────────────────────────

export function createDefaultQuestionnaire(): Questionnaire {
  return {
    careerBands: [
      { id: 'band1', label: 'C-Suite / Board', range: 'Grades 13–25' },
      { id: 'band2', label: 'Senior Leadership', range: 'Grades 6–12' },
      { id: 'band3', label: 'Individual Contributors & Frontline Managers', range: 'Grades 1–5' },
    ],
    factors: [
      {
        id: 'jobFunctionalKnowledge',
        label: 'Job Functional Knowledge',
        helpText: 'Evaluate the knowledge required by the ROLE, not the person currently in it. Ask: "What knowledge does this position require to be successful?" not "How knowledgeable is the current holder?"',
        maxPoints: 50,
        questions: [
          {
            id: 'q_knowledge',
            text: 'What level of specialized knowledge is required?',
            helpText: 'Focus on the role\'s requirements. A role requiring deep expertise in a specialized field scores high, regardless of whether the current person has it.',
            options: [
              { label: 'Basic operational knowledge', points: 5 },
              { label: 'Specialized technical expertise', points: 20 },
              { label: 'Deep subject-matter authority', points: 40 },
              { label: 'World-class thought leadership', points: 50 },
            ],
          },
        ],
      },
      {
        id: 'businessExpertise',
        label: 'Business Expertise',
        helpText: 'Evaluate the breadth of organizational understanding the ROLE requires, not the person\'s actual business acumen.',
        maxPoints: 50,
        questions: [
          {
            id: 'q_business',
            text: 'How well must the role understand the organization\'s operations and industry?',
            helpText: 'Ask: "Does this position need to understand how the business works?" not "Does the current person understand the business?"',
            options: [
              { label: 'Own function only', points: 5 },
              { label: 'Own function + adjacent functions', points: 20 },
              { label: 'Entire organization', points: 40 },
              { label: 'Entire organization + industry ecosystem', points: 50 },
            ],
          },
        ],
      },
      {
        id: 'leadership',
        label: 'Leadership',
        helpText: 'Evaluate the leadership RESPONSIBILITIES of the ROLE, not the person\'s leadership qualities. A role that requires managing people scores high on leadership, regardless of how good the current person is at leading.',
        maxPoints: 50,
        questions: [
          {
            id: 'q_leadership',
            text: 'What level of people management or project direction is expected?',
            helpText: 'Ask: "Does this position have direct reports or budget authority?" not "Is the current person a good leader?"',
            options: [
              { label: 'Individual contributor', points: 5 },
              { label: 'Small team (1–5) or project lead', points: 20 },
              { label: 'Department (5–20)', points: 40 },
              { label: 'Multiple departments or business unit', points: 50 },
            ],
          },
        ],
      },
      {
        id: 'problemSolving',
        label: 'Problem Solving',
        helpText: 'Evaluate the COMPLEXITY of problems the ROLE must solve, not how well the current person solves them.',
        maxPoints: 50,
        questions: [
          {
            id: 'q_problemSolving',
            text: 'What is the complexity and unpredictability of problems addressed?',
            helpText: 'Ask: "What kind of problems does this position face?" not "How smart is the current person?"',
            options: [
              { label: 'Well-defined, routine problems', points: 5 },
              { label: 'Complex but predictable problems', points: 20 },
              { label: 'Complex, unpredictable problems', points: 40 },
              { label: 'Highly ambiguous, strategic problems', points: 50 },
            ],
          },
        ],
      },
      {
        id: 'natureOfImpact',
        label: 'Nature of Impact',
        helpText: 'Evaluate the IMPACT the ROLE has on outcomes, not the person\'s actual contributions.',
        maxPoints: 50,
        questions: [
          {
            id: 'q_natureImpact',
            text: 'How does the role affect outcomes?',
            helpText: 'Ask: "What is the potential impact of this position?" not "How well is the current person performing?"',
            options: [
              { label: 'Direct service delivery', points: 5 },
              { label: 'Supports service delivery', points: 20 },
              { label: 'Advisory / strategic input', points: 40 },
              { label: 'Executes strategic decisions', points: 50 },
            ],
          },
        ],
      },
      {
        id: 'areaOfImpact',
        label: 'Area of Impact',
        helpText: 'Evaluate the SCOPE of the ROLE\'s influence, not the person\'s actual influence.',
        maxPoints: 50,
        questions: [
          {
            id: 'q_areaImpact',
            text: 'What is the breadth of the role\'s influence?',
            helpText: 'Ask: "How many people/processes does this position affect?" not "How well-liked or influential is the current person?"',
            options: [
              { label: 'Single task or process', points: 5 },
              { label: 'Single team or function', points: 20 },
              { label: 'Entire department', points: 40 },
              { label: 'Entire organization or multiple business units', points: 50 },
            ],
          },
        ],
      },
      {
        id: 'interpersonalSkills',
        label: 'Interpersonal Skills',
        helpText: 'Evaluate the COMMUNICATION REQUIREMENTS of the ROLE, not the person\'s actual interpersonal skills.',
        maxPoints: 50,
        questions: [
          {
            id: 'q_interpersonal',
            text: 'What are the communication and collaboration requirements?',
            helpText: 'Ask: "Who does this position need to interact with?" not "Is the current person good with people?"',
            options: [
              { label: 'Standard internal communication', points: 5 },
              { label: 'Regular cross-functional coordination', points: 20 },
              { label: 'Influencing senior stakeholders', points: 40 },
              { label: 'Negotiating with executives, boards, or external partners', points: 50 },
            ],
          },
        ],
      },
    ],
    gateQuestions: [
      {
        id: 'managesTeam',
        text: 'Does this role directly manage performance reviews and compensation of a team?',
        helpText: 'This is about the ROLE\'S authority, not the person\'s management style. Does this position have direct reports who report to them?',
        type: 'boolean',
        appliesTo: 'manager',
      },
      {
        id: 'decisionAutonomy',
        text: 'Does this role make significant decisions without requiring approval?',
        helpText: 'This is about the ROLE\'S autonomy, not the person\'s confidence. Can this position make decisions about resources, priorities, or direction without seeking approval?',
        type: 'boolean',
        appliesTo: 'ic',
      },
      {
        id: 'financialAuthority',
        text: 'What is the highest level of financial signing authority?',
        helpText: 'This is about the ROLE\'S budget authority, not the person\'s financial acumen. What is the maximum budget this position can approve?',
        type: 'dropdown',
        appliesTo: 'both',
        options: [
          { label: 'None', points: 0 },
          { label: 'Up to $100K', points: 5 },
          { label: '$100K – $1M', points: 20 },
          { label: '$1M – $10M', points: 40 },
          { label: '$10M+', points: 50 },
        ],
      },
    ],
    factorWeightings: [
      { factorId: 'jobFunctionalKnowledge', icWeight: 1.4, managerWeight: 0.8 },
      { factorId: 'businessExpertise', icWeight: 0.8, managerWeight: 1.4 },
      { factorId: 'leadership', icWeight: 0.5, managerWeight: 1.6 },
      { factorId: 'problemSolving', icWeight: 1.3, managerWeight: 1.0 },
      { factorId: 'natureOfImpact', icWeight: 1.0, managerWeight: 1.2 },
      { factorId: 'areaOfImpact', icWeight: 1.0, managerWeight: 1.3 },
      { factorId: 'interpersonalSkills', icWeight: 0.8, managerWeight: 1.3 },
    ],
    factorLevels: DEFAULT_FACTOR_LEVELS,
  };
}

// ─── JSON Export ─────────────────────────────────────────────────────

/** Serializes the full project state to a JSON string. */
export function exportProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

/** Triggers a file download of the project JSON. */
export function downloadProject(project: Project, filename?: string): void {
  const json = exportProject(project);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${sanitizeFilename(project.company.name)}_job_grades.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── JSON Import ─────────────────────────────────────────────────────

/**
 * Imports and validates a project from a JSON string.
 * Returns either a valid Project or a ValidationResult with errors.
 */
export function importProject(jsonString: string): Project | ValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { valid: false, errors: ['Invalid JSON: unable to parse file.'] };
  }

  const errors: string[] = [];

  // Check top-level fields
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['Invalid format: expected a JSON object.'] };
  }

  const p = parsed as Record<string, unknown>;

  // Version
  if (!p.version || typeof p.version !== 'string') {
    errors.push('Missing or invalid "version" field.');
  }

  // Company
  if (!p.company || typeof p.company !== 'object') {
    errors.push('Missing "company" object.');
  } else {
    const c = p.company as Record<string, unknown>;
    if (!c.name || typeof c.name !== 'string') errors.push('Company: missing or invalid "name".');
    if (!c.annualRevenue) errors.push('Company: missing "annualRevenue".');
    if (!c.globalHeadcount) errors.push('Company: missing "globalHeadcount".');
    if (!c.geographicFootprint) errors.push('Company: missing "geographicFootprint".');
    if (!c.corporateStructure) errors.push('Company: missing "corporateStructure".');
  }

  // Ceiling
  if (!p.ceiling || typeof p.ceiling !== 'object') {
    errors.push('Missing "ceiling" object.');
  } else {
    const cl = p.ceiling as Record<string, unknown>;
    if (typeof cl.grade !== 'number') errors.push('Ceiling: missing or invalid "grade".');
    if (!cl.gradeLabel || typeof cl.gradeLabel !== 'string') errors.push('Ceiling: missing or invalid "gradeLabel".');
  }

  // Questionnaire
  if (!p.questionnaire || typeof p.questionnaire !== 'object') {
    errors.push('Missing "questionnaire" object.');
  } else {
    const q = p.questionnaire as Record<string, unknown>;
    if (!Array.isArray(q.careerBands)) errors.push('Questionnaire: missing "careerBands" array.');
    if (!Array.isArray(q.factors)) errors.push('Questionnaire: missing "factors" array.');
    if (!Array.isArray(q.gateQuestions)) errors.push('Questionnaire: missing "gateQuestions" array.');
    // factorWeightings, salaryBands, locationMultipliers, jobFamilyMultipliers are optional for backward compatibility
  }

  // Roles
  if (!Array.isArray(p.roles)) {
    errors.push('Missing or invalid "roles" array.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return p as unknown as Project;
}

// ─── CSV Import ──────────────────────────────────────────────────────

/**
 * Parses a CSV string into an array of partial Role objects.
 * Known columns: title, department, location, reportsTo.
 * Unknown columns are silently ignored.
 */
export function parseCSV(csvString: string): Partial<Role>[] {
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);

  const roles: Partial<Role>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every((v) => !v.trim())) continue; // skip empty rows

    const role: Record<string, string> = {};
    headers.forEach((h, idx) => {
      role[h.trim().toLowerCase()] = values[idx] || '';
    });

    const title = (role.title || '').trim();
    if (!title) continue; // skip rows without a title

    roles.push({
      title,
      department: (role.department || '').trim(),
      location: (role.location || '').trim(),
      reportsTo: (role.reportsto || '').trim() || null,
      source: 'csv-import' as RoleSource,
      status: 'ungraded' as const,
    });
  }

  return roles;
}

/** Parses a single CSV line, respecting quoted fields. */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current);
  return fields;
}

// ─── CSV Export ──────────────────────────────────────────────────────

/** Exports roles as a CSV string (title, department, location, grade, points). */
export function exportRolesCSV(roles: Array<{ title: string; department: string; location: string; assignedGrade: number; assignedGradeLabel: string; totalPoints: number }>): string {
  const header = 'title,department,location,grade,gradeLabel,totalPoints';
  const rows = roles.map((r) =>
    `${csvEscape(r.title)},${csvEscape(r.department)},${csvEscape(r.location)},${r.assignedGrade},${csvEscape(r.assignedGradeLabel)},${r.totalPoints}`
  );
  return [header, ...rows].join('\n');
}

/** Triggers a file download of the roles CSV. */
export function downloadRolesCSV(roles: Array<{ title: string; department: string; location: string; assignedGrade: number; assignedGradeLabel: string; totalPoints: number }>, filename?: string): void {
  const csv = exportRolesCSV(roles);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${sanitizeFilename('roles_export')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 50) || 'export';
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─── Default Project Factory ─────────────────────────────────────────

/** Creates a new project with default questionnaire and a CEO placeholder. */
export function createNewProject(companyName: string, company: Company): Project {
  const ceiling = calculateCeiling(company);
  const enterpriseSize = deriveEnterpriseSize(company.globalHeadcount);
  const marketComplexity = deriveMarketComplexity(company.corporateStructure);

  return {
    version: '1.0',
    company,
    ceiling,
    questionnaire: createDefaultQuestionnaire(),
    roles: [
      {
        id: generateId(),
        title: 'Chief Executive Officer',
        department: 'Executive',
        location: '',
        reportsTo: null,
        source: 'manual',
        careerBand: 'band1',
        track: 'manager',
        marketComplexity,
        enterpriseSize,
        bandAssignedManually: true,
        answers: {},
        assignedGrade: ceiling.grade,
        assignedGradeLabel: ceiling.gradeLabel,
        totalPoints: 0,
        status: 'graded',
      },
    ],
    salaryBands: DEFAULT_SALARY_BANDS,
    locationMultipliers: DEFAULT_LOCATION_MULTIPLIERS,
    jobFamilyMultipliers: DEFAULT_JOB_FAMILY_MULTIPLIERS,
  };
}

function generateId(): string {
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
