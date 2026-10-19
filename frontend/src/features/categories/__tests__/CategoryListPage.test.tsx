import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryListPage } from '../pages/CategoryListPage';
import { categoryHandlers } from '../../../mocks/handlers/categories';
import { resetLookupStore } from '../../../mocks/handlers/lookupHelpers';
import { mockStore } from '../../../mocks/store';
import { apiClient } from '../../../api/client';
import { createMswAdapter } from '../../../test/mswAdapter';

const originalAdapter = apiClient.defaults.adapter;

// The mock store answers as this user (see MockStore.getCurrentMockUserId).
const actAs = (userId: 'usr-ploy' | 'usr-1') => sessionStorage.setItem('dev_mock_user_id', userId);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <CategoryListPage />
    </QueryClientProvider>
  );

describe('CategoryListPage', () => {
  beforeEach(() => {
    apiClient.defaults.adapter = createMswAdapter(categoryHandlers);
    resetLookupStore();
    actAs('usr-ploy'); // ADMIN
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('lists the categories from the mock store by name', async () => {
    renderPage();

    expect(await screen.findByText('Hospitals / Providers')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–4 of 4')).toBeInTheDocument();
    const [, firstRow] = screen.getAllByRole('row');
    expect(firstRow).toHaveTextContent('Hospitals / Providers');
    expect(firstRow).toHaveTextContent('Active');
  });

  it('searches by name', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Hospitals / Providers');

    await user.type(screen.getByLabelText('Search categories'), 'pharma');

    await waitFor(() => expect(screen.queryByText('Hospitals / Providers')).not.toBeInTheDocument());
    expect(screen.getByText('Pharmaceuticals & Biotech')).toBeInTheDocument();
  });

  it('checks the form, reports a duplicate, then adds a category the Accounts form can use', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Hospitals / Providers');

    await user.click(screen.getByRole('button', { name: 'Add category' }));
    const dialog = screen.getByRole('dialog', { name: 'Add category' });
    const submit = within(dialog).getByRole('button', { name: 'Add category' });

    await user.click(submit);
    expect(within(dialog).getByText('Enter a category name.')).toBeInTheDocument();

    const name = within(dialog).getByLabelText(/Name/);
    await user.type(name, 'private equity & funds');
    await user.click(submit);
    expect(
      await within(dialog).findByText("A category named 'private equity & funds' already exists.")
    ).toBeInTheDocument();

    await user.clear(name);
    await user.type(name, 'Sovereign Wealth Funds');
    await user.click(submit);

    expect(await screen.findByRole('status')).toHaveTextContent('Sovereign Wealth Funds was added.');
    // Same store as GET /api/accounts/lookups, so the account form sees it too.
    expect(mockStore.categories.map((c) => c.name)).toContain('Sovereign Wealth Funds');
  });

  it('deactivates a category after confirmation', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Hospitals / Providers');

    await user.click(screen.getByRole('button', { name: 'Deactivate Hospitals / Providers' }));
    const dialog = screen.getByRole('dialog', { name: 'Deactivate category?' });
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Hospitals / Providers is now inactive.');
    const row = await screen.findByRole('row', { name: /Hospitals \/ Providers/ });
    await waitFor(() => expect(within(row).getByText('Inactive')).toBeInTheDocument());
  });

  it('shows the server message when a member tries to save', async () => {
    actAs('usr-1'); // MEMBER: no lookup.manage
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Hospitals / Providers');

    await user.click(screen.getByRole('button', { name: 'Edit Hospitals / Providers' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit category' });
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'You do not have permission to manage categories.'
    );
  });
});
