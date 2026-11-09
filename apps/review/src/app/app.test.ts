import { screen, waitFor, within } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '@/test/axe';
import { fakeFetch, REPORT_URL, sampleReport } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';

const HOME = '/snapshot/demo-shop-home--desktop--light';

describe('run overview', () => {
  it('summarises the run and lists what needs review', async () => {
    const { container } = await renderApp('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Visual review' })).toBeInTheDocument();
    expect(screen.getByText(/run-abc1/)).toBeInTheDocument();
    expect(screen.getByText('0 of 5 reviewed')).toBeInTheDocument();

    const table = screen.getByRole('region', { name: 'Snapshot table' });
    // Default filter is "needs review": unchanged snapshots are hidden.
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 5);
    expect(screen.getByText('5 snapshots')).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it('filters through the URL so a filtered list can be shared', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/');
    await screen.findByRole('heading', { name: 'Visual review' });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Theme' }), 'dark');
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({ theme: 'dark' });
    });
    expect(screen.getByText('2 snapshots')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'nothing-matches');
    expect(await screen.findByText('No snapshots match')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({});
    });
  });

  it('restores filters from a shared link', async () => {
    await renderApp('/?status=all&viewport=mobile');
    await screen.findByRole('heading', { name: 'Visual review' });
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('all');
    expect(screen.getByText('3 snapshots')).toBeInTheDocument();
  });

  it('ranks the largest changes and offers the same data as a table', async () => {
    const user = userEvent.setup();
    const { container } = await renderApp('/');
    await screen.findByRole('heading', { name: 'Largest changes' });

    const bars = screen.getAllByRole('link', { name: /of pixels changed/ });
    expect(bars.map((b) => b.textContent.trim().split(':')[0])).toEqual([
      'Demo shop / Home · desktop · light',
      'Demo shop / Pricing · mobile · dark',
      'Demo shop / Checkout · desktop · dark',
    ]);

    bars[0]?.focus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('64,000 px changed (6.3%)');

    await user.click(screen.getByRole('button', { name: 'Show table' }));
    const table = screen.getByRole('region', { name: 'Largest changes table' });
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByText('0.810')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('opens a snapshot from the list', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/?theme=dark');
    await screen.findByRole('heading', { name: 'Visual review' });
    const table = screen.getByRole('region', { name: 'Snapshot table' });
    await user.click(within(table).getByRole('link', { name: /Pricing/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Pricing' })).toBeInTheDocument();
    // The filter context travels with the reviewer.
    expect(router.currentRoute.value.query).toEqual({ theme: 'dark' });
  });
});

describe('snapshot review', () => {
  it('shows the measurements and focuses the heading for screen readers', async () => {
    const { container } = await renderApp(HOME);
    const heading = await screen.findByRole('heading', { level: 1, name: 'Home' });
    await waitFor(() => {
      expect(heading).toHaveFocus();
    });
    expect(screen.getByText('64,000 (6.3%)')).toBeInTheDocument();
    expect(screen.getByText('0.810')).toBeInTheDocument();
    expect(screen.getByText('1 of 5')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Difference/ })).toHaveAttribute(
      'src',
      'http://localhost/report/diff/demo-shop-home--desktop--light.png',
    );
    expect(screen.getByRole('heading', { name: '2 changed regions' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('approves and rejects with the keyboard, advancing through the list', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp(HOME);
    await screen.findByRole('heading', { level: 1, name: 'Home' });

    await user.keyboard('a');
    expect(await screen.findByRole('heading', { level: 1, name: 'Pricing' })).toBeInTheDocument();
    expect(router.currentRoute.value.params.id).toBe('demo-shop-pricing--mobile--dark');

    await user.click(screen.getByRole('checkbox', { name: /next snapshot after deciding/ }));
    await user.keyboard('r');
    expect(screen.getByRole('status')).toHaveTextContent('Rejected Pricing');
    expect(screen.getByText('Rejected', { selector: '.badge *, .badge' })).toBeInTheDocument();

    await user.keyboard('u');
    expect(screen.getByRole('status')).toHaveTextContent('Decision on Pricing cleared');
    expect(screen.getByText('Awaiting review')).toBeInTheDocument();

    await user.keyboard('k');
    expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);

    await user.keyboard('{Escape}');
    expect(await screen.findByRole('heading', { level: 1, name: 'Visual review' })).toBeInTheDocument();
    expect(screen.getByText('1 of 5 reviewed')).toBeInTheDocument();
  });

  it('ignores shortcuts while typing and with modifier keys', async () => {
    const user = userEvent.setup();
    await renderApp(HOME);
    await screen.findByRole('heading', { level: 1, name: 'Home' });
    await user.keyboard('{Meta>}a{/Meta}');
    expect(screen.getByText('Awaiting review')).toBeInTheDocument();
  });

  it('switches comparison views with buttons and number keys', async () => {
    const user = userEvent.setup();
    const { container } = await renderApp(HOME);
    await screen.findByRole('heading', { level: 1, name: 'Home' });

    await user.keyboard('2');
    expect(screen.getByRole('img', { name: /Baseline/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Current/ })).toBeInTheDocument();

    await user.keyboard('3');
    const divider = screen.getByRole('slider', { name: /Divider position/ });
    expect(divider).toHaveValue('50');

    await user.click(screen.getByRole('radio', { name: /Onion/ }));
    expect(screen.getByRole('slider', { name: /Current opacity/ })).toBeInTheDocument();
    await expectNoAxeViolations(container);

    await user.keyboard('z');
    expect(screen.getByRole('button', { name: /Actual size/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('explains snapshots without a baseline or a current image', async () => {
    await renderApp('/snapshot/demo-shop-gift-cards--desktop--light');
    await screen.findByRole('heading', { level: 1, name: 'Gift cards' });
    expect(screen.getByText(/no longer captured/)).toBeInTheDocument();

    await renderApp('/snapshot/demo-shop-home--mobile--light');
    expect(await screen.findByText('Matches the baseline. Nothing to review.')).toBeInTheDocument();
  });

  it('reports an unknown snapshot id', async () => {
    await renderApp('/snapshot/does-not-exist');
    expect(await screen.findByText('Snapshot not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All snapshots/ })).toBeInTheDocument();
  });
});

describe('exporting approvals', () => {
  it('downloads approvals.json for the CLI', async () => {
    const user = userEvent.setup();
    const created: Blob[] = [];
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: (b: Blob) => {
          created.push(b);
          return 'blob:approvals';
        },
        revokeObjectURL: () => undefined,
      }),
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await renderApp(HOME);
    await screen.findByRole('heading', { level: 1, name: 'Home' });
    await user.keyboard('a');
    await user.keyboard('{Escape}');

    await user.click(await screen.findByRole('button', { name: 'Export approvals (1)' }));
    expect(click).toHaveBeenCalledOnce();
    expect(JSON.parse((await created[0]?.text()) ?? '{}')).toEqual({
      version: 1,
      runId: 'run-abc12345',
      approved: ['demo-shop-home--desktop--light'],
      rejected: [],
    });
    expect(screen.getByText(/Saved. Apply it with/)).toBeInTheDocument();
    click.mockRestore();
  });

  it('remembers decisions after a reload', async () => {
    const user = userEvent.setup();
    await renderApp(HOME);
    await screen.findByRole('heading', { level: 1, name: 'Home' });
    await user.keyboard('a');
    document.body.innerHTML = '';

    await renderApp('/');
    expect(await screen.findByText('1 of 5 reviewed')).toBeInTheDocument();
  });
});

describe('loading and errors', () => {
  it('announces loading, then shows a missing-report message without a retry', async () => {
    let resolve: (r: Response) => void = () => undefined;
    await renderApp('/', () => new Promise((r) => (resolve = r)));
    expect(screen.getByRole('status')).toHaveTextContent('Loading report');
    resolve(new Response('', { status: 404 }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/No report/i);
    expect(screen.queryByRole('button', { name: /Try again/i })).not.toBeInTheDocument();
  });

  it('offers a retry after a network failure', async () => {
    const user = userEvent.setup();
    let calls = 0;
    await renderApp('/', () => {
      calls += 1;
      return calls === 1 ? Promise.reject(new TypeError('offline')) : fakeFetch(sampleReport())(REPORT_URL);
    });
    await user.click(await screen.findByRole('button', { name: /Try again/i }));
    expect(await screen.findByRole('heading', { name: 'Visual review' })).toBeInTheDocument();
  });

  it('rejects a report it cannot read', async () => {
    await renderApp('/', fakeFetch({ version: 3 }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('shell', () => {
  it('has a skip link, a not-found page and a remembered theme', async () => {
    const user = userEvent.setup();
    const { container } = await renderApp('/nowhere');
    expect(await screen.findByRole('heading', { level: 1, name: /not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Skip to/i })).toHaveAttribute('href', '#main');

    await user.click(screen.getByRole('radio', { name: /Dark/ }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('pixelproof:theme')).toContain('dark');
    await expectNoAxeViolations(container);
  });
});
