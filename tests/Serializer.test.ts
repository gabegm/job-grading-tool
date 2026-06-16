import { describe, it, expect } from 'vitest';
import {
  createDefaultQuestionnaire,
  exportProject,
  importProject,
  parseCSV,
  exportRolesCSV,
  createNewProject,
} from '../src/lib/serializers/Serializer';
import type { Project, Company } from '../../src/lib/types';

// ─── createDefaultQuestionnaire tests ──────────────────────────────

describe('createDefaultQuestionnaire', () => {
  it('returns a valid questionnaire', () => {
    const q = createDefaultQuestionnaire();
    expect(q).toBeTruthy();
    expect(Array.isArray(q.careerBands)).toBe(true);
    expect(Array.isArray(q.factors)).toBe(true);
    expect(Array.isArray(q.gateQuestions)).toBe(true);
  });

  it('has 3 career bands', () => {
    const q = createDefaultQuestionnaire();
    expect(q.careerBands.length).toBe(3);
  });

  it('has 7 factors', () => {
    const q = createDefaultQuestionnaire();
    expect(q.factors.length).toBe(7);
  });

  it('has 3 gate questions (managesTeam, decisionAutonomy, financialAuthority)', () => {
    const q = createDefaultQuestionnaire();
    expect(q.gateQuestions.length).toBe(3);
  });

  it('has 7 factor weightings (one per factor)', () => {
    const q = createDefaultQuestionnaire();
    expect(q.factorWeightings.length).toBe(7);
  });

  it('factor weightings have IC and Manager weights', () => {
    const q = createDefaultQuestionnaire();
    for (const w of q.factorWeightings) {
      expect(typeof w.icWeight).toBe('number');
      expect(typeof w.managerWeight).toBe('number');
      expect(w.icWeight).toBeGreaterThanOrEqual(0.5);
      expect(w.managerWeight).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('factor weightings favor different factors per track', () => {
    const q = createDefaultQuestionnaire();
    // Leadership should be weighted more for managers
    const leadershipWeight = q.factorWeightings.find(w => w.factorId === 'leadership');
    expect(leadershipWeight).toBeTruthy();
    expect(leadershipWeight!.managerWeight).toBeGreaterThan(leadershipWeight!.icWeight);

    // Job Functional Knowledge should be weighted more for ICs
    const knowledgeWeight = q.factorWeightings.find(w => w.factorId === 'jobFunctionalKnowledge');
    expect(knowledgeWeight).toBeTruthy();
    expect(knowledgeWeight!.icWeight).toBeGreaterThan(knowledgeWeight!.managerWeight);
  });

  it('each factor has questions with options', () => {
    const q = createDefaultQuestionnaire();
    for (const factor of q.factors) {
      expect(factor.questions.length).toBeGreaterThan(0);
      for (const question of factor.questions) {
        expect(question.options.length).toBeGreaterThan(0);
        for (const option of question.options) {
          expect(option.points).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

// ─── JSON Export/Import tests ──────────────────────────────────────

describe('JSON Export/Import', () => {
  it('exports valid JSON string', () => {
    const project = createNewProject('Test Corp', {
      name: 'Test Corp',
      annualRevenue: 'under10M',
      globalHeadcount: 'under100',
      geographicFootprint: 'singleCountry',
      corporateStructure: 'singleBusiness',
    });
    const json = exportProject(project);
    expect(typeof json).toBe('string');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('round-trips a project through export/import', () => {
    const original = createNewProject('Test Corp', {
      name: 'Test Corp',
      annualRevenue: '50to250M',
      globalHeadcount: '501to2500',
      geographicFootprint: 'regional',
      corporateStructure: 'multiBusiness',
    });

    const json = exportProject(original);
    const result = importProject(json);

    expect('valid' in result ? result.valid : true).toBe(true);
    const imported = result as Project;
    expect(imported.company.name).toBe('Test Corp');
    expect(imported.ceiling.grade).toBe(original.ceiling.grade);
    expect(imported.roles.length).toBe(1);
    expect(imported.roles[0].title).toBe('Chief Executive Officer');
  });

  it('rejects invalid JSON', () => {
    const result = importProject('not valid json');
    expect('valid' in result).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects JSON missing required fields', () => {
    const result = importProject(JSON.stringify({}));
    expect('valid' in result).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects JSON missing company', () => {
    const result = importProject(JSON.stringify({
      version: '1.0',
      ceiling: { grade: 10, gradeLabel: 'Manager' },
      questionnaire: { careerBands: [], factors: [], gateQuestions: [] },
      roles: [],
    }));
    expect('valid' in result).toBe(true);
    expect(result.valid).toBe(false);
  });
});

// ─── CSV Import tests ──────────────────────────────────────────────

describe('CSV Import', () => {
  it('parses a simple CSV', () => {
    const csv = `title,department,location,reportsTo
"Chief Executive Officer","Executive","New York",""
"Director of Engineering","Engineering","San Francisco","CEO"
"Marketing Manager","Marketing","London","Director of Marketing"`;

    const roles = parseCSV(csv);
    expect(roles.length).toBe(3);
    expect(roles[0].title).toBe('Chief Executive Officer');
    expect(roles[1].title).toBe('Director of Engineering');
    expect(roles[2].department).toBe('Marketing');
  });

  it('skips empty rows', () => {
    const csv = `title,department
"Engineer","Engineering"

"Manager","Management"

`;
    const roles = parseCSV(csv);
    expect(roles.length).toBe(2);
  });

  it('handles missing columns gracefully', () => {
    const csv = `title,department
"Engineer","Engineering"
"Manager"
`;
    const roles = parseCSV(csv);
    expect(roles.length).toBe(2);
    expect(roles[1].department).toBe('');
  });

  it('skips rows without a title', () => {
    const csv = `title,department
"Engineer","Engineering"
,"Marketing"
`;
    const roles = parseCSV(csv);
    expect(roles.length).toBe(1);
  });

  it('handles quoted fields with commas', () => {
    const csv = `title,department
"Vice President, Engineering","Engineering"
"Director, Sales & Marketing","Sales"`;
    const roles = parseCSV(csv);
    expect(roles.length).toBe(2);
    expect(roles[0].title).toBe('Vice President, Engineering');
    expect(roles[1].title).toBe('Director, Sales & Marketing');
  });

  it('handles CSV with extra columns', () => {
    const csv = `title,department,location,reportsTo,employeeId
"Engineer","Engineering","NYC","Manager","E001"
"Manager","Management","LA","","M001"`;
    const roles = parseCSV(csv);
    expect(roles.length).toBe(2);
    expect(roles[0].title).toBe('Engineer');
  });
});

// ─── CSV Export tests ──────────────────────────────────────────────

describe('CSV Export', () => {
  it('exports roles as valid CSV', () => {
    const roles = [
      { title: 'CEO', department: 'Executive', location: 'NYC', assignedGrade: 18, assignedGradeLabel: 'Corporate Officer', totalPoints: 340 },
      { title: 'Engineer', department: 'Engineering', location: 'SF', assignedGrade: 8, assignedGradeLabel: 'Director', totalPoints: 180 },
    ];
    const csv = exportRolesCSV(roles);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('title,department,location,grade,gradeLabel,totalPoints');
    expect(lines.length).toBe(3); // header + 2 roles
  });

  it('escapes commas in values', () => {
    const roles = [
      { title: 'VP, Engineering', department: 'Engineering', location: 'NYC', assignedGrade: 12, assignedGradeLabel: 'Executive Vice President', totalPoints: 280 },
    ];
    const csv = exportRolesCSV(roles);
    expect(csv).toContain('"VP, Engineering"');
  });
});

// ─── createNewProject tests ────────────────────────────────────────

describe('createNewProject', () => {
  it('creates a project with CEO role', () => {
    const company: Company = {
      name: 'Test Corp',
      annualRevenue: 'under10M',
      globalHeadcount: 'under100',
      geographicFootprint: 'singleCountry',
      corporateStructure: 'singleBusiness',
    };
    const project = createNewProject('Test Corp', company);
    expect(project.version).toBe('1.0');
    expect(project.company.name).toBe('Test Corp');
    expect(project.roles.length).toBe(1);
    expect(project.roles[0].title).toBe('Chief Executive Officer');
    expect(project.roles[0].status).toBe('graded');
  });

  it('CEO gets the company ceiling grade', () => {
    const highCompany: Company = {
      name: 'Mega Corp',
      annualRevenue: 'over1B',
      globalHeadcount: 'over10000',
      geographicFootprint: 'global',
      corporateStructure: 'holdingCompany',
    };
    const project = createNewProject('Mega Corp', highCompany);
    expect(project.roles[0].assignedGrade).toBe(project.ceiling.grade);
    expect(project.roles[0].assignedGradeLabel).toBe(project.ceiling.gradeLabel);
  });
});

// ─── Factor Levels Integration Tests ────────────────────────────────

describe('createDefaultQuestionnaire with factor levels', () => {
  it('includes factorLevels array', () => {
    const q = createDefaultQuestionnaire();
    expect(q.factorLevels).toBeDefined();
    expect(q.factorLevels).toHaveLength(63); // 7 factors × 3 levels × 3 bands
  });

  it('factor levels cover all 3 bands', () => {
    const q = createDefaultQuestionnaire();
    const bandIds = new Set(q.factorLevels!.map(fl => fl.bandId));
    expect(bandIds).toContain('band1');
    expect(bandIds).toContain('band2');
    expect(bandIds).toContain('band3');
  });

  it('factor levels include all 7 factors (FK, BE, LS, PS, NI, AI, IS)', () => {
    const q = createDefaultQuestionnaire();
    const factorIds = new Set(q.factorLevels!.map(fl => fl.id.slice(0, 2)));
    expect(factorIds).toContain('FK');
    expect(factorIds).toContain('BE');
    expect(factorIds).toContain('LS');
    expect(factorIds).toContain('PS');
    expect(factorIds).toContain('NI');
    expect(factorIds).toContain('AI');
    expect(factorIds).toContain('IS');
  });
});

describe('createNewProject with banding fields', () => {
  it('includes marketComplexity and enterpriseSize on CEO role', () => {
    const project = createNewProject('Test Corp', {
      name: 'Test Corp',
      annualRevenue: '250to1B',
      globalHeadcount: '2501to10000',
      geographicFootprint: 'regional',
      corporateStructure: 'multiBusiness',
    });
    const ceo = project.roles[0];
    expect(ceo.marketComplexity).toBe('complex');
    expect(ceo.enterpriseSize).toBe('large');
    expect(ceo.bandAssignedManually).toBe(true);
  });

  it('derives homogeneous + small for single business, under 2500 employees', () => {
    const project = createNewProject('Small Corp', {
      name: 'Small Corp',
      annualRevenue: 'under10M',
      globalHeadcount: 'under100',
      geographicFootprint: 'singleCountry',
      corporateStructure: 'singleBusiness',
    });
    const ceo = project.roles[0];
    expect(ceo.marketComplexity).toBe('homogeneous');
    expect(ceo.enterpriseSize).toBe('small');
  });
});
