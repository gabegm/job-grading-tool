<script lang="ts">
  import type { SalaryBand, LocationMultiplier, JobFamilyMultiplier } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let salaryBands: SalaryBand[] = [];
  export let locationMultipliers: LocationMultiplier[] = [];
  export let jobFamilyMultipliers: JobFamilyMultiplier[] = [];
  export let onChange = (
    sb: SalaryBand[],
    lm: LocationMultiplier[],
    jm: JobFamilyMultiplier[]
  ) => {};

  // ─── State ───────────────────────────────────────────────────────

  let activeTab = 'bands'; // 'bands' | 'locations' | 'families'

  let localBands: SalaryBand[] = [];
  let localLocations: LocationMultiplier[] = [];
  let localFamilies: JobFamilyMultiplier[] = [];

  // ─── Lifecycle ───────────────────────────────────────────────────

  $: {
    localBands = JSON.parse(JSON.stringify(salaryBands));
    localLocations = JSON.parse(JSON.stringify(locationMultipliers));
    localFamilies = JSON.parse(JSON.stringify(jobFamilyMultipliers));
  }

  // ─── Handlers: Salary Bands ──────────────────────────────────────

  function updateBand(index: number, field: 'min' | 'mid' | 'max' | 'currency', value: string | number) {
    localBands = localBands.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
  }

  function addBand() {
    const maxGrade = localBands.reduce((max, b) => Math.max(max, b.grade), 0);
    localBands = [...localBands, {
      grade: maxGrade + 1,
      min: 50000,
      mid: 65000,
      max: 80000,
      currency: 'USD',
    }];
  }

  function removeBand(index: number) {
    localBands = localBands.filter((_, i) => i !== index);
  }

  // ─── Handlers: Locations ─────────────────────────────────────────

  function updateLocation(index: number, field: 'country' | 'city' | 'costOfLivingIndex', value: string | number) {
    localLocations = localLocations.map((l, i) =>
      i === index ? { ...l, [field]: value } : l
    );
  }

  function addLocation() {
    localLocations = [...localLocations, {
      country: 'Other',
      city: 'New City',
      costOfLivingIndex: 0.80,
    }];
  }

  function removeLocation(index: number) {
    localLocations = localLocations.filter((_, i) => i !== index);
  }

  // ─── Handlers: Job Families ──────────────────────────────────────

  const JOB_FAMILIES = [
    'Engineering', 'Product', 'Sales', 'Marketing', 'Human Resources',
    'Finance', 'Customer Support', 'Operations', 'Legal', 'Data Science',
    'Design', 'Customer Success', 'IT', 'Quality Assurance', 'DevOps',
    'Research & Development', 'Business Development', 'Other',
  ];

  function updateFamily(index: number, field: 'family' | 'grade' | 'marketAdjustment', value: string | number) {
    localFamilies = localFamilies.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    );
  }

  function addFamily() {
    localFamilies = [...localFamilies, {
      family: 'Other',
      grade: 8,
      marketAdjustment: 0.95,
    }];
  }

  function removeFamily(index: number) {
    localFamilies = localFamilies.filter((_, i) => i !== index);
  }

  // ─── Save / Reset ────────────────────────────────────────────────

  function handleSave() {
    onChange(localBands, localLocations, localFamilies);
  }

  function handleReset() {
    localBands = JSON.parse(JSON.stringify(salaryBands));
    localLocations = JSON.parse(JSON.stringify(locationMultipliers));
    localFamilies = JSON.parse(JSON.stringify(jobFamilyMultipliers));
  }

  function hasChanges(): boolean {
    return (
      JSON.stringify(salaryBands) !== JSON.stringify(localBands) ||
      JSON.stringify(locationMultipliers) !== JSON.stringify(localLocations) ||
      JSON.stringify(jobFamilyMultipliers) !== JSON.stringify(localFamilies)
    );
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="section-title mb-0">Salary Configuration</h3>
      <p class="text-sm text-[var(--color-text-muted)]">
        Customize salary bands, location cost-of-living multipliers, and job family market adjustments.
      </p>
    </div>
    <div class="flex gap-2">
      <button class="btn-secondary text-xs" on:click={handleReset}>Reset to Defaults</button>
      <button
        class="btn-primary text-xs"
        disabled={!hasChanges()}
        class:opacity-50={!hasChanges()}
        class:cursor-not-allowed={!hasChanges()}
        on:click={handleSave}
      >
        Save Salary Config
      </button>
    </div>
  </div>

  <!-- Guide -->
  <div class="rounded-lg border border-[var(--color-info)] bg-[var(--color-info-bg)] p-4">
    <p class="text-sm font-medium text-[var(--color-info)] mb-2">ℹ️ How salary estimation works</p>
    <div class="text-xs text-[var(--color-text-muted)] space-y-1">
      <p>Salary estimates are calculated as: <code>Base Salary × Location Multiplier × Job Family Multiplier</code>.</p>
      <p><strong>Salary Bands</strong> — Base min/mid/max for each grade (1–25). These are your company's reference salaries.</p>
      <p><strong>Location Multipliers</strong> — Cost of living relative to San Francisco (SF = 1.0). A city with index 0.5 means salaries are roughly half of SF.</p>
      <p><strong>Job Family Multipliers</strong> — Market adjustments by department. In-demand families (Engineering, Data Science) get a premium (1.15x); saturated families (Support) get a discount (0.85x).</p>
      <p>💡 Example: Grade 8 Software Engineer in SF ≈ $143K–$213K, but in Bangalore ≈ $45K–$67K.</p>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="flex gap-1 border-b border-[var(--color-border)]">
    <button
      class="px-4 py-2 text-sm {activeTab === 'bands' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
      on:click={() => { activeTab = 'bands'; }}
    >
      💰 Salary Bands
    </button>
    <button
      class="px-4 py-2 text-sm {activeTab === 'locations' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
      on:click={() => { activeTab = 'locations'; }}
    >
      🌍 Locations
    </button>
    <button
      class="px-4 py-2 text-sm {activeTab === 'families' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
      on:click={() => { activeTab = 'families'; }}
    >
      🏷️ Job Families
    </button>
  </div>

  <!-- Salary Bands Tab -->
  {#if activeTab === 'bands'}
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--color-border)]">
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)] w-20">Grade</th>
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Min</th>
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Mid</th>
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Max</th>
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)] w-24">Currency</th>
            <th class="py-2 text-right font-medium text-[var(--color-text-muted)] w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each localBands as band, index}
            <tr class="border-b border-[var(--color-border)]">
              <td class="py-2 font-medium">{band.grade}</td>
              <td class="py-2">
                <input
                  type="number"
                  class="input text-xs w-24"
                  value={band.min}
                  on:input={(e) => updateBand(index, 'min', +e.currentTarget.value)}
                />
              </td>
              <td class="py-2">
                <input
                  type="number"
                  class="input text-xs w-24"
                  value={band.mid}
                  on:input={(e) => updateBand(index, 'mid', +e.currentTarget.value)}
                />
              </td>
              <td class="py-2">
                <input
                  type="number"
                  class="input text-xs w-24"
                  value={band.max}
                  on:input={(e) => updateBand(index, 'max', +e.currentTarget.value)}
                />
              </td>
              <td class="py-2">
                <input
                  type="text"
                  class="input text-xs w-16"
                  value={band.currency}
                  on:input={(e) => updateBand(index, 'currency', e.currentTarget.value)}
                />
              </td>
              <td class="py-2 text-right">
                <button class="btn-secondary text-xs text-red-500" on:click={() => removeBand(index)}>Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <button class="btn-secondary" on:click={addBand}>+ Add Grade</button>
  {/if}

  <!-- Locations Tab -->
  {#if activeTab === 'locations'}
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--color-border)]">
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Country</th>
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">City</th>
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Cost of Living Index</th>
            <th class="py-2 text-right font-medium text-[var(--color-text-muted)] w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each localLocations as loc, index}
            <tr class="border-b border-[var(--color-border)]">
              <td class="py-2">
                <input
                  type="text"
                  class="input text-xs w-28"
                  value={loc.country}
                  on:input={(e) => updateLocation(index, 'country', e.currentTarget.value)}
                />
              </td>
              <td class="py-2">
                <input
                  type="text"
                  class="input text-xs w-32"
                  value={loc.city}
                  on:input={(e) => updateLocation(index, 'city', e.currentTarget.value)}
                />
              </td>
              <td class="py-2">
                <div class="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={loc.costOfLivingIndex}
                    on:input={(e) => updateLocation(index, 'costOfLivingIndex', +e.currentTarget.value)}
                    class="flex-1 h-2 accent-[var(--color-primary)]"
                  />
                  <input
                    type="number"
                    class="input text-xs w-16"
                    value={loc.costOfLivingIndex}
                    on:input={(e) => updateLocation(index, 'costOfLivingIndex', +e.currentTarget.value)}
                  />
                </div>
              </td>
              <td class="py-2 text-right">
                <button class="btn-secondary text-xs text-red-500" on:click={() => removeLocation(index)}>Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <button class="btn-secondary" on:click={addLocation}>+ Add Location</button>
  {/if}

  <!-- Job Families Tab -->
  {#if activeTab === 'families'}
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--color-border)]">
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Family</th>
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Grade</th>
            <th class="py-2 text-left font-medium text-[var(--color-text-muted)]">Market Adjustment</th>
            <th class="py-2 text-right font-medium text-[var(--color-text-muted)] w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each localFamilies as fam, index}
            <tr class="border-b border-[var(--color-border)]">
              <td class="py-2">
                <select
                  class="input text-xs w-40"
                  value={fam.family}
                  on:input={(e) => updateFamily(index, 'family', e.currentTarget.value)}
                >
                  {#each JOB_FAMILIES as family}
                    <option value={family}>{family}</option>
                  {/each}
                </select>
              </td>
              <td class="py-2">
                <input
                  type="number"
                  class="input text-xs w-16"
                  value={fam.grade}
                  on:input={(e) => updateFamily(index, 'grade', +e.currentTarget.value)}
                />
              </td>
              <td class="py-2">
                <div class="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={fam.marketAdjustment}
                    on:input={(e) => updateFamily(index, 'marketAdjustment', +e.currentTarget.value)}
                    class="flex-1 h-2 accent-[var(--color-primary)]"
                  />
                  <input
                    type="number"
                    class="input text-xs w-16"
                    value={fam.marketAdjustment}
                    on:input={(e) => updateFamily(index, 'marketAdjustment', +e.currentTarget.value)}
                  />
                </div>
              </td>
              <td class="py-2 text-right">
                <button class="btn-secondary text-xs text-red-500" on:click={() => removeFamily(index)}>Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <button class="btn-secondary" on:click={addFamily}>+ Add Family-Grade Pair</button>
  {/if}
</div>
