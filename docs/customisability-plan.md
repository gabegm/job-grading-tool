# Customisability Improvement Plan

## Problem Statement

Currently, to customize the grading tool beyond the 4 company setup questions, users must:
1. Export the project as JSON
2. Edit the JSON by hand
3. Re-import the project

This is error-prone, intimidating for non-technical users, and makes the tool feel "locked" after initial setup.

## Goal

Provide a **Settings / Configuration** area in the UI where users can edit all grading parameters with the same ease as they grade roles — using forms, radio buttons, and sliders, not raw JSON.

---

## Current State

### What already has a good UI
| Area | Component | Quality |
|------|-----------|---------|
| Company setup (4 questions) | `CompanySetup.svelte` | ✅ Excellent — radio cards with descriptions |
| Grading roles (7 factors + gates) | `RoleForm.svelte` | ✅ Excellent — radio cards with point values |
| Salary estimation | Built into `RoleForm.svelte` | ✅ Works automatically |

### What has NO UI (JSON-only)
| Area | Where it lives | What users can't do |
|------|---------------|-------------------|
| **Factors & Questions** | `Serializer.ts` → `createDefaultQuestionnaire()` | Edit factor names, add/remove factors, edit question text, change answer options or point values |
| **Factor Weightings** | `ScoringEngine.ts` → `DEFAULT_FACTOR_WEIGHTINGS` + `Serializer.ts` | Change how much each factor matters for IC vs Manager |
| **Career Bands** | `Serializer.ts` → `createDefaultQuestionnaire()` | Rename bands, change grade ranges, add new bands |
| **Salary Bands** | `SalaryEngine.ts` → `DEFAULT_SALARY_BANDS` | Edit min/mid/max for any grade, add new grades |
| **Location Multipliers** | `SalaryEngine.ts` → `DEFAULT_LOCATION_MULTIPLIERS` | Add/remove cities, change cost-of-living indices |
| **Job Family Multipliers** | `SalaryEngine.ts` → `DEFAULT_JOB_FAMILY_MULTIPLIERS` | Add/remove families, change market adjustments, add grades |
| **Gate Questions** | `Serializer.ts` → `createDefaultQuestionnaire()` | Edit gate criteria, add new gates |

---

## Proposed Architecture

```
App.svelte
├── CompanySetup.svelte          (existing — no changes)
├── BulkImport.svelte            (existing — no changes)
├── RoleForm.svelte              (existing — no changes)
├── ReviewPanel.svelte           (existing — no changes)
├── CompareView.svelte           (existing — no changes)
├── StepNav.svelte               (existing — add "Settings" tab)
└── NEW: SettingsPanel.svelte    ← new component
    ├── QuestionnaireEditor.svelte  ← edit factors, questions, options
    ├── WeightingEditor.svelte      ← edit factor weightings
    ├── BandEditor.svelte           ← edit career bands
    ├── SalaryConfig.svelte         ← edit salary bands, location, job family multipliers
    └── GateEditor.svelte           ← edit gate questions
```

### Navigation change
Add a 5th step to `StepNav`: **"Settings"** (gear icon ⚙️).
This step is always accessible (no prerequisites) and shows a tabbed interface:

```
Settings
├── Factors & Questions  (edit the 7 evaluation factors)
├── Weightings           (IC vs Manager factor weights)
├── Career Bands         (band names and grade ranges)
├── Salary Configuration  (salary bands, location, job family)
└── Gate Questions       (gate criteria)
```

---

## Detailed Component Specs

### 1. QuestionnaireEditor.svelte

**Purpose:** Edit the 7 evaluation factors, their questions, and answer options.

**UI Design:**
- List of 7 factor cards (collapsible)
- Each factor card shows:
  - Factor name (editable text input)
  - Help text (editable text area)
  - Max points (editable number, default 50)
  - **Questions sub-list** — each question:
    - Question text (editable)
    - Help text (editable)
    - **Answer options** — each option:
      - Label (editable text input)
      - Points (editable number)
      - Delete button (with confirmation)
  - "Add Question" button
  - "Add Answer Option" button (per question)
  - "Reorder" drag handles (optional, v2)

**Data flow:**
- Reads `project.questionnaire.factors`
- Writes back to `project.questionnaire.factors`
- On save, re-runs `scoreRole()` for all ungraded roles to update their grades

**Validation:**
- Each factor must have at least 1 question
- Each question must have at least 2 answer options
- Points must be non-negative integers
- No duplicate question IDs within a factor

---

### 2. WeightingEditor.svelte

**Purpose:** Edit how much each factor matters for IC vs Manager tracks.

**UI Design:**
- Table with 7 rows (one per factor)
- Columns: Factor Name | IC Weight | Manager Weight | Visual Bar
- Each weight is a **slider** (0.0 – 2.0) with a number input
- Visual bar shows the ratio: IC bar vs Manager bar side-by-side
- "Reset to Defaults" button
- "Lock All" toggle (prevents accidental changes)

**Example row:**
```
Job Functional Knowledge  [████████░░] 1.4  |  [██░░░░░░] 0.8
```

**Data flow:**
- Reads `project.questionnaire.factorWeightings`
- Writes back to `project.questionnaire.factorWeightings`
- On save, re-runs `scoreRole()` for all ungraded roles

**Validation:**
- Weights must be between 0.0 and 2.0
- At least one factor must have different IC/Manager weights (warn if all equal)

---

### 3. BandEditor.svelte

**Purpose:** Edit career band names, grade ranges, and descriptions.

