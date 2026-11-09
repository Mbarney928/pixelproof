import type { Approvals, Report } from '@pixelproof/core/schema';
import { REPORT_VERSION } from '@pixelproof/core/schema';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type Decision = 'approved' | 'rejected';

const keyFor = (runId: string) => `pixelproof:review:${runId}`;

function readSaved(runId: string): Record<string, Decision> {
  try {
    const raw = window.localStorage.getItem(keyFor(runId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (e): e is [string, Decision] => e[1] === 'approved' || e[1] === 'rejected',
      ),
    );
  } catch {
    return {};
  }
}

/**
 * The reviewer's approve/reject decisions for one run. Saved in this browser per run id, so a
 * reload or a second tab never loses progress, and decisions from an older run never leak in.
 */
export const useReviewStore = defineStore('review', () => {
  const runId = ref<string | null>(null);
  const decisions = ref<Record<string, Decision>>({});

  function persist() {
    if (!runId.value) return;
    try {
      window.localStorage.setItem(keyFor(runId.value), JSON.stringify(decisions.value));
    } catch {
      // Storage can be full or blocked (private mode); decisions still work for this session.
    }
  }

  function startRun(id: string) {
    if (runId.value === id) return;
    runId.value = id;
    decisions.value = readSaved(id);
  }

  function decide(id: string, decision: Decision) {
    decisions.value = { ...decisions.value, [id]: decision };
    persist();
  }

  function undo(id: string) {
    decisions.value = Object.fromEntries(Object.entries(decisions.value).filter(([key]) => key !== id));
    persist();
  }

  function reset() {
    decisions.value = {};
    persist();
  }

  const approvedIds = computed(() =>
    Object.keys(decisions.value).filter((id) => decisions.value[id] === 'approved'),
  );
  const rejectedIds = computed(() =>
    Object.keys(decisions.value).filter((id) => decisions.value[id] === 'rejected'),
  );

  function toApprovals(report: Report): Approvals {
    const pending = new Set(report.entries.filter((e) => e.status !== 'unchanged').map((e) => e.id));
    return {
      version: REPORT_VERSION,
      runId: report.runId,
      approved: approvedIds.value.filter((id) => pending.has(id)).sort(),
      rejected: rejectedIds.value.filter((id) => pending.has(id)).sort(),
    };
  }

  return { runId, decisions, startRun, decide, undo, reset, approvedIds, rejectedIds, toApprovals };
});
