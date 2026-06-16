<script lang="ts">
  import { createDefaultQuestionnaire } from '../serializers/Serializer';
  import type { Role } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let roles: Role[] = [];
  export let onClose = () => {};

  // ─── Computed ────────────────────────────────────────────────────

  $: questionnaire = createDefaultQuestionnaire();
  $: factors = questionnaire.factors;
  $: gateQuestions = questionnaire.gateQuestions;

  // Helper: find option label by answer id
  function getOptionLabel(question: { options: { label: string; points: number }[] }, answerId: string | boolean | undefined) {
    if (!answerId) return '—';
    const opt = question.options.find(o => o.label === answerId);
    return opt ? opt.label : '—';
  }

  // Helper: find option points by answer id
  function getOptionPoints(question: { options: { label: string; points: number }[] }, answerId: string | boolean | undefined) {
    if (!answerId) return '—';
    const opt = question.options.find(o => o.label === answerId);
    return opt ? opt.points + ' pts' : '—';
  }

  // Helper: find financial authority label
  function getFinancialAuthorityLabel(role: Role) {
    const faGate = gateQuestions.find(g => g.id === 'financialAuthority');
    const opt = faGate?.options?.find(o => o.label === role.answers?.financialAuthority);
    return opt ? opt.label : '—';
  }
</script>

{#if roles.length >= 2}
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    role="dialog"
    aria-modal="true"
    aria-label="Compare roles"
    tabindex="-1"
    on:keydown={(e) => { if (e.key === 'Escape') onClose(); }}
    on:click={onClose}
  >
    <div
      class="bg-[var(--color-surface)] rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      on:click={(e) => e.stopPropagation()}
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="section-title mb-0">Role Comparison ({roles.length} roles)</h2>
          <button class="btn-secondary text-sm" on:click={onClose}>✕</button>
        </div>

        <!-- Role Headers -->
        <div class="grid gap-4 mb-6" style="grid-template-columns: 180px repeat({roles.length}, 1fr);">
          <div>
            <p class="text-xs text-[var(--color-text-muted)]">Factor</p>
          </div>
          {#each roles as role}
            <div class="card text-center">
              <p class="font-bold text-[var(--color-primary)]">{role.title}</p>
              <p class="text-xs text-[var(--color-text-muted)]">Grade {role.assignedGrade} · {role.assignedGradeLabel}</p>
              <p class="text-xs text-[var(--color-text-muted)]">{role.totalPoints} pts</p>
            </div>
          {/each}
        </div>

        <!-- Factor Comparison -->
        <div class="space-y-4">
          {#each factors as factor}
            <div class="rounded-lg border border-[var(--color-border)] p-4">
              <h4 class="font-medium text-sm mb-3">{factor.label}</h4>
              {#each factor.questions as question}
                <div class="grid gap-4 text-sm" style="grid-template-columns: 180px repeat({roles.length}, 1fr);">
                  <div class="text-[var(--color-text-muted)] text-xs">
                    {question.text}
                  </div>
                  {#each roles as role}
                    <div class="text-center">
                      <span class="badge-grade">{getOptionLabel(question, role.answers?.[question.id])}</span>
                      <span class="text-xs text-[var(--color-text-muted)] block mt-1">{getOptionPoints(question, role.answers?.[question.id])}</span>
                    </div>
                  {/each}
                </div>
              {/each}
            </div>
          {/each}

          <!-- Gate Comparison -->
          <div class="rounded-lg border border-[var(--color-border)] p-4">
            <h4 class="font-medium text-sm mb-3">Gate Questions</h4>

            <!-- Manages Team -->
            <div class="grid gap-4 text-sm mb-3" style="grid-template-columns: 180px repeat({roles.length}, 1fr);">
              <div class="text-[var(--color-text-muted)] text-xs">Manages team?</div>
              {#each roles as role}
                <div class="text-center">
                  <span class="badge {role.answers?.managesTeam ? 'badge-grade' : ''}">
                    {role.answers?.managesTeam ? 'Yes' : 'No'}
                  </span>
                </div>
              {/each}
            </div>

            <!-- Financial Authority -->
            <div class="grid gap-4 text-sm" style="grid-template-columns: 180px repeat({roles.length}, 1fr);">
              <div class="text-[var(--color-text-muted)] text-xs">Financial authority</div>
              {#each roles as role}
                <div class="text-center">
                  <span class="badge-grade">{getFinancialAuthorityLabel(role)}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="mt-6 score-display">
          <div class="grid gap-4 text-center" style="grid-template-columns: 180px repeat({roles.length}, 1fr);">
            <div>
              <p class="score-label">Total Points</p>
            </div>
            {#each roles as role}
              <div>
                <p class="score-grade">{role.totalPoints}</p>
                <p class="text-xs text-[var(--color-text-muted)]">points</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
  {/if}
