<script lang="ts">
  import { parseCSV } from '../serializers/Serializer';
  import { DEPARTMENTS, LOCATIONS } from '../constants';
  import type { Role } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let onImport = (r: Partial<Role>[]) => {};
  export let roles: Role[] = [];

  // ─── State ───────────────────────────────────────────────────────

  let csvContent = '';
  let parsedRoles: Partial<Role>[] = [];
  let showPreview = false;
  let editingRole: number | null = null;
  let editTitle = '';
  let editDepartment = '';
  let editLocation = '';

  // ─── File Input ──────────────────────────────────────────────────

  let fileInput: HTMLInputElement | null = null;

  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        parsedRoles = parseCSV(reader.result);
        showPreview = true;
      }
    };
    reader.readAsText(file);

    if (fileInput) {
      fileInput.value = '';
    }
  }

  function handleConfirmImport() {
    if (parsedRoles.length === 0) return;

    const newRoles = parsedRoles.map((r, idx) => {
      const titleLower = (r.title || '').trim().toLowerCase();
      const isCEO = titleLower === 'ceo' || titleLower === 'chief executive officer';
      const reportsToEmpty = !r.reportsTo || r.reportsTo.trim() === '';

      if (isCEO && reportsToEmpty) {
        // CEO (reports to no one) is locked at ceiling grade
        return {
          ...r,
          id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source: 'csv-import' as const,
          careerBand: 'band1',
          answers: {},
          assignedGrade: 0,
          assignedGradeLabel: '',
          totalPoints: 0,
          status: 'graded' as const,
          locked: true,
        };
      }

      return {
        ...r,
        id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source: 'csv-import' as const,
        careerBand: '',
        answers: {},
        assignedGrade: 0,
        assignedGradeLabel: '',
        totalPoints: 0,
        status: 'ungraded' as const,
      };
    });

    onImport(newRoles);
    parsedRoles = [];
    showPreview = false;
  }

  function handleDeleteRole(idx: number) {
    parsedRoles = parsedRoles.filter((_, i) => i !== idx);
  }

  function handleEditRole(idx: number) {
    editingRole = idx;
    const role = parsedRoles[idx];
    editTitle = role?.title || '';
    editDepartment = role?.department || '';
    editLocation = role?.location || '';
  }

  function handleSaveEdit() {
    if (editingRole === null) return;
    const role = parsedRoles[editingRole];
    if (!role) return;
    role.title = editTitle;
    role.department = editDepartment;
    role.location = editLocation;
    editingRole = null;
  }

  function handleCancelEdit() {
    editingRole = null;
  }
</script>

<div class="mx-auto max-w-3xl">
  <div class="card">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xl">📥</span>
      <h2 class="section-title mb-0">Import Existing Roles</h2>
    </div>
    <p class="text-sm text-[var(--color-text-muted)] mb-6">
      Upload a CSV file containing your company's existing roles. Each row becomes a placeholder that you can grade later.
    </p>

    <!-- File Upload -->
    <div class="space-y-4">
      <label class="btn-secondary cursor-pointer inline-flex items-center gap-2">
        Choose CSV File
        <input type="file" accept=".csv" class="hidden" bind:this={fileInput} on:change={handleFileSelect} />
      </label>

      <div class="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-sm text-[var(--color-text-muted)]">
        Expected columns: <code class="rounded bg-[var(--color-bg)] px-1">title, department, location, reportsTo</code>
      </div>
    </div>

    <!-- Preview / Role List -->
    {#if showPreview && parsedRoles.length > 0}
      <div class="mt-6">
        <h3 class="section-title">
          Preview ({parsedRoles.length} roles)
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--color-border)]">
                <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Title</th>
                <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Department</th>
                <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Location</th>
                <th class="py-2 text-right font-medium text-[var(--color-text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each parsedRoles as role, idx}
                <tr class="border-b border-[var(--color-border)]">
                  {#if editingRole === idx}
                    <td class="py-2">
                      <input type="text" class="input py-1 px-2 text-sm" bind:value={editTitle} />
                    </td>
                    <td class="py-2">
                      <select class="input py-1 px-2 text-sm" bind:value={editDepartment}>
                        <option value="">Select...</option>
                        {#each DEPARTMENTS as dept}
                          <option value={dept}>{dept}</option>
                        {/each}
                      </select>
                    </td>
                    <td class="py-2">
                      <select class="input py-1 px-2 text-sm" bind:value={editLocation}>
                        <option value="">Select...</option>
                        {#each LOCATIONS as loc}
                          <option value={loc}>{loc}</option>
                        {/each}
                      </select>
                    </td>
                    <td class="py-2 text-right">
                      <button class="btn-primary text-xs py-1 px-2" on:click={handleSaveEdit}>Save</button>
                      <button class="btn-secondary text-xs py-1 px-2 ml-1" on:click={handleCancelEdit}>Cancel</button>
                    </td>
                  {:else}
                    <td class="py-2 font-medium">{role.title}</td>
                    <td class="py-2">{role.department}</td>
                    <td class="py-2">
                      {#if role.locations && role.locations.length > 1}
                        {role.locations.join(', ')}
                      {:else}
                        {role.location || '—'}
                      {/if}
                    </td>
                    <td class="py-2 text-right">
                      {#if (role.title || '').trim().toLowerCase() === 'ceo' || (role.title || '').trim().toLowerCase() === 'chief executive officer'}
                        <span class="badge-grade text-xs py-1 px-2">Locked — CEO</span>
                      {:else}
                        <button class="btn-secondary text-xs py-1 px-2 mr-1" on:click={() => handleEditRole(idx)}>Edit</button>
                        <button class="btn-secondary text-xs py-1 px-2 text-red-500" on:click={() => handleDeleteRole(idx)}>Delete</button>
                      {/if}
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex gap-3">
          <button class="btn-primary" on:click={handleConfirmImport}>
            Confirm Import ({parsedRoles.length} roles)
          </button>
          <button class="btn-secondary" on:click={() => { parsedRoles = []; showPreview = false; }}>
            Cancel
          </button>
        </div>
      </div>
    {/if}

    {#if roles && roles.length > 0}
      <div class="mt-6 border-t border-[var(--color-border)] pt-6">
        <h3 class="section-title">
          Imported Roles ({roles.filter(r => r.status === 'ungraded').length} ungraded)
        </h3>
        <div class="space-y-2">
          {#each roles.filter(r => r.status === 'ungraded') as role}
            <div class="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
              <div>
                <p class="font-medium text-sm">{role.title}</p>
                <p class="text-xs text-[var(--color-text-muted)]">{role.department}</p>
              </div>
              <div class="flex gap-2">
                <span class="text-xs text-[var(--color-text-muted)] hidden sm:inline">
                  {role.location || '—'}
                </span>
                <slot name="gradeButton" {role} />
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
