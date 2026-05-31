<script lang="ts">
  import type { Project } from '../types';
  import WeightingEditor from './WeightingEditor.svelte';
  import BandEditor from './BandEditor.svelte';
  import QuestionnaireEditor from './QuestionnaireEditor.svelte';
  import SalaryConfig from './SalaryConfig.svelte';
  import GateEditor from './GateEditor.svelte';

  // ─── Props ───────────────────────────────────────────────────────

  export let project: Project | null = null;

  // ─── State ───────────────────────────────────────────────────────

  let activeTab = 'weightings'; // 'weightings' | 'bands' | 'questionnaire' | 'salary' | 'gates'

  // ─── Computed ────────────────────────────────────────────────────

  $: factors = project?.questionnaire?.factors.map(f => ({ id: f.id, label: f.label })) || [];
  $: weightings = project?.questionnaire?.factorWeightings || [];
  $: bands = project?.questionnaire?.careerBands || [];
  $: questionnaire = project?.questionnaire || null;
  $: salaryBands = project?.salaryBands;
  $: locationMultipliers = project?.locationMultipliers;
  $: jobFamilyMultipliers = project?.jobFamilyMultipliers;
  $: gateQuestions = project?.questionnaire?.gateQuestions || [];

  // ─── Helpers ─────────────────────────────────────────────────────

  function tabVisible(tab: string): boolean {
    return activeTab === tab;
  }

  // ─── Handlers ────────────────────────────────────────────────────

  function handleWeightingsChange(newWeightings: import('../types').FactorWeighting[]) {
    if (!project) return;
    project = {
      ...project,
      questionnaire: {
        ...project.questionnaire,
        factorWeightings: newWeightings,
      },
    };
  }

  function handleBandsChange(newBands: import('../types').CareerBand[]) {
    if (!project) return;
    project = {
      ...project,
      questionnaire: {
        ...project.questionnaire,
        careerBands: newBands,
      },
    };
  }

  function handleQuestionnaireChange(newFactors: import('../types').Factor[]) {
    if (!project || !project.questionnaire) return;
    project = {
      ...project,
      questionnaire: {
        ...project.questionnaire,
        factors: newFactors,
      },
    };
  }

  function handleSalaryChange(
    sb: import('../types').SalaryBand[],
    lm: import('../types').LocationMultiplier[],
    jm: import('../types').JobFamilyMultiplier[]
  ) {
    if (!project) return;
    project = {
      ...project,
      salaryBands: sb,
      locationMultipliers: lm,
      jobFamilyMultipliers: jm,
    };
  }

  function handleGatesChange(newGates: import('../types').GateQuestion[]) {
    if (!project || !project.questionnaire) return;
    project = {
      ...project,
      questionnaire: {
        ...project.questionnaire,
        gateQuestions: newGates,
      },
    };
  }
</script>

{#if !project}
  <p class="text-center py-12 text-[var(--color-text-muted)]">
    No project loaded. Set up a company first.
  </p>
{:else}
  <!-- Tab Navigation (horizontal scroll on mobile) -->
  <div class="flex gap-1 mb-6 border-b border-[var(--color-border)] overflow-x-auto">
    <button
      class="px-3 py-2 text-sm whitespace-nowrap {activeTab === 'weightings' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
      on:click={() => { activeTab = 'weightings'; }}
    >
      ⚖️ Weightings
    </button>
    <button
      class="px-3 py-2 text-sm whitespace-nowrap {activeTab === 'bands' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
      on:click={() => { activeTab = 'bands'; }}
    >
      📊 Career Bands
    </button>
    <button
      class="px-3 py-2 text-sm whitespace-nowrap {activeTab === 'questionnaire' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
      on:click={() => { activeTab = 'questionnaire'; }}
    >
      📋 Questionnaire
    </button>
    <button
      class="px-3 py-2 text-sm whitespace-nowrap {activeTab === 'salary' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
      on:click={() => { activeTab = 'salary'; }}
    >
      💰 Salary
    </button>
    <button
      class="px-3 py-2 text-sm whitespace-nowrap {activeTab === 'gates' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
      on:click={() => { activeTab = 'gates'; }}
    >
      🔒 Gates
    </button>
  </div>

  <!-- Tab Content -->
  <div class="space-y-6">
    {#if tabVisible('weightings')}
      <WeightingEditor
        {factors}
        {weightings}
        onChange={handleWeightingsChange}
      />
    {/if}
    {#if tabVisible('bands')}
      <BandEditor
        {bands}
        onChange={handleBandsChange}
      />
    {/if}
    {#if questionnaire && tabVisible('questionnaire')}
      <QuestionnaireEditor
        factors={questionnaire.factors}
        onChange={handleQuestionnaireChange}
      />
    {/if}
    {#if tabVisible('salary')}
      <SalaryConfig
        {salaryBands}
        {locationMultipliers}
        {jobFamilyMultipliers}
        onChange={handleSalaryChange}
      />
    {/if}
    {#if tabVisible('gates')}
      <GateEditor
        gateQuestions={gateQuestions}
        onChange={handleGatesChange}
      />
    {/if}
  </div>
</div>
{/if}
