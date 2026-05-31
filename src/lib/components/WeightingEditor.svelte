<script lang="ts">
  import type { FactorWeighting } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let weightings: FactorWeighting[] = [];
  export let factors: { id: string; label: string }[] = [];
  export let onChange = (w: FactorWeighting[]) => {};

  // ─── State ───────────────────────────────────────────────────────

  // Local copy for editing
  let localWeightings: FactorWeighting[] = [];

  // ─── Lifecycle ───────────────────────────────────────────────────

  $: {
    // Deep copy incoming weightings
    localWeightings = JSON.parse(JSON.stringify(weightings));
  }

  // ─── Computed ────────────────────────────────────────────────────

  // Get factor labels by ID for display
  $: factorMap = Object.fromEntries(factors.map(f => [f.id, f.label]));

  // ─── Handlers ────────────────────────────────────────────────────

  function updateWeight(factorId: string, track: 'ic' | 'manager', value: number) {
    const clamped = Math.max(0, Math.min(2, value));
    localWeightings = localWeightings.map(w =>
      w.factorId === factorId ? { ...w, [`${track}Weight`]: clamped } : w
    );
  }

  function handleSave() {
    onChange(localWeightings);
  }

  function handleReset() {
    localWeightings = JSON.parse(JSON.stringify(weightings));
  }

  function hasChanges(): boolean {
    return JSON.stringify(weightings) !== JSON.stringify(localWeightings);
  }

  // Check if all weights are equal (no differentiation)
  $: allEqual = localWeightings.every(w => w.icWeight === w.managerWeight);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="section-title mb-0">Factor Weightings</h3>
      <p class="text-sm text-[var(--color-text-muted)]">
        Adjust how much each factor matters for IC vs Manager tracks.
        Higher weight = more influence on the final grade.
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
        Save Weightings
      </button>
    </div>
  </div>

  {#if allEqual}
    <div class="rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-3">
      <p class="text-sm text-[var(--color-warning)]">
        ⚠️ All factors have equal IC and Manager weights. The grading will produce identical grades for both tracks.
        Consider differentiating at least one factor.
      </p>
    </div>
  {/if}

  <!-- Weighting Table -->
  <div class="space-y-3">
    {#each localWeightings as weighting}
      <div class="rounded-lg border border-[var(--color-border)] p-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <!-- Factor label -->
          <div class="sm:w-48 shrink-0">
            <span class="font-medium text-sm">{factorMap[weighting.factorId] || weighting.factorId}</span>
          </div>

          <!-- IC Weight -->
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs text-[var(--color-text-muted)] w-12">IC</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={weighting.icWeight}
                on:input={(e) => updateWeight(weighting.factorId, 'ic', +e.currentTarget.value)}
                class="flex-1 h-2 accent-[var(--color-primary)]"
              />
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={weighting.icWeight}
                on:change={(e) => updateWeight(weighting.factorId, 'ic', +e.currentTarget.value)}
                class="w-16 text-xs input py-1 px-2"
              />
            </div>
            <!-- Visual bar -->
            <div class="h-1.5 rounded-full bg-[var(--color-bg)] overflow-hidden">
              <div
                class="h-full rounded-full bg-[var(--color-primary)] transition-all"
                style="width: {weighting.icWeight / 2 * 100}%"
              ></div>
            </div>
          </div>

          <!-- Manager Weight -->
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs text-[var(--color-text-muted)] w-12">Mgr</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={weighting.managerWeight}
                on:input={(e) => updateWeight(weighting.factorId, 'manager', +e.currentTarget.value)}
                class="flex-1 h-2 accent-[var(--color-success)]"
              />
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={weighting.managerWeight}
                on:change={(e) => updateWeight(weighting.factorId, 'manager', +e.currentTarget.value)}
                class="w-16 text-xs input py-1 px-2"
              />
            </div>
            <!-- Visual bar -->
            <div class="h-1.5 rounded-full bg-[var(--color-bg)] overflow-hidden">
              <div
                class="h-full rounded-full bg-[var(--color-success)] transition-all"
                style="width: {weighting.managerWeight / 2 * 100}%"
              ></div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
