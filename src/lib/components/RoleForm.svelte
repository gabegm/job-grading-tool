<script lang="ts">
  import { scoreRole, gradeToLabel } from '../engine/ScoringEngine';
  import { createDefaultQuestionnaire } from '../serializers/Serializer';
  import { DEPARTMENTS, LOCATIONS } from '../constants';
  import type { Ceiling, Role, RoleTrack, FactorWeighting } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let companyCeiling: Ceiling = { grade: 10, gradeLabel: 'Manager' };
  export let gradingRole: Role | null = null;
  export let onSave = (r: Role) => {};
  export let onCancel = () => {};

  // ─── Computed ────────────────────────────────────────────────────

  $: isNewRole = !gradingRole;
  $: isLocked = gradingRole?.locked === true;

  // ─── State ───────────────────────────────────────────────────────

  let title = '';
  let department = '';
  let location = '';
  let careerBand = 'band3'; // default to operational

  // Factor answers (by factor ID → points value)
  let factorAnswers: Record<string, number> = {};

  // Gate answers
  let managesTeam = false;
  let financialAuthority = 0;

  // Track selection (IC vs Manager)
  let track: RoleTrack = 'ic';

  // Factor weightings (from questionnaire)
  let factorWeightings: FactorWeighting[] = [];

  // ─── Computed ────────────────────────────────────────────────────

  $: questionnaire = createDefaultQuestionnaire();

  $: factors = questionnaire.factors;
  $: gateQuestions = questionnaire.gateQuestions;

  // Pre-fill from existing role
  $: {
    if (gradingRole) {
      title = gradingRole.title || '';
      department = gradingRole.department || '';
      location = gradingRole.location || '';
      careerBand = gradingRole.careerBand || 'band3';
      track = (gradingRole as Role & { track?: RoleTrack }).track || 'ic';
      managesTeam = !!gradingRole.answers?.managesTeam;
      // Find financial authority points from answers
      const faAnswer = gradingRole.answers?.financialAuthority;
      if (faAnswer !== undefined) {
        const faGate = gateQuestions.find(g => g.id === 'financialAuthority');
        if (faGate && faGate.options) {
          const opt = faGate.options.find(o => o.label === faAnswer);
          financialAuthority = opt ? opt.points : 0;
        }
      }
      // Pre-fill factor answers
      const newAnswers: Record<string, number> = {};
      for (const factor of factors) {
        for (const question of factor.questions) {
          const answerId = gradingRole.answers?.[question.id] as string | undefined;
          if (answerId) {
            const option = question.options.find(o => o.label === answerId);
            if (option) newAnswers[question.id] = option.points;
          }
        }
      }
      factorAnswers = newAnswers;
    }
  }

  // Get factor weightings from questionnaire
  $: factorWeightings = questionnaire.factorWeightings || [];

  // Live score
  $: scoringResult = scoreRole(
    companyCeiling,
    careerBand,
    factorAnswers,
    { managesTeam, financialAuthority },
    track,
    factorWeightings,
    isLocked,
  );

  // Check if all factors are answered
  $: allFactorsAnswered = factors.every(f =>
    f.questions.some(q => factorAnswers[q.id] !== undefined)
  );

  // ─── Handlers ────────────────────────────────────────────────────

  function handleSave() {
    if (isLocked) return;
    if (!title.trim()) return;

    const role: Role = {
      id: gradingRole ? gradingRole.id : `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      reportsTo: null,
      source: gradingRole ? gradingRole.source : 'manual',
      careerBand,
      track,
      answers: {
        ...factorAnswers,
        managesTeam,
        financialAuthority: financialAuthority.toString(),
      },
      assignedGrade: scoringResult.grade,
      assignedGradeLabel: scoringResult.label,
      totalPoints: scoringResult.totalPoints,
      status: 'graded',
    };

    onSave(role);
  }
</script>

<div class="mx-auto max-w-3xl">
  <div class="card">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xl">📝</span>
      <h2 class="section-title mb-0">
        {isNewRole ? 'Grade a Role' : 'Edit Role'}
      </h2>
    </div>

    <!-- Role Info -->
    <div class="space-y-4 mb-6">
      <div>
        <label class="label">Role Title</label>
        <div class="input bg-[var(--color-bg)] text-[var(--color-text)] font-medium">
          {gradingRole?.title || title}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="label" for="role-department">Department</label>
          <select
            id="role-department"
            class="input"
            bind:value={department}
          >
            <option value="">Select department...</option>
            {#each DEPARTMENTS as dept}
              <option value={dept}>{dept}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="label" for="role-location">Location</label>
          {#if gradingRole?.locations && gradingRole.locations.length > 1}
            <div class="input bg-[var(--color-bg)] text-[var(--color-text)]">
              {gradingRole.locations.join(', ')}
            </div>
          {:else}
            <select
              id="role-location"
              class="input"
              bind:value={location}
            >
              <option value="">Select location...</option>
              {#each LOCATIONS as loc}
                <option value={loc}>{loc}</option>
              {/each}
            </select>
          {/if}
        </div>
      </div>

      {#if isLocked}
        <div class="rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-3 mb-4">
          <p class="text-sm font-medium text-[var(--color-warning)]">
            🔒 This role is locked at the company ceiling grade (Grade {companyCeiling.grade} — {companyCeiling.gradeLabel}).
          </p>
          <p class="text-xs text-[var(--color-text-muted)] mt-1">
            The CEO reports to no one and is automatically assigned the company ceiling.
          </p>
        </div>
      {/if}

      <!-- Career Band Selection -->
      <div>
        <label class="label">Career Band</label>
        <p class="text-xs text-[var(--color-text-muted)] mb-2">
          Primary function of this role (determines scoring table).
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {#each questionnaire.careerBands as band}
            <label class="radio-card">
              <input
                type="radio"
                name="careerBand"
                class="sr-only"
                bind:group={careerBand}
                value={band.id}
              />
              <span
                class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
                class:bg-[var(--color-primary)]={careerBand === band.id}
                class:border-[var(--color-primary)]={careerBand === band.id}
              >
                {#if careerBand === band.id}
                  <span class="h-2 w-2 rounded-full bg-white"></span>
                {/if}
              </span>
              <div>
                <span class="font-medium">{band.label}</span>
                <span class="text-xs text-[var(--color-text-muted)] block">{band.range}</span>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Track Selection (IC vs Manager) -->
      <div>
        <label class="label">Career Track</label>
        <p class="text-xs text-[var(--color-text-muted)] mb-2">
          Select whether this role is primarily an Individual Contributor (IC) or Managerial role.
          This determines how factors are weighted and which grade ladder applies.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="radio-card">
            <input
              type="radio"
              name="track"
              class="sr-only"
              checked={track === 'ic'}
              on:change={() => { track = 'ic'; }}
            />
            <span
              class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
              class:bg-[var(--color-primary)]={track === 'ic'}
              class:border-[var(--color-primary)]={track === 'ic'}
            >
              {#if track === 'ic'}
                <span class="h-2 w-2 rounded-full bg-white"></span>
              {/if}
            </span>
            <div>
              <span class="font-medium">🔧 Individual Contributor (IC)</span>
              <span class="text-xs text-[var(--color-text-muted)] block">
                Deep expertise, technical impact, no direct reports. Factors like "Job Functional Knowledge" and "Problem Solving" are weighted heavily.
              </span>
            </div>
          </label>
          <label class="radio-card">
            <input
              type="radio"
              name="track"
              class="sr-only"
              checked={track === 'manager'}
              on:change={() => { track = 'manager'; }}
            />
            <span
              class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
              class:bg-[var(--color-primary)]={track === 'manager'}
              class:border-[var(--color-primary)]={track === 'manager'}
            >
              {#if track === 'manager'}
                <span class="h-2 w-2 rounded-full bg-white"></span>
              {/if}
            </span>
            <div>
              <span class="font-medium">👥 Managerial</span>
              <span class="text-xs text-[var(--color-text-muted)] block">
                People management, budget ownership, organizational impact. Factors like "Leadership" and "Business Expertise" are weighted heavily.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- 7 Factors -->
    <div class="space-y-6 mb-6">
      <h3 class="text-base font-semibold text-[var(--color-text)]">7 Evaluation Factors</h3>

      {#each factors as factor}
        <div class="rounded-lg border border-[var(--color-border)] p-4">
          <h4 class="font-medium text-sm mb-1">{factor.label}</h4>
          {#if factor.helpText}
            <p class="text-xs text-[var(--color-primary)] mb-3 italic">💡 {factor.helpText}</p>
          {/if}
          {#each factor.questions as question}
            <div class="space-y-2">
              <p class="text-xs text-[var(--color-text-muted)]">{question.text}</p>
              {#if question.helpText}
                <p class="text-xs text-[var(--color-warning)] italic">⚠️ {question.helpText}</p>
              {/if}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {#each question.options as option}
                  <label class="radio-card">
                    <input
                      type="radio"
                      name={question.id}
                      class="sr-only"
                      checked={factorAnswers[question.id] === option.points}
                      on:change={() => {
                        factorAnswers = { ...factorAnswers, [question.id]: option.points };
                      }}
                    />
                    <span class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
                          class:bg-[var(--color-primary)]={factorAnswers[question.id] === option.points}
                          class:border-[var(--color-primary)]={factorAnswers[question.id] === option.points}>
                      {#if factorAnswers[question.id] === option.points}
                        <span class="h-2 w-2 rounded-full bg-white"></span>
                      {/if}
                    </span>
                    <span>{option.label}</span>
                    <span class="ml-auto text-xs text-[var(--color-text-muted)]">({option.points} pts)</span>
                  </label>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>

    <!-- Gate Questions -->
    <div class="space-y-4 mb-6">
      <h3 class="text-base font-semibold text-[var(--color-text)]">Gate Questions</h3>

      <!-- Manages Team -->
      <div>
        <label class="label">Manages team performance reviews and compensation?</label>
        {#if gateQuestions.find(g => g.id === 'managesTeam')?.helpText}
          <p class="text-xs text-[var(--color-warning)] italic mb-2">⚠️ {gateQuestions.find(g => g.id === 'managesTeam')?.helpText}</p>
        {/if}
        <div class="flex gap-4">
          <label class="radio-card flex-1">
            <input
              type="radio"
              name="managesTeam"
              class="sr-only"
              checked={managesTeam}
              on:change={() => { managesTeam = true; }}
            />
            <span
              class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
              class:bg-[var(--color-primary)]={managesTeam}
              class:border-[var(--color-primary)]={managesTeam}
            >
              {#if managesTeam}
                <span class="h-2 w-2 rounded-full bg-white"></span>
              {/if}
            </span>
            <span>Yes</span>
          </label>
          <label class="radio-card flex-1">
            <input
              type="radio"
              name="managesTeam"
              class="sr-only"
              checked={!managesTeam}
              on:change={() => { managesTeam = false; }}
            />
            <span
              class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
              class:bg-[var(--color-primary)]={!managesTeam}
              class:border-[var(--color-primary)]={!managesTeam}
            >
              {#if !managesTeam}
                <span class="h-2 w-2 rounded-full bg-white"></span>
              {/if}
            </span>
            <span>No</span>
          </label>
        </div>
      </div>

      <!-- Financial Authority -->
      <div>
        <label class="label">Financial signing authority</label>
        {#if gateQuestions.find(g => g.id === 'financialAuthority')?.helpText}
          <p class="text-xs text-[var(--color-warning)] italic mb-2">⚠️ {gateQuestions.find(g => g.id === 'financialAuthority')?.helpText}</p>
        {/if}
        <div class="space-y-2">
          {#each gateQuestions.find(g => g.id === 'financialAuthority')?.options || [] as option}
            <label class="radio-card">
              <input
                type="radio"
                name="financialAuthority"
                class="sr-only"
                checked={financialAuthority === option.points}
                on:change={() => { financialAuthority = option.points; }}
              />
              <span
                class="h-4 w-4 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center shrink-0"
                class:bg-[var(--color-primary)]={financialAuthority === option.points}
                class:border-[var(--color-primary)]={financialAuthority === option.points}
              >
                {#if financialAuthority === option.points}
                  <span class="h-2 w-2 rounded-full bg-white"></span>
                {/if}
              </span>
              <span>{option.label}</span>
              <span class="ml-auto text-xs text-[var(--color-text-muted)]">({option.points} pts)</span>
            </label>
          {/each}
        </div>
      </div>
    </div>

    <!-- Live Score Display -->
    <div class="score-display mb-6">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="score-label">Total Points</p>
          <p class="score-grade">{scoringResult.totalPoints}</p>
        </div>
        <div>
          <p class="score-label">Assigned Grade</p>
          <p class="score-grade">Grade {scoringResult.grade}</p>
        </div>
        <div>
          <p class="score-label">Track</p>
          <p class="score-grade text-sm">{track === 'ic' ? 'Individual Contributor' : 'Managerial'}</p>
        </div>
      </div>
      <p class="text-sm font-medium text-[var(--color-primary)] mt-2 text-center">
        {scoringResult.label}
      </p>
      {#if track === 'ic' && !managesTeam && financialAuthority <= 5}
        <p class="text-xs text-[var(--color-warning)] mt-2 text-center">
          ⚠ Soft gate applied: No team management + no financial authority reduces grade by 2 levels.
          High-scoring ICs can still reach Staff/Principal grades through expertise and impact.
        </p>
      {/if}
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <button class="btn-secondary" on:click={onCancel}>Cancel</button>
      {#if isLocked}
        <button
          class="btn-primary flex-1 opacity-50 cursor-not-allowed"
          disabled
        >
          🔒 Locked at Ceiling Grade
        </button>
      {:else}
        <button
          class="btn-primary flex-1"
          disabled={!title.trim()}
          class:opacity-50={!title.trim()}
          class:cursor-not-allowed={!title.trim()}
          on:click={handleSave}
        >
          {isNewRole ? 'Save Role' : 'Update Role'}
        </button>
      {/if}
    </div>
  </div>
</div>
