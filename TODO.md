# TODOs — Execute When Internet Is Available

These tasks require `npm install` and cannot be completed offline.

## Phase 1: Unit Tests (Priority: High)

- [x] **Offline tests written and passing** — 27 tests, 0 failures (Node.js runner)
- [x] **vitest installed and configured** — 35 tests, 0 failures
  - `tests/ScoringEngine.test.ts` — 15 tests (ceiling, labels, scoring, bands, gates)
  - `tests/Serializer.test.ts` — 20 tests (questionnaire, JSON round-trip, CSV parsing/export)
- [x] **Added to package.json**: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`

## Phase 1b: TypeScript in App.svelte (Priority: High)

- [x] **svelte-preprocess installed and configured**
- [x] **`lang="ts"` added** to all Svelte components
- [x] **Type annotations** on all variables, props, and functions
- [x] **Type imports**: `Project`, `Company`, `Role`, `Ceiling`, etc.
- [ ] **Run `svelte-check`** — verify zero errors (may have remaining warnings)
- [ ] **Remove remaining `as Type` casts** (if any)

## Phase 2: Company Setup Screen (Priority: Medium)

- [x] **CompanySetup.svelte** — extracted with all 4 questions, live ceiling preview
- [x] **Sample JSON** (`sample-project.json`) — full system test file with 15 graded roles
- [x] **Sample CSV** (`sample-roles.csv`) — 80 realistic job roles for testing
- [ ] **Add validation feedback** — highlight invalid fields
- [ ] **Add tooltips** explaining each question's purpose

## Phase 3: Bulk Role Import (Priority: Medium)

- [x] **BulkImport.svelte** — extracted with CSV upload, preview table
- [x] **Inline editing** for imported role fields (title, department, location)
- [x] **Delete row** functionality
- [x] **CEO/C-suite auto-assignment** — imported CEO/CXO roles get ceiling grade automatically
- [x] **Department/location dropdowns** — structured lists (24 departments, 26 locations) instead of free text
- [ ] **Add row selection** for batch operations
- [ ] **Add drag-and-drop** CSV file upload zone
- [ ] **Add progress indicator** for large CSV files (1000+ rows)

## Phase 4: Role Grading Form (Priority: High)

- [x] **RoleForm.svelte** — extracted with all 7 factors + 2 gates
- [x] **Live scoring** — grade updates in real-time as user answers
- [x] **Career band assignment** based on selection
- [x] **Hard gate warnings** displayed when applicable
- [x] **Save/cancel** actions
- [x] **Handle editing existing roles** (pre-fill form, show current vs. new grade)

## Phase 5: Review Panel (Priority: Medium)

- [x] **ReviewPanel.svelte** — extracted with grade distribution, role list
- [x] **CompareView.svelte** — extracted with side-by-side factor comparison
- [x] **Bar chart** for grade distribution (CSS-based, no external libs)
- [x] **Expandable role list** with grade badges
- [x] **Side-by-side comparison** table (factor-by-factor)
- [x] **Export JSON/CSV** buttons
- [x] **Import JSON** with validation error display

## Phase 6: Navigation + Polish + Deploy (Priority: Medium)

- [x] **StepNav.svelte** — extracted reusable navigation component
- [x] **Accessibility** — ARIA labels, keyboard navigation, form labels
- [x] **Responsive design** — mobile-friendly layouts
- [x] **Favicon** (SVG) and meta tags for social sharing
- [x] **gh-pages installed** — ready for deployment
- [ ] **Configure GitHub Pages CI/CD** via GitHub Actions
  - [ ] Create `.github/workflows/deploy.yml`
  - [ ] Test deployment to GitHub Pages
- [ ] **Add custom domain** support (if needed)

## Infrastructure

- [ ] **Add .npmrc** with registry and proxy settings (for when behind proxy)
- [x] **`.gitignore`** — node_modules, dist, .svelte-kit, IDE files, OS files
- [x] **`README.md`** — setup instructions, project structure, deploy guide
- [ ] **`CHANGELOG.md`** template
