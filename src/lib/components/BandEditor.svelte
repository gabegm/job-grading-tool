<script lang="ts">
  import type { CareerBand } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let bands: CareerBand[] = [];
  export let onChange = (b: CareerBand[]) => {};

  // ─── State ───────────────────────────────────────────────────────

  let localBands: CareerBand[] = [];

  // ─── Lifecycle ───────────────────────────────────────────────────

  $: {
    localBands = JSON.parse(JSON.stringify(bands));
  }

  // ─── Handlers ────────────────────────────────────────────────────

  function updateBand(index: number, field: keyof CareerBand, value: string) {
    localBands = localBands.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
  }

  function addBand() {
    const maxId = localBands.reduce((max, b) => {
      const num = parseInt(b.id.replace('band', ''), 10);
      return num > max ? num : max;
    }, 0);
    localBands = [...localBands, {
      id: `band${maxId + 1}`,
      label: `New Band ${maxId + 1}`,
      range: 'Grades 1–5',
    }];
  }

  function removeBand(index: number) {
    if (localBands.length <= 1) return;
    localBands = localBands.filter((_, i) => i !== index);
  }

  function handleSave() {
    // Validate grade ranges
    const errors = validateBands();
    if (errors.length > 0) {
      alert('Please fix the following issues:\n' + errors.join('\n'));
      return;
    }
    onChange(localBands);
  }

  function handleReset() {
    localBands = JSON.parse(JSON.stringify(bands));
  }

  function validateBands(): string[] {
    const errors: string[] = [];

    for (const band of localBands) {
      const match = band.range.match(/(\d+)\s*–?\s*(\d+)/);
      if (!match) {
        errors.push(`"${band.label}": Invalid grade range format. Use "Grades X–Y".`);
        continue;
      }
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      if (min > max) {
        errors.push(`"${band.label}": Min grade (${min}) must not exceed max grade (${max}).`);
      }
    }

    // Check for overlapping ranges
    const ranges = localBands
      .map(b => {
        const match = b.range.match(/(\d+)\s*–?\s*(\d+)/);
        return match ? { label: b.label, min: parseInt(match[1]), max: parseInt(match[2]) } : null;
      })
      .filter(Boolean) as { label: string; min: number; max: number }[];

    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i], b = ranges[j];
        if (a.min <= b.max && b.min <= a.max) {
          errors.push(`"${a.label}" and "${b.label}" have overlapping grade ranges.`);
        }
      }
    }

    return errors;
  }

  function hasChanges(): boolean {
    return JSON.stringify(bands) !== JSON.stringify(localBands);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="section-title mb-0">Career Bands</h3>
      <p class="text-sm text-[var(--color-text-muted)]">
        Define career bands that determine which scoring table applies to each role.
        Bands map to grade ranges (e.g., "Grades 13–25" = executive level).
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
        Save Bands
      </button>
    </div>
  </div>

  <!-- Guide -->
  <div class="rounded-lg border border-[var(--color-info)] bg-[var(--color-info-bg)] p-4">
    <p class="text-sm font-medium text-[var(--color-info)] mb-2">ℹ️ How career bands work</p>
    <div class="text-xs text-[var(--color-text-muted)] space-y-1">
      <p>Career bands group roles by their <strong>primary function</strong> and determine which scoring table is used to convert points to grades.</p>
      <p><strong>Band 1 (C-Suite)</strong> — CEO, CFO, CTO: highest grade range (13–25)</p>
      <p><strong>Band 2 (Senior Leadership)</strong> — VPs, Directors: mid grade range (6–12)</p>
      <p><strong>Band 3 (Operational)</strong> — ICs and frontline managers: lower grade range (1–5)</p>
      <p>Each band has its own scoring curve — a role scoring 200 points might be Grade 8 in Band 3 but Grade 14 in Band 1.</p>
      <p>⚠️ Bands must not overlap in grade ranges. A role can only belong to one band.</p>
    </div>
  </div>

  <!-- Band Cards -->
  <div class="space-y-3">
    {#each localBands as band, index}
      <div class="rounded-lg border border-[var(--color-border)] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <!-- Band ID -->
          <div class="sm:col-span-2">
            <label class="label text-xs" for="band-{index}-id">Band ID</label>
            <input
              id="band-{index}-id"
              type="text"
              class="input text-xs"
              value={band.id}
              on:change={(e) => updateBand(index, 'id', e.currentTarget.value)}
              placeholder="band1"
            />
          </div>

          <!-- Label -->
          <div class="sm:col-span-4">
            <label class="label text-xs" for="band-{index}-label">Label</label>
            <input
              id="band-{index}-label"
              type="text"
              class="input text-xs"
              value={band.label}
              on:change={(e) => updateBand(index, 'label', e.currentTarget.value)}
              placeholder="C-Suite / Board"
            />
          </div>

          <!-- Grade Range -->
          <div class="sm:col-span-3">
            <label class="label text-xs" for="band-{index}-range">Grade Range</label>
            <input
              id="band-{index}-range"
              type="text"
              class="input text-xs"
              value={band.range}
              on:change={(e) => updateBand(index, 'range', e.currentTarget.value)}
              placeholder="Grades 13–25"
            />
          </div>

          <!-- Actions -->
          <div class="sm:col-span-3 flex gap-2">
            <button
              class="btn-secondary text-xs"
              disabled={localBands.length <= 1}
              class:opacity-50={localBands.length <= 1}
              class:cursor-not-allowed={localBands.length <= 1}
              on:click={() => removeBand(index)}
            >
              Delete
            </button>
            <button class="btn-primary text-xs" on:click={() => updateBand(index, 'range', band.range)}>
              Save
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <button class="btn-secondary" on:click={addBand}>+ Add Band</button>
</div>
