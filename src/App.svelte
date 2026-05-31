<script lang="ts">
  import CompanySetup from './lib/components/CompanySetup.svelte';
  import BulkImport from './lib/components/BulkImport.svelte';
  import RoleForm from './lib/components/RoleForm.svelte';
  import ReviewPanel from './lib/components/ReviewPanel.svelte';
  import CompareView from './lib/components/CompareView.svelte';
  import StepNav from './lib/components/StepNav.svelte';
  import {
    createNewProject,
    downloadProject,
    importProject,
    exportRolesCSV,
    downloadRolesCSV,
    parseCSV,
  } from './lib/serializers/Serializer';
  import type { Project, Company, Role } from './lib/types';

  // ─── State ───────────────────────────────────────────────────────

  let project: Project | null = null;
  let currentStep = 0; // 0=setup, 1=import, 2=grade, 3=review

  // Company setup form
  let companyName = '';
  let annualRevenue: Company['annualRevenue'] = 'under10M';
  let globalHeadcount: Company['globalHeadcount'] = 'under100';
  let geographicFootprint: Company['geographicFootprint'] = 'singleCountry';
  let corporateStructure: Company['corporateStructure'] = 'singleBusiness';

  // File input refs
  let jsonFileInput: HTMLInputElement | null = null;
  let csvFileInput: HTMLInputElement | null = null;

  // Grading state
  let gradingRole: Role | null = null;
  let showRoleForm = false;

  // Compare state
  let compareRoleA: Role | null = null;
  let compareRoleB: Role | null = null;
  let showCompare = false;
  let compareRoles: Role[] = [];

  // ─── Computed ────────────────────────────────────────────────────

  $: company =
    companyName &&
    annualRevenue &&
    globalHeadcount &&
    geographicFootprint &&
    corporateStructure
      ? {
          name: companyName,
          annualRevenue,
          globalHeadcount,
          geographicFootprint,
          corporateStructure,
        }
      : null;

  $: ungradedRoles = project ? project.roles.filter((r) => r.status === 'ungraded') : [];
  $: gradedRoles = project ? project.roles.filter((r) => r.status === 'graded') : [];

  // ─── Handlers ────────────────────────────────────────────────────

  function handleSaveCompany(formCompany: Company) {
    project = createNewProject(formCompany.name, formCompany);
    currentStep = 1;
  }

  function handleImportJSON(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const result = importProject(reader.result);

      if ('valid' in result && !result.valid) {
        alert('Import failed: ' + result.errors.join('\n'));
        return;
      }

      project = result as Project;
      currentStep = 3;
    };
    reader.readAsText(file);

    if (jsonFileInput) {
      jsonFileInput.value = '';
    }
  }

  function handleImportCSV(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const roles = parseCSV(reader.result);

      if (!project) return;

      const currentProject = project;

      // Group roles by title to avoid duplicates
      const groupedByTitle: Record<string, typeof roles> = {};
      for (const r of roles) {
        const title = (r.title || '').trim();
        if (!title) continue;
        if (!groupedByTitle[title]) groupedByTitle[title] = [];
        groupedByTitle[title].push(r);
      }

      const newRoles = Object.entries(groupedByTitle).map(([title, group]) => {
        const primary = group[0];
        const locations = [...new Set(group.map(g => g.location).filter(Boolean))];
        const titleLower = title.toLowerCase();
        const isCEO = titleLower === 'ceo' || titleLower === 'chief executive officer';
        const reportsToEmpty = !primary.reportsTo || primary.reportsTo.trim() === '';

        if (isCEO && reportsToEmpty) {
          // Only CEO (reports to no one) is locked at ceiling grade
          return {
            id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title,
            department: primary.department || '',
            location: locations.join(', ') || '',
            locations: locations.length > 1 ? locations : null,
            reportsTo: primary.reportsTo,
            source: 'csv-import' as const,
            careerBand: 'band1',
            answers: {},
            assignedGrade: currentProject.ceiling.grade,
            assignedGradeLabel: currentProject.ceiling.gradeLabel,
            totalPoints: 0,
            status: 'graded' as const,
            locked: true,
          };
        }

        return {
          id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          department: primary.department || '',
          location: locations.join(', ') || '',
          locations: locations.length > 1 ? locations : null,
          reportsTo: primary.reportsTo,
          source: 'csv-import' as const,
          careerBand: '',
          answers: {},
          assignedGrade: 0,
          assignedGradeLabel: '',
          totalPoints: 0,
          status: 'ungraded' as const,
        };
      });

      project = {
        ...currentProject,
        roles: [...currentProject.roles, ...newRoles] as Role[],
      };
    };
    reader.readAsText(file);

    if (csvFileInput) {
      csvFileInput.value = '';
    }
  }

  function handleExportJSON() {
    if (!project) return;
    downloadProject(project, `${project.company.name}_job_grades.json`);
  }

  function handleExportCSV() {
    if (!project) return;
    const roles = project.roles.map((r) => ({
      title: r.title,
      department: r.department,
      location: r.location,
      assignedGrade: r.assignedGrade,
      assignedGradeLabel: r.assignedGradeLabel,
      totalPoints: r.totalPoints,
    }));
    downloadRolesCSV(roles, `${project.company.name}_roles.csv`);
  }

  function resetProject() {
    project = null;
    currentStep = 0;
    companyName = '';
  }

  function gradeRole(role: Role) {
    if (role?.locked) {
      alert('This role is locked at the company ceiling grade and cannot be edited.');
      return;
    }
    gradingRole = role || null;
    showRoleForm = true;
  }

  function handleRoleSaved(savedRole: Role) {
    if (!project) return;

    const idx = project.roles.findIndex(r => r.id === savedRole.id);
    if (idx >= 0) {
      project = {
        ...project,
        roles: project.roles.map(r => r.id === savedRole.id ? savedRole : r),
      };
    } else {
      project = {
        ...project,
        roles: [...project.roles, savedRole],
      };
    }

    showRoleForm = false;
    gradingRole = null;
  }

  function handleImportedRoles(newRoles: Role[]) {
    if (!project) return;
    project = {
      ...project,
      roles: [...project.roles, ...newRoles],
    };
  }

  function handleExportFromReview() {
    handleExportJSON();
  }

  function handleExportCSVFromReview() {
    handleExportCSV();
  }

  function handleCompare(roles: Role[]) {
    if (roles.length < 2) return;
    compareRoles = roles;
    compareRoleA = roles[0];
    compareRoleB = roles[1];
    showCompare = true;
  }

  function handleImportJSONFromReview(event: Event) {
    handleImportJSON(event);
  }

  function handleImportJSONFromSetup(event: Event) {
    handleImportJSON(event);
  }

  // ─── Step Navigation ─────────────────────────────────────────────

  const steps = [
    { label: 'Company Setup', icon: '🏢' },
    { label: 'Import Roles', icon: '📥' },
    { label: 'Grade Roles', icon: '📝' },
    { label: 'Review', icon: '📊' },
  ];

  function goToStep(step: number) {
    if (step === 1 && !project) return;
    currentStep = step;
  }

  function canGoToStep(step: number) {
    if (step === 0) return true;
    if (step === 1) return !!project;
    if (step === 2) return !!project && ungradedRoles.length > 0;
    if (step === 3) return !!project;
    return false;
  }