**UI Design:**
- List of band cards (default: 3 bands)
- Each band:
  - Band ID (editable, e.g., "band1")
  - Label (editable, e.g., "C-Suite / Board")
  - Grade range (two number inputs: min–max)
  - Description (editable text area)
  - Delete button (minimum 1 band required)
  - "Add Band" button

**Example:**
```
┌─────────────────────────────────────────┐
│ Band ID:  [band1        ]               │
│ Label:    [C-Suite / Board              ] │
│ Grade:    [13] to [25]                  │
│ Desc:     [CEO, CFO, CTO, and other    │
│            C-suite roles]               │
│ [Delete] [Save]                         │
└─────────────────────────────────────────┘
```

**Data flow:**
- Reads `project.questionnaire.careerBands`
- Writes back to `project.questionnaire.careerBands`
- On save, re-runs `scoreRole()` for all ungraded roles

**Validation:**
- Grade ranges must be valid (min ≤ max)
- Grade ranges must not overlap (warn if they do)
- Must have at least 1 band

---

### 4. SalaryConfig.svelte

**Purpose:** Edit salary bands, location multipliers, and job family multipliers.

**UI Design:**
- Three sub-tabs: **Salary Bands** | **Locations** | **Job Families**

#### Salary Bands sub-tab
- Table: Grade | Min | Mid | Max | Currency
- Each cell is an editable number input
- "Add Grade" button (adds a new row)
- "Reset to Defaults" button
- Currency selector (default: USD)

#### Locations sub-tab
- Table: Country | City | Cost of Living Index
- Each cell is editable (country/city are text, index is 0.0–2.0)
- "Add Location" button
- "Reset to Defaults" button
- Visual indicator: cities above SF (1.0) in green, below in orange

#### Job Families sub-tab
- Table: Family | Grade | Market Adjustment
- Each cell is editable (family is dropdown, grade is number, adjustment is 0.0–2.0)
- "Add Family" button
- "Reset to Defaults" button
- Visual indicator: above 1.0 in green (in-demand), below in orange (saturated)

**Data flow:**
- Reads `project.salaryBands`, `project.locationMultipliers`, `project.jobFamilyMultipliers`
- Writes back to the same
- On save, recalculates salary estimates for all graded roles

---

### 5. GateEditor.svelte

**Purpose:** Edit gate questions (criteria that prevent high grades without authority).

**UI Design:**
- List of gate question cards
- Each gate:
  - Question text (editable)
  - Help text (editable)
  - Type selector (boolean / dropdown)
  - Applies to selector (IC / Manager / Both)
  - If dropdown: list of answer options (label + points), each editable
  - Delete button (minimum 1 gate required)
  - "Add Gate" button

**Data flow:**
- Reads `project.questionnaire.gateQuestions`
- Writes back to `project.questionnaire.gateQuestions`
- On save, re-runs `scoreRole()` for all ungraded roles

---

## Implementation Phases

### Phase 1: Core Settings UI (MVP)
**Estimated effort: 2–3 days**

1. Add "Settings" tab to `StepNav.svelte`
2. Create `SettingsPanel.svelte` with tabbed navigation
3. Implement `WeightingEditor.svelte` (simplest — just numbers)
4. Implement `BandEditor.svelte` (moderate — name + range editing)
5. Wire up save handlers to update `project.questionnaire`

**Deliverable:** Users can edit factor weightings and career bands from the UI.

### Phase 2: Questionnaire Editor
**Estimated effort: 3–4 days**

6. Implement `QuestionnaireEditor.svelte` (most complex — nested data)
7. Add add/delete/reorder for factors, questions, and answer options
8. Wire up save to update `project.questionnaire.factors`
9. Re-grade all ungraded roles when questionnaire changes

**Deliverable:** Users can fully customize the 7 evaluation factors, questions, and answer options.

### Phase 3: Salary Configuration
**Estimated effort: 2–3 days**

10. Implement `SalaryConfig.svelte` with 3 sub-tabs
11. Wire up save to update `project.salaryBands`, `project.locationMultipliers`, `project.jobFamilyMultipliers`
12. Recalculate salary estimates on save

**Deliverable:** Users can customize salary bands, location multipliers, and job family multipliers.

### Phase 4: Gate Editor + Polish
**Estimated effort: 1–2 days**

13. Implement `GateEditor.svelte`
14. Add "Reset to Defaults" for all editors
15. Add confirmation dialogs for destructive actions
16. Add undo/redo (optional, v2)

**Deliverable:** Full customisability from the UI.

---

## Risk & Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Breaking existing projects on import | Medium | Validate questionnaire structure on import; fall back to defaults for missing fields |
| Re-grading all roles on save is slow | Low | Only re-grade ungraded roles; graded roles are locked |
| Users create invalid configurations | Medium | Add validation with clear error messages; prevent save if invalid |
| Overwhelming users with options | Medium | Progressive disclosure: show defaults first, "Advanced" toggle for power users |
| JSON export/import breaks with new fields | Low | Version the project format; migration scripts for old versions |

---

## Future Enhancements (Post-MVP)

1. **Drag-and-drop reordering** of factors, questions, and bands
2. **Custom grade labels** — let users define their own grade-to-title mapping
3. **Multiple salary currencies** — per-currency salary bands
4. **Scenario comparison** — "What if I change the CEO's revenue to $500M?"
5. **Template library** — save/load custom configurations as templates
6. **Bulk edit** — select multiple roles and change their band/track at once
7. **Audit log** — track who changed what and when (for team use)
