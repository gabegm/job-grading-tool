<script lang="ts">
  import { calculateCeiling } from '../engine/ScoringEngine';
  import type { Company } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let company: Company | null = null;
  export let onSave = (c: Company) => {};

  // ─── State ───────────────────────────────────────────────────────

  let companyName = '';
  let annualRevenue: Company['annualRevenue'] = 'under10M';
  let globalHeadcount: Company['globalHeadcount'] = 'under100';
  let geographicFootprint: Company['geographicFootprint'] = 'singleCountry';
  let corporateStructure: Company['corporateStructure'] = 'singleBusiness';

  // ─── Computed ────────────────────────────────────────────────────

  // Pre-fill from existing company
  $: {
    if (company) {
      companyName = company.name || '';
      annualRevenue = company.annualRevenue;
      globalHeadcount = company.globalHeadcount;
      geographicFootprint = company.geographicFootprint;
      corporateStructure = company.corporateStructure;
    }
  }

  $: formCompany =
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
        } as Company
      : null;

  $: ceiling = formCompany ? calculateCeiling(formCompany) : null;

  // ─── Handlers ────────────────────────────────────────────────────

  function handleSave() {
    if (!formCompany) return;
    onSave(formCompany);
  }
</script>

<div class="mx-auto max-w-2xl">
  <div class="card">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xl">🏢</span>
      <h2 class="section-title mb-0">Company Setup</h2>
    </div>
    <p class="text-sm text-[var(--color-text-muted)] mb-6">
      Answer these 4 questions to establish your company's grading ceiling. The CEO will automatically receive this grade.
    </p>

    <div class="space-y-6">
      <!-- Company Name -->
      <div>
        <label class="label" for="company-name">Company Name</label>
        <input
          id="company-name"
          type="text"
          class="input"
          placeholder="e.g., Acme Corporation"
          bind:value={companyName}
        />
      </div>

      <!-- Annual Revenue -->
      <div>
        <label class="label">Annual Revenue / Budget</label>
        <p class="text-xs text-[var(--color-text-muted)] mb-2">
          Financial throughput is the strongest indicator of organizational risk.
        </p>
        <div class="space-y-2">
          {#each [
            { value: 'under10M', label: 'Under $10 Million' },
            { value: '10to50M', label: '$10 Million to $50 Million' },
            { value: '50to250M', label: '$50 Million to $250 Million' },
            { value: '250to1B', label: '$250 Million to $1 Billion' },
            { value: 'over1B', label: 'Over $1 Billion' },
          ] as option}
            <label class="radio-card">
              <input
                type="radio"
                name="revenue"
                class="sr-only"
                bind:group={annualRevenue}
                value={option.value}
              />
              <span
                class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
                class:bg-[var(--color-primary)]={annualRevenue === option.value}
                class:border-[var(--color-primary)]={annualRevenue === option.value}
              >
                {#if annualRevenue === option.value}
                  <span class="h-2 w-2 rounded-full bg-white"></span>
                {/if}
              </span>
              <span>{option.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- Global Headcount -->
      <div>
        <label class="label">Global Headcount (FTE)</label>
        <p class="text-xs text-[var(--color-text-muted)] mb-2">
          Dictates management layers and structural hierarchy.
        </p>
        <div class="space-y-2">
          {#each [
            { value: 'under100', label: 'Fewer than 100 employees' },
            { value: '100to500', label: '100 to 500 employees' },
            { value: '501to2500', label: '501 to 2,500 employees' },
            { value: '2501to10000', label: '2,501 to 10,000 employees' },
            { value: 'over10000', label: 'Over 10,000 employees' },
          ] as option}
            <label class="radio-card">
              <input
                type="radio"
                name="headcount"
                class="sr-only"
                bind:group={globalHeadcount}
                value={option.value}
              />
              <span
                class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
                class:bg-[var(--color-primary)]={globalHeadcount === option.value}
                class:border-[var(--color-primary)]={globalHeadcount === option.value}
              >
                {#if globalHeadcount === option.value}
                  <span class="h-2 w-2 rounded-full bg-white"></span>
                {/if}
              </span>
              <span>{option.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- Geographic Footprint -->
      <div>
        <label class="label">Geographic Footprint</label>
        <p class="text-xs text-[var(--color-text-muted)] mb-2">
          Multi-region introduces currency volatility, cross-border legal, and cultural differences.
        </p>
        <div class="space-y-2">
          {#each [
            { value: 'singleCountry', label: 'Single Country — All operations within one nation' },
            { value: 'regional', label: 'Regional (Multi-Country) — Multiple countries, one continent' },
            { value: 'global', label: 'Global (Multi-Continent) — Spans multiple continents' },
          ] as option}
            <label class="radio-card">
              <input
                type="radio"
                name="footprint"
                class="sr-only"
                bind:group={geographicFootprint}
                value={option.value}
              />
              <span
                class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
                class:bg-[var(--color-primary)]={geographicFootprint === option.value}
                class:border-[var(--color-primary)]={geographicFootprint === option.value}
              >
                {#if geographicFootprint === option.value}
                  <span class="h-2 w-2 rounded-full bg-white"></span>
                {/if}
              </span>
              <span>{option.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- Corporate Structure -->
      <div>
        <label class="label">Corporate Structure</label>
        <p class="text-xs text-[var(--color-text-muted)] mb-2">
          Multi-product/subsidiary requires higher executive grading ceiling.
        </p>
        <div class="space-y-2">
          {#each [
            { value: 'singleBusiness', label: 'Single Business — One primary product or service' },
            { value: 'multiBusiness', label: 'Multi-Business / Matrixed — Multiple divisions sharing resources' },
            { value: 'holdingCompany', label: 'Holding Company / Conglomerate — Independent subsidiaries' },
          ] as option}
            <label class="radio-card">
              <input
                type="radio"
                name="structure"
                class="sr-only"
                bind:group={corporateStructure}
                value={option.value}
              />
              <span
                class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
                class:bg-[var(--color-primary)]={corporateStructure === option.value}
                class:border-[var(--color-primary)]={corporateStructure === option.value}
              >
                {#if corporateStructure === option.value}
                  <span class="h-2 w-2 rounded-full bg-white"></span>
                {/if}
              </span>
              <span>{option.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- Ceiling Preview -->
      {#if ceiling}
        <div class="score-display">
          <p class="score-label">Your company ceiling</p>
          <p class="score-grade">Grade {ceiling.grade}</p>
          <p class="text-sm font-medium text-[var(--color-primary)]">{ceiling.gradeLabel}</p>
          <p class="text-xs text-[var(--color-text-muted)] mt-2">
            CEO is auto-assigned Grade {ceiling.grade} ({ceiling.gradeLabel})
          </p>
        </div>
      {/if}

      <div class="flex gap-3">
        <button
          class="btn-primary w-full"
          disabled={!formCompany}
          class:opacity-50={!formCompany}
          class:cursor-not-allowed={!formCompany}
          on:click={handleSave}
        >
          Save & Continue →
        </button>
      </div>
    </div>
  </div>
</div>