</script>

<svelte:head>
  <title>Job Grading Tool</title>
  <meta name="description" content="Internal job role grading tool using the Point-Factor Method" />
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg)]">
  <!-- Header -->
  <header class="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
    <div class="mx-auto max-w-6xl px-4 py-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚖️</span>
          <div>
            <h1 class="text-xl font-bold text-[var(--color-text)]">Job Grading Tool</h1>
            <p class="text-sm text-[var(--color-text-muted)]">
              {project ? project.company.name : 'New Project'}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          {#if project}
            <button class="btn-secondary" on:click={handleExportJSON}>Export JSON</button>
            <button class="btn-secondary" on:click={handleExportCSV}>Export CSV</button>
            <input type="file" accept=".json" class="hidden" bind:this={jsonFileInput} on:change={handleImportJSON} />
            <button class="btn-secondary" on:click={() => jsonFileInput?.click()}>Import JSON</button>
            <input type="file" accept=".csv" class="hidden" bind:this={csvFileInput} on:change={handleImportCSV} />
            <button class="btn-secondary" on:click={() => csvFileInput?.click()}>Import CSV</button>
            <button class="btn-secondary text-red-500" on:click={resetProject}>New Project</button>
          {:else}
            <input type="file" accept=".json" class="hidden" bind:this={jsonFileInput} on:change={handleImportJSONFromSetup} />
            <button class="btn-secondary" on:click={() => jsonFileInput?.click()}>Import JSON</button>
          {/if}
        </div>
      </div>
    </div>
  </header>

  <!-- Step Navigation -->
  {#if project}
    <StepNav
      {currentStep}
      {steps}
      onGoToStep={goToStep}
    />
  {/if}

  <!-- Main Content -->
  <main class="mx-auto max-w-6xl px-4 py-8">
    {#if !project}
      <!-- Step 0: Company Setup -->
      <div class="mx-auto max-w-2xl">
        <CompanySetup
          {company}
          onSave={handleSaveCompany}
        />
        <div class="mt-6 flex justify-center">
          <input type="file" accept=".json" class="hidden" bind:this={jsonFileInput} on:change={handleImportJSONFromSetup} />
          <button class="btn-secondary" on:click={() => jsonFileInput?.click()}>Import JSON Project</button>
        </div>
      </div>
    {:else}
      <!-- Step 1: Import Roles -->
      {#if currentStep === 1}
        <div class="mx-auto max-w-3xl">
          <BulkImport
            roles={project.roles}
            onImport={handleImportedRoles}
          />
          <div class="mt-6 flex gap-3">
            <button class="btn-primary" on:click={() => goToStep(2)}>
              Continue to Grading →
            </button>
          </div>
        </div>
      {/if}

      <!-- Step 2: Grade Roles -->
      {#if currentStep === 2}
        <div class="mx-auto max-w-3xl">
          <div class="card">
            <h2 class="section-title">Grade Roles</h2>

            {#if ungradedRoles.length === 0}
              <p class="text-center py-8 text-[var(--color-text-muted)]">
                All roles are graded! 🎉
              </p>
            {:else}
              <div class="space-y-3">
                {#each ungradedRoles as role}
                  <div class="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
                    <div>
                      <p class="font-medium">{role.title}</p>
                      <p class="text-sm text-[var(--color-text-muted)]">{role.department}</p>
                    </div>
                    <button class="btn-primary text-sm" on:click={() => gradeRole(role)}>Grade This Role</button>
                  </div>
                {/each}
              </div>
            {/if}

            <div class="mt-6 flex gap-3">
              <button class="btn-secondary" on:click={() => goToStep(1)}>← Back</button>
              <button class="btn-primary" on:click={() => goToStep(3)}>
                Review All Roles ({gradedRoles.length})
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Step 3: Review -->
      {#if currentStep === 3}
        <div class="mx-auto max-w-4xl">
          <ReviewPanel
            project={project}
            onGrade={gradeRole}
            onEdit={gradeRole}
            onExportJSON={handleExportFromReview}
            onExportCSV={handleExportCSVFromReview}
            onImportJSON={handleImportJSONFromReview}
            onCompare={handleCompare}
          />
        </div>
      {/if}
    {/if}
  </main>

  <!-- Role Form Modal -->
  {#if showRoleForm}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Grade role"
      tabindex="-1"
      on:keydown={(e) => { if (e.key === 'Escape') { showRoleForm = false; gradingRole = null; } }}
      on:click={() => { showRoleForm = false; gradingRole = null; }}
    >
      <div
        class="bg-[var(--color-surface)] rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        on:click={(e) => e.stopPropagation()}
      >
        <RoleForm
          companyCeiling={project?.ceiling || { grade: 10, gradeLabel: 'Manager' }}
          {gradingRole}
          onSave={handleRoleSaved}
          onCancel={() => { showRoleForm = false; gradingRole = null; }}
        />
      </div>
    </div>
  {/if}

  <!-- Compare View Modal -->
  {#if showCompare && compareRoles.length >= 2}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Compare roles"
      tabindex="-1"
      on:keydown={(e) => { if (e.key === 'Escape') { showCompare = false; compareRoles = []; } }}
      on:click={() => { showCompare = false; compareRoles = []; }}
    >
      <CompareView
        roles={compareRoles}
        onClose={() => { showCompare = false; compareRoles = []; }}
      />
    </div>
  {/if}

  <!-- Footer -->
  <footer class="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
    Job Grading Tool · Point-Factor Method · Pure Frontend · No Data Leaves Your Browser
  </footer>
</div>
