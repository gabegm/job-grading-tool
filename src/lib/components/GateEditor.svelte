<script lang="ts">
  import type { GateQuestion, AnswerOption } from '../types';

  // ─── Props ───────────────────────────────────────────────────────

  export let gateQuestions: GateQuestion[] = [];
  export let onChange = (g: GateQuestion[]) => {};

  // ─── State ───────────────────────────────────────────────────────

  let localGates: GateQuestion[] = [];
  let editingGate: number | null = null;
  let editingOption: { gateIdx: number; optionIdx: number } | null = null;

  // Temporary edit values
  let tempGateText = '';
  let tempGateHelp = '';
  let tempGateType: 'boolean' | 'dropdown' = 'boolean';
  let tempGateAppliesTo: 'ic' | 'manager' | 'both' = 'both';
  let tempOptionLabel = '';
  let tempOptionPoints = 0;

  // ─── Lifecycle ───────────────────────────────────────────────────

  $: {
    localGates = JSON.parse(JSON.stringify(gateQuestions));
  }

  // ─── Handlers: Gates ─────────────────────────────────────────────

  function startEditGate(index: number) {
    editingGate = index;
    const g = localGates[index];
    tempGateText = g.text;
    tempGateHelp = g.helpText || '';
    tempGateType = g.type;
    tempGateAppliesTo = g.appliesTo || 'both';
  }

  function cancelEditGate() {
    editingGate = null;
  }

  function saveGate(index: number) {
    if (!tempGateText.trim()) return;
    localGates = localGates.map((g, i) =>
      i === index
        ? {
            ...g,
            text: tempGateText.trim(),
            helpText: tempGateHelp.trim() || undefined,
            type: tempGateType,
            appliesTo: tempGateAppliesTo,
          }
        : g
    );
    editingGate = null;
  }

  function addGate() {
    localGates = [...localGates, {
      id: `gate${localGates.length + 1}`,
      text: 'New gate question',
      type: 'boolean',
      appliesTo: 'both',
    }];
  }

  function removeGate(index: number) {
    if (localGates.length <= 1) return;
    localGates = localGates.filter((_, i) => i !== index);
  }

  // ─── Handlers: Gate Options (for dropdown type) ──────────────────

  function startEditOption(gateIdx: number, optionIdx: number) {
    editingOption = { gateIdx, optionIdx };
    const opt = localGates[gateIdx].options?.[optionIdx];
    tempOptionLabel = opt?.label || '';
    tempOptionPoints = opt?.points || 0;
  }

  function cancelEditOption() {
    editingOption = null;
  }

  function saveOption(gateIdx: number, optionIdx: number) {
    if (!tempOptionLabel.trim()) return;
    localGates = localGates.map((g, i) =>
      i === gateIdx
        ? {
            ...g,
            options: (g.options || []).map((o, j) =>
              j === optionIdx ? { label: tempOptionLabel.trim(), points: Math.max(0, tempOptionPoints) } : o
            ),
          }
        : g
    );
    editingOption = null;
  }

  function addOption(gateIdx: number) {
    const gate = localGates[gateIdx];
    const existing = gate.options || [];
    const maxPoints = existing.reduce((max, o) => Math.max(max, o.points), 0);
    localGates = localGates.map((g, i) =>
      i === gateIdx
        ? {
            ...g,
            options: [...(g.options || []), { label: `Option ${existing.length + 1}`, points: maxPoints + 10 }],
          }
        : g
    );
  }

  function removeOption(gateIdx: number, optionIdx: number) {
    localGates = localGates.map((g, i) =>
      i === gateIdx
        ? { ...g, options: (g.options || []).filter((_, j) => j !== optionIdx) }
        : g
    );
  }

  // ─── Save / Reset ────────────────────────────────────────────────

  function handleSave() {
    onChange(localGates);
  }

  function handleReset() {
    localGates = JSON.parse(JSON.stringify(gateQuestions));
  }

  function hasChanges(): boolean {
    return JSON.stringify(gateQuestions) !== JSON.stringify(localGates);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="section-title mb-0">Gate Questions</h3>
      <p class="text-sm text-[var(--color-text-muted)]">
        Define gate questions that check whether a role has sufficient authority
        to reach higher grades. Gates are track-specific (IC checks autonomy,
        Manager checks team management).
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
        Save Gates
      </button>
    </div>
  </div>

  <!-- Guide -->
  <div class="rounded-lg border border-[var(--color-info)] bg-[var(--color-info-bg)] p-4">
    <p class="text-sm font-medium text-[var(--color-info)] mb-2">ℹ️ How gates work</p>
    <p class="text-xs text-[var(--color-text-muted)] space-y-1">
      <p>Gates prevent roles from reaching high grades without the corresponding <strong>authority or impact</strong>.</p>
      <p>Unlike a hard gate (which would abruptly cap grades), this is a <strong>soft gate</strong>: if both criteria fail, the grade is reduced by exactly 1 level (minimum grade 4).</p>
      <p><strong>IC track</strong> checks: <em>Decision Autonomy</em> + <em>Financial Authority</em></p>
      <p><strong>Manager track</strong> checks: <em>Team Management</em> + <em>Financial Authority</em></p>
      <p>💡 Gate criteria are track-specific because autonomy means different things for ICs vs Managers. An IC needs decision-making authority over their work; a Manager needs authority over a team.</p>
      <p>⚠️ Both criteria must fail for the gate to apply. If either passes, no cap is applied.</p>
    </p>
  </div>

  <!-- Gate Cards -->
  <div class="space-y-4">
    {#each localGates as gate, gateIdx}
      <div class="rounded-lg border border-[var(--color-border)] overflow-hidden">
        <!-- Gate Header -->
        <div class="flex items-center justify-between p-4 bg-[var(--color-bg)]">
          {#if editingGate === gateIdx}
            <!-- Edit Mode -->
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
              <div class="sm:col-span-5">
                <label class="label text-xs">Question Text</label>
                <input
                  type="text"
                  class="input text-xs"
                  value={tempGateText}
                  on:input={(e) => tempGateText = e.currentTarget.value}
                />
              </div>
              <div class="sm:col-span-3">
                <label class="label text-xs">Help Text</label>
                <input
                  type="text"
                  class="input text-xs"
                  value={tempGateHelp}
                  on:input={(e) => tempGateHelp = e.currentTarget.value}
                />
              </div>
              <div class="sm:col-span-2">
                <label class="label text-xs">Type</label>
                <select
                  class="input text-xs"
                  value={tempGateType}
                  on:input={(e) => tempGateType = e.currentTarget.value as 'boolean' | 'dropdown'}
                >
                  <option value="boolean">Boolean (Yes/No)</option>
                  <option value="dropdown">Dropdown (Multiple)</option>
                </select>
              </div>
              <div class="sm:col-span-2 flex gap-1">
                <button class="btn-primary text-xs" on:click={() => saveGate(gateIdx)}>Save</button>
                <button class="btn-secondary text-xs" on:click={cancelEditGate}>Cancel</button>
              </div>
            </div>
          {:else}
            <!-- View Mode -->
            <div class="flex-1">
              <span class="font-medium text-sm">{gate.text}</span>
              {#if gate.helpText}
                <span class="text-xs text-[var(--color-text-muted)] block">{gate.helpText}</span>
              {/if}
              <span class="text-xs badge inline-block ml-2">
                {gate.type === 'boolean' ? 'Yes/No' : 'Dropdown'} · Applies to: {gate.appliesTo || 'both'}
              </span>
            </div>
            <div class="flex gap-1 ml-2">
              <button class="btn-secondary text-xs" on:click={() => startEditGate(gateIdx)}>Edit</button>
              <button class="btn-secondary text-xs text-red-500" on:click={() => removeGate(gateIdx)}>Delete</button>
            </div>
          {/if}
        </div>

        <!-- Options (for dropdown type) -->
        {#if gate.type === 'dropdown' && gate.options}
          <div class="p-4 space-y-2">
            {#each gate.options as option, optionIdx}
              <div class="flex items-center gap-2">
                {#if editingOption?.gateIdx === gateIdx && editingOption?.optionIdx === optionIdx}
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
                    <button class="btn-primary text-xs" on:click={() => saveOption(gateIdx, optionIdx)}>✓</button>
                    <button class="btn-secondary text-xs" on:click={cancelEditOption}>✕</button>
                  </div>
                {:else}
                  <!-- Option View Mode -->
                  <span class="text-xs flex-1">{option.label}</span>
                  <span class="text-xs text-[var(--color-text-muted)]">{option.points} pts</span>
                  <div class="flex gap-1">
                    <button class="btn-secondary text-xs" on:click={() => startEditOption(gateIdx, optionIdx)}>Edit</button>
                    <button class="btn-secondary text-xs text-red-500" on:click={() => removeOption(gateIdx, optionIdx)}>✕</button>
                  </div>
                {/if}
              </div>
            {/each}
            <button class="btn-secondary text-xs" on:click={() => addOption(gateIdx)}>+ Add Option</button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <button class="btn-secondary" on:click={addGate}>+ Add Gate</button>
</div>
