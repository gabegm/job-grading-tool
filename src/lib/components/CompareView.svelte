<script lang="ts">
  import { createDefaultQuestionnaire } from '../serializers/Serializer';
  import type { Role } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let roleA: Role | null = null;
  export let roleB: Role | null = null;
  export let onClose = () => {};

  // ─── Computed ────────────────────────────────────────────────────

  $: questionnaire = createDefaultQuestionnaire();
  $: factors = questionnaire.factors;
  $: gateQuestions = questionnaire.gateQuestions;

  // Helper: find option label by answer id
  function getOptionLabel(question, answerId) {
    if (!answerId) return '—';
    const opt = question.options.find(o => o.label === answerId);
    return opt ? opt.label : '—';
  }

  // Helper: find option points by answer id
  function getOptionPoints(question, answerId) {
    if (!answerId) return '—';
    const opt = question.options.find(o => o.label === answerId);
    return opt ? opt.points + ' pts' : '—';
  }

  // Helper: find financial authority label
  function getFinancialAuthorityLabel(role) {
    const faGate = gateQuestions.find(g => g.id === 'financialAuthority');
    const opt = faGate?.options?.find(o => o.label === role.answers?.financialAuthority);
    return opt ? opt.label : '—';
  }
</script>

{#if roleA && roleB}
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
      class="bg-[var(--color-surface)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      on:click={(e) => e.stopPropagation()}
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="section-title mb-0">Role Comparison</h2>
          <button class="btn-secondary text-sm" on:click={onClose}>✕</button>
        </div>

        <!-- Role Headers -->
        <div class="grid grid-cols-3 gap-4 mb-6 text-center">
          <div>
            <p class="text-xs text-[var(--color-text-muted)]">Factor</p>
          </div>
          <div class="card">
            <p class="font-bold text-[var(--color-primary)]">{roleA.title}</p>
            <p class="text-xs text-[var(--color-text-muted)]">Grade {roleA.assignedGrade} · {roleA.assignedGradeLabel}</p>
            <p class="text-xs text-[var(--color-text-muted)]">{roleA.totalPoints} pts</p>
          </div>
          <div class="card">
            <p class="font-bold text-[var(--color-primary)]">{roleB.title}</p>
            <p class="text-xs text-[var(--color-text-muted)]">Grade {roleB.assignedGrade} · {roleB.assignedGradeLabel}</p>
            <p class="text-xs text-[var(--color-text-muted)]">{roleB.totalPoints} pts</p>
          </div>
        </div>

        <!-- Factor Comparison -->
        <div class="space-y-4">
          {#each factors as factor}
            <div class="rounded-lg border border-[var(--color-border)] p-4">
              <h4 class="font-medium text-sm mb-3">{factor.label}</h4>
              {#each factor.questions as question}
                <div class="grid grid-cols-3 gap-4 text-sm">
                  <div class="text-[var(--color-text-muted)] text-xs">
                    {question.text}
                  </div>
                  <div class="text-center">
                    <span class="badge-grade">{getOptionLabel(question, roleA.answers?.[question.id])}</span>
                    <span class="text-xs text-[var(--color-text-muted)] block mt-1">{getOptionPoints(question, roleA.answers?.[question.id])}</span>
                  </div>
                  <div class="text-center">
                    <span class="badge-grade">{getOptionLabel(question, roleB.answers?.[question.id])}</span>
                    <span class="text-xs text-[var(--color-text-muted)] block mt-1">{getOptionPoints(question, roleB.answers?.[question.id])}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/each}

          <!-- Gate Comparison -->
          <div class="rounded-lg border border-[var(--color-border)] p-4">
            <h4 class="font-medium text-sm mb-3">Gate Questions</h4>

            <!-- Manages Team -->
            <div class="grid grid-cols-3 gap-4 text-sm mb-3">
              <div class="text-[var(--color-text-muted)] text-xs">Manages team?</div>
              <div class="text-center">
                <span class="badge {roleA.answers?.managesTeam ? 'badge-grade' : ''}">
                  {roleA.answers?.managesTeam ? 'Yes' : 'No'}
                </span>
              </div>
              <div class="text-center">
                <span class="badge {roleB.answers?.managesTeam ? 'badge-grade' : ''}">
                  {roleB.answers?.managesTeam ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <!-- Financial Authority -->
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div class="text-[var(--color-text-muted)] text-xs">Financial authority</div>
              <div class="text-center">
                <span class="badge-grade">{getFinancialAuthorityLabel(roleA)}</span>
              </div>
              <div class="text-center">
                <span class="badge-grade">{getFinancialAuthorityLabel(roleB)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="mt-6 score-display">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="score-label">Difference</p>
              <p class="score-grade">{Math.abs(roleA.assignedGrade - roleB.assignedGrade)}</p>
              <p class="text-xs text-[var(--color-text-muted)]">grades apart</p>
            </div>
            <div>
              <p class="score-label">Points Diff</p>
              <p class="score-grade">{Math.abs(roleA.totalPoints - roleB.totalPoints)}</p>
              <p class="text-xs text-[var(--color-text-muted)]">points apart</p>
            </div>
            <div>
              <p class="score-label">Band Diff</p>
              <p class="score-grade text-sm">
                {roleA.careerBand !== roleB.careerBand ? 'Different' : 'Same'}
              </p>
              <p class="text-xs text-[var(--color-text-muted)]">career band</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/if}
