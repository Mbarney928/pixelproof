import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { sampleReport } from '@/test/fixtures';

import { useReviewStore } from './store';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('review store', () => {
  it('records, persists and restores decisions per run', () => {
    const review = useReviewStore();
    review.startRun('run-1');
    review.decide('a', 'approved');
    review.decide('b', 'rejected');
    review.undo('b');
    expect(review.decisions).toEqual({ a: 'approved' });

    setActivePinia(createPinia());
    const reopened = useReviewStore();
    reopened.startRun('run-1');
    expect(reopened.decisions).toEqual({ a: 'approved' });
    reopened.startRun('run-2');
    expect(reopened.decisions).toEqual({});
  });

  it('ignores damaged saved data', () => {
    window.localStorage.setItem('pixelproof:review:run-x', '{"a":"approved","b":"maybe","c":1}');
    const review = useReviewStore();
    review.startRun('run-x');
    expect(review.decisions).toEqual({ a: 'approved' });
    window.localStorage.setItem('pixelproof:review:run-y', 'not json');
    review.startRun('run-y');
    expect(review.decisions).toEqual({});
  });

  it('exports only decisions for snapshots that need review', () => {
    const report = sampleReport();
    const review = useReviewStore();
    review.startRun(report.runId);
    review.decide('demo-shop-home--desktop--light', 'approved');
    review.decide('demo-shop-about--mobile--light', 'approved');
    review.decide('demo-shop-pricing--mobile--dark', 'rejected');
    review.decide('demo-shop-home--mobile--light', 'approved'); // unchanged: never exported
    expect(review.toApprovals(report)).toEqual({
      version: 1,
      runId: 'run-abc12345',
      approved: ['demo-shop-about--mobile--light', 'demo-shop-home--desktop--light'],
      rejected: ['demo-shop-pricing--mobile--dark'],
    });
    review.reset();
    expect(review.toApprovals(report).approved).toEqual([]);
  });
});
