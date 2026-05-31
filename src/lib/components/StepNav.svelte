<script lang="ts">
  // ─── Props ───────────────────────────────────────────────────────

  export let currentStep = 0;
  export let steps: { label: string; icon: string }[] = [];
  export let onGoToStep = (s: number) => {};

  // ─── Computed ────────────────────────────────────────────────────

  $: canGoToStep = (step) => {
    // Default: all steps are accessible. Override via slots or props.
    return true;
  };
</script>

<nav class="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
  <div class="mx-auto max-w-6xl px-4">
    <div class="flex items-center">
      {#each steps as step, i}
        <button
          class="flex flex-1 flex-col items-center gap-1 py-3 text-sm transition-colors duration-150 {currentStep === i ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}"
          on:click={() => onGoToStep(i)}
        >
          <span class="text-lg">{step.icon}</span>
          <span class="hidden sm:inline">{step.label}</span>
          {#if i === currentStep}
            <span class="mt-1 h-0.5 w-8 rounded-full bg-[var(--color-primary)] mx-auto"></span>
          {/if}
        </button>
        {#if i < steps.length - 1}
          <span class="text-[var(--color-text-muted)] hidden sm:inline">→</span>
        {/if}
      {/each}
    </div>
  </div>
</nav>
