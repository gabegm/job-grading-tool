<script lang="ts">
  import {
    downloadProject,
    downloadRolesCSV,
    importProject,
  } from '../serializers/Serializer';
  import type { Project, Role } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let project: Project | null = null;
  export let onGrade = (r: Role) => {};
  export let onEdit = (r: Role) => {};
  export let onCompare = (roles: Role[]) => {};
  export let onExportJSON = () => {};
  export let onExportCSV = () => {};
  export let onImportJSON = (e: Event) => {};

  // ─── State ───────────────────────────────────────────────────────

  let selectedRoles: string[] = [];
  let showCompare = false;

  // ─── Computed ────────────────────────────────────────────────────

  $: gradedRoles = project ? project.roles.filter((r) => r.status === 'graded') : [];
  $: ungradedRoles = project ? project.roles.filter((r) => r.status === 'ungraded') : [];

  $: gradeDistribution = gradedRoles.reduce((acc, r) => {
    acc[r.assignedGrade] = (acc[r.assignedGrade] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  $: maxCount = 1;
  $: {
    const values = Object.values(gradeDistribution);
    if (values.length > 0) {
      maxCount = Math.max(...values);
    }
  }

  // ─── Handlers ────────────────────────────────────────────────────

  function toggleSelect(roleId: string) {
    if (selectedRoles.includes(roleId)) {
      selectedRoles = selectedRoles.filter(id => id !== roleId);
    } else {
      if (selectedRoles.length < 5) {
        selectedRoles = [...selectedRoles, roleId];
      }
    }
  }

  function handleCompare() {
    if (selectedRoles.length >= 2) {
      const roles = project!.roles.filter(r => selectedRoles.includes(r.id));
      onCompare(roles);
    }
  }

  function handleExportJSON() {
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

      // Replace current project with imported one
      // This would be handled by the parent
      const imported = result as Project;
      alert('Project imported: ' + imported.company.name);
    };
    reader.readAsText(file);

    // Reset file input
    const input = event.target as HTMLInputElement;
    if (input) input.value = '';
  }
</script>

<div class="mx-auto max-w-4xl">
  {#if !project}
    <p class="text-center py-12 text-[var(--color-text-muted)]">
      No company set up yet. Start with Company Setup.
    </p>
  {:else}
    <!-- Ceiling Summary -->
    <div class="mb-6 card">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p class="text-sm text-[var(--color-text-muted)]">Company Ceiling</p>
          <p class="text-2xl font-bold text-[var(--color-primary)]">
            Grade {project.ceiling.grade} — {project.ceiling.gradeLabel}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm text-[var(--color-text-muted)]">Total Roles</p>
          <p class="text-2xl font-bold">{project.roles.length}</p>
          <p class="text-xs text-[var(--color-text-muted)]">
            {gradedRoles.length} graded, {ungradedRoles.length} pending
          </p>
        </div>
      </div>
    </div>

    <!-- Grade Distribution -->
    <div class="card mb-6">
      <h3 class="section-title">Grade Distribution</h3>
      <div class="space-y-2">
        {#if Object.keys(gradeDistribution).length === 0}
          <p class="py-4 text-center text-[var(--color-text-muted)]">No roles graded yet.</p>
        {:else}
          {#each Object.entries(gradeDistribution) as [gradeStr, count]}
            <div class="flex items-center gap-3">
              <span class="w-12 text-sm font-medium text-[var(--color-text)]">G{parseInt(gradeStr)}</span>
              <span class="badge-grade">
                {parseInt(gradeStr)} — {project?.roles.find(r => r.assignedGrade === parseInt(gradeStr))?.assignedGradeLabel || ''}
              </span>
              <div class="progress-bar flex-1">
                <div
                  class="progress-fill"
                  style="width: {(count / maxCount * 100)}%"
                ></div>
              </div>
              <span class="w-8 text-right text-sm text-[var(--color-text-muted)]">{count}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="btn-secondary" on:click={handleExportJSON}>Export JSON</button>
      <button class="btn-secondary" on:click={handleExportCSV}>Export CSV</button>
      <input type="file" accept=".json" class="hidden" id="json-import-input" on:change={handleImportJSON} />
      <label for="json-import-input" class="btn-secondary cursor-pointer">Import JSON</label>
      {#if selectedRoles.length >= 2}
        <button class="btn-primary" on:click={handleCompare}>Compare Selected ({selectedRoles.length})</button>
      {/if}
    </div>

    <!-- All Roles -->
    <div class="card">
      <h3 class="section-title">All Roles ({project.roles.length})</h3>
      <div class="space-y-2">
        {#each project.roles as role}
          <div class="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                class="sr-only"
                checked={selectedRoles.includes(role.id)}
                on:change={() => toggleSelect(role.id)}
                id={`select-${role.id}`}
              />
              <label for={`select-${role.id}`} class="cursor-pointer">
                <span class="h-4 w-4 rounded border border-[var(--color-border)] flex items-center justify-center"
                      class:bg-[var(--color-primary)]={selectedRoles.includes(role.id)}
                      class:border-[var(--color-primary)]={selectedRoles.includes(role.id)}>
                  {#if selectedRoles.includes(role.id)}
                    <span class="text-white text-xs">✓</span>
                  {/if}
                </span>
              </label>
              <span class="badge-grade">G{role.assignedGrade}</span>
              <div>
                <p class="font-medium text-sm">{role.title}</p>
                <p class="text-xs text-[var(--color-text-muted)]">
                  {role.department}
                  {#if role.locations && role.locations.length > 1}
                    · {role.locations.join(', ')}
                  {:else}
                    {role.location ? ' · ' + role.location : ''}
                  {/if}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-[var(--color-text-muted)] hidden sm:inline">
                {role.totalPoints} pts · {role.status}
              </span>
              {#if role.locked}
                <span class="badge-grade text-xs py-1 px-2">Locked — Ceiling</span>
              {:else}
                {#if role.status === 'ungraded'}
                  <button class="btn-primary text-xs py-1 px-2" on:click={() => onGrade(role)}>Grade</button>
                {:else}
                  <button class="btn-secondary text-xs py-1 px-2" on:click={() => onEdit(role)}>Edit</button>
                {/if}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
