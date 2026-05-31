<script lang="ts">
  import type { Factor, Question, AnswerOption } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let factors: Factor[] = [];
  export let onChange = (f: Factor[]) => {};

  // ─── State ───────────────────────────────────────────────────────

  let localFactors: Factor[] = [];
  let editingFactor: number | null = null;
  let editingQuestion: { factorIdx: number; questionIdx: number } | null = null;
  let editingOption: { factorIdx: number; questionIdx: number; optionIdx: number } | null = null;

  // Temporary edit values
  let tempFactorLabel = '';
  let tempFactorHelp = '';
  let tempFactorMax = 50;
  let tempQuestionText = '';
  let tempQuestionHelp = '';
  let tempOptionLabel = '';
  let tempOptionPoints = 0;

  // ─── Lifecycle ───────────────────────────────────────────────────

  $: {
    localFactors = JSON.parse(JSON.stringify(factors));
  }

  // ─── Handlers: Factors ───────────────────────────────────────────

  function startEditFactor(index: number) {
    editingFactor = index;
    const f = localFactors[index];
    tempFactorLabel = f.label;
    tempFactorHelp = f.helpText || '';
    tempFactorMax = f.maxPoints;
  }

  function cancelEditFactor() {
    editingFactor = null;
  }

  function saveFactor(index: number) {
    if (!tempFactorLabel.trim()) return;
    localFactors = localFactors.map((f, i) =>
      i === index
        ? { ...f, label: tempFactorLabel.trim(), helpText: tempFactorHelp.trim() || undefined, maxPoints: Math.max(1, tempFactorMax) }
        : f
    );
    editingFactor = null;
  }

  function addFactor() {
    const maxId = localFactors.reduce((max, f) => {
      const num = parseInt(f.id.replace('factor', ''), 10) || 0;
      return num > max ? num : max;
    }, 0);
    localFactors = [...localFactors, {
      id: `factor${maxId + 1}`,
      label: 'New Factor',
      maxPoints: 50,
      questions: [],
    }];
  }

  function removeFactor(index: number) {
    if (localFactors.length <= 1) return;
    localFactors = localFactors.filter((_, i) => i !== index);
  }

  // ─── Handlers: Questions ─────────────────────────────────────────

  function startEditQuestion(factorIdx: number, questionIdx: number) {
    editingQuestion = { factorIdx, questionIdx };
    const q = localFactors[factorIdx].questions[questionIdx];
    tempQuestionText = q.text;
    tempQuestionHelp = q.helpText || '';
  }

  function cancelEditQuestion() {
    editingQuestion = null;
  }

  function saveQuestion(factorIdx: number, questionIdx: number) {
    if (!tempQuestionText.trim()) return;
    localFactors = localFactors.map((f, i) =>
      i === factorIdx
        ? {
            ...f,
            questions: f.questions.map((q, j) =>
              j === questionIdx
                ? { ...q, text: tempQuestionText.trim(), helpText: tempQuestionHelp.trim() || undefined }
                : q
            ),
          }
        : f
    );
    editingQuestion = null;
  }

  function addQuestion(factorIdx: number) {
    const factor = localFactors[factorIdx];
    const maxQId = factor.questions.reduce((max, q) => {
      const num = parseInt(q.id.replace('q_', ''), 10) || 0;
      return num > max ? num : max;
    }, 0);
    localFactors = localFactors.map((f, i) =>
      i === factorIdx
        ? {
            ...f,
            questions: [...f.questions, {
              id: `q_${maxQId + 1}`,
              text: 'New question',
              options: [{ label: 'Option 1', points: 5 }],
            }],
          }
        : f
    );
  }

  function removeQuestion(factorIdx: number, questionIdx: number) {
    localFactors = localFactors.map((f, i) =>
      i === factorIdx
        ? { ...f, questions: f.questions.filter((_, j) => j !== questionIdx) }
        : f
    );
  }

  // ─── Handlers: Answer Options ────────────────────────────────────

  function startEditOption(factorIdx: number, questionIdx: number, optionIdx: number) {
    editingOption = { factorIdx, questionIdx, optionIdx };
    const opt = localFactors[factorIdx].questions[questionIdx].options[optionIdx];
    tempOptionLabel = opt.label;
    tempOptionPoints = opt.points;
  }

  function cancelEditOption() {
    editingOption = null;
  }

  function saveOption(factorIdx: number, questionIdx: number, optionIdx: number) {
    if (!tempOptionLabel.trim()) return;
    localFactors = localFactors.map((f, i) =>
      i === factorIdx
        ? {
            ...f,
            questions: f.questions.map((q, j) =>
              j === questionIdx
                ? {
                    ...q,
                    options: q.options.map((o, k) =>
                      k === optionIdx ? { ...o, label: tempOptionLabel.trim(), points: Math.max(0, tempOptionPoints) } : o
                    ),
                  }
                : q
            ),
          }
        : f
    );
    editingOption = null;
  }

  function addOption(factorIdx: number, questionIdx: number) {
    const factor = localFactors[factorIdx];
    const question = factor.questions[questionIdx];
    const maxPoints = question.options.reduce((max, o) => Math.max(max, o.points), 0);
    localFactors = localFactors.map((f, i) =>
      i === factorIdx
        ? {
            ...f,
            questions: f.questions.map((q, j) =>
              j === questionIdx
                ? { ...q, options: [...q.options, { label: `Option ${q.options.length + 1}`, points: maxPoints + 10 }] }
                : q
            ),
          }
        : f
    );
  }

  function removeOption(factorIdx: number, questionIdx: number, optionIdx: number) {
    localFactors = localFactors.map((f, i) =>
      i === factorIdx
        ? {
            ...f,
            questions: f.questions.map((q, j) =>
              j === questionIdx
                ? { ...q, options: q.options.filter((_, k) => k !== optionIdx) }
                : q
            ),
          }
        : f
    );
  }

  // ─── Save / Reset ────────────────────────────────────────────────

  function handleSave() {
    const errors = validate();
    if (errors.length > 0) {
      alert('Please fix the following:\n' + errors.join('\n'));
      return;
    }
    onChange(localFactors);
  }

  function handleReset() {
    localFactors = JSON.parse(JSON.stringify(factors));
  }

  function validate(): string[] {
    const errors: string[] = [];
    for (const factor of localFactors) {
      if (!factor.questions.length) {
        errors.push(`Factor "${factor.label}": must have at least 1 question.`);
      }
      for (const question of factor.questions) {
        if (!question.options.length) {
          errors.push(`Factor "${factor.label}" → "${question.text}": must have at least 1 answer option.`);
        }
      }
    }
    return errors;
  }

  function hasChanges(): boolean {
    return JSON.stringify(factors) !== JSON.stringify(localFactors);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="section-title mb-0">Factors & Questions</h3>
      <p class="text-sm text-[var(--color-text-muted)]">
        Customize the 7 evaluation factors, their questions, and answer options.
        Changes will re-grade all ungraded roles.
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
        Save Questionnaire
      </button>
    </div>
  </div>

  <!-- Guide -->
  <div class="rounded-lg border border-[var(--color-info)] bg-[var(--color-info-bg)] p-4">
    <p class="text-sm font-medium text-[var(--color-info)] mb-2">ℹ️ How factors & questions work</p>
    <p class="text-xs text-[var(--color-text-muted)] space-y-1">
      <p>The grading system evaluates each role across <strong>7 factors</strong> (Knowledge, Problem Solving, Leadership, etc.).</p>
      <p>Each factor has <strong>questions</strong> with answer options, each assigned a point value (typically 5, 20, 40, 50).</p>
      <p>The sum of all factor points (0–350) is then converted to a grade using the role's career band.</p>
      <p><strong>Best practice:</strong> Write questions that describe the <em>role's requirements</em>, not the current person's abilities. This prevents bias.</p>
      <p>💡 You can add/remove factors, questions, and answer options. The system validates that each factor has at least 1 question and each question has at least 1 option.</p>
    </p>
  </div>

  <!-- Factor Cards -->
  <div class="space-y-4">
    {#each localFactors as factor, factorIdx}
      <div class="rounded-lg border border-[var(--color-border)] overflow-hidden">
        <!-- Factor Header -->
        <div class="flex items-center justify-between p-4 bg-[var(--color-bg)]">
          {#if editingFactor === factorIdx}
            <!-- Edit Mode -->
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
              <div class="sm:col-span-4">
                <label class="label text-xs">Factor Name</label>
                <input
                  type="text"
                  class="input text-xs"
                  value={tempFactorLabel}
                  on:input={(e) => tempFactorLabel = e.currentTarget.value}
                />
              </div>
              <div class="sm:col-span-4">
                <label class="label text-xs">Help Text</label>
                <input
                  type="text"
                  class="input text-xs"
                  value={tempFactorHelp}
                  on:input={(e) => tempFactorHelp = e.currentTarget.value}
                />
              </div>
              <div class="sm:col-span-2">
                <label class="label text-xs">Max Points</label>
                <input
                  type="number"
                  class="input text-xs"
                  value={tempFactorMax}
                  on:input={(e) => tempFactorMax = +e.currentTarget.value}
                />
              </div>
              <div class="sm:col-span-2 flex gap-1">
                <button class="btn-primary text-xs" on:click={() => saveFactor(factorIdx)}>Save</button>
                <button class="btn-secondary text-xs" on:click={cancelEditFactor}>Cancel</button>
              </div>
            </div>
          {:else}
            <!-- View Mode -->
            <div class="flex-1">
              <span class="font-medium text-sm">{factor.label}</span>
              {#if factor.helpText}
                <span class="text-xs text-[var(--color-text-muted)] block">{factor.helpText}</span>
              {/if}
            </div>
            <div class="flex gap-1 ml-2">
              <button class="btn-secondary text-xs" on:click={() => startEditFactor(factorIdx)}>Edit</button>
              <button class="btn-secondary text-xs text-red-500" on:click={() => removeFactor(factorIdx)}>Delete</button>
            </div>
          {/if}
        </div>

        <!-- Questions -->
        <div class="p-4 space-y-4">
          {#each factor.questions as question, questionIdx}
            <div class="border-t border-[var(--color-border)] pt-3">
              {#if editingQuestion?.factorIdx === factorIdx && editingQuestion?.questionIdx === questionIdx}
                <!-- Question Edit Mode -->
                <div class="space-y-2">
                  <input
                    type="text"
                    class="input text-xs"
                    value={tempQuestionText}
                    on:input={(e) => tempQuestionText = e.currentTarget.value}
                    placeholder="Question text"
                  />
                  <input
                    type="text"
                    class="input text-xs"
                    value={tempQuestionHelp}
                    on:input={(e) => tempQuestionHelp = e.currentTarget.value}
                    placeholder="Help text (optional)"
                  />
                  <div class="flex gap-1">
                    <button class="btn-primary text-xs" on:click={() => saveQuestion(factorIdx, questionIdx)}>Save</button>
                    <button class="btn-secondary text-xs" on:click={cancelEditQuestion}>Cancel</button>
                  </div>
                </div>
              {:else}
                <!-- Question View Mode -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-[var(--color-text-muted)]">{question.text}</span>
                    <div class="flex gap-1">
                      <button class="btn-secondary text-xs" on:click={() => startEditQuestion(factorIdx, questionIdx)}>Edit</button>
                      <button class="btn-secondary text-xs text-red-500" on:click={() => removeQuestion(factorIdx, questionIdx)}>Delete</button>
                    </div>
                  </div>

                  <!-- Answer Options -->
                  <div class="space-y-1 ml-2">
                    {#each question.options as option, optionIdx}
                      <div class="flex items-center gap-2">
                        {#if editingOption?.factorIdx === factorIdx && editingOption?.questionIdx === questionIdx && editingOption?.optionIdx === optionIdx}
                          <!-- Option Edit Mode -->
                          <input
                            type="text"
                            class="input text-xs flex-1"
                            value={tempOptionLabel}
                            on:input={(e) => tempOptionLabel = e.currentTarget.value}
                          />
                          <input
                            type="number"
                            class="input text-xs w-16"
                            value={tempOptionPoints}
                            on:input={(e) => tempOptionPoints = +e.currentTarget.value}
                          />
                          <div class="flex gap-1">
                            <button class="btn-primary text-xs" on:click={() => saveOption(factorIdx, questionIdx, optionIdx)}>✓</button>
                            <button class="btn-secondary text-xs" on:click={cancelEditOption}>✕</button>
                          </div>
                        {:else}
                          <!-- Option View Mode -->
                          <span class="text-xs flex-1">{option.label}</span>
                          <span class="text-xs text-[var(--color-text-muted)]">{option.points} pts</span>
                          <div class="flex gap-1">
                            <button class="btn-secondary text-xs" on:click={() => startEditOption(factorIdx, questionIdx, optionIdx)}>Edit</button>
                            <button class="btn-secondary text-xs text-red-500" on:click={() => removeOption(factorIdx, questionIdx, optionIdx)}>✕</button>
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}

          <button class="btn-secondary text-xs" on:click={() => addQuestion(factorIdx)}>+ Add Question</button>
        </div>
      </div>
    {/each}
  </div>

  <button class="btn-secondary" on:click={addFactor}>+ Add Factor</button>
</div>
