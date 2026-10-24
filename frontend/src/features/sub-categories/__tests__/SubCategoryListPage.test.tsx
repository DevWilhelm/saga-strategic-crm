import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubCategoryListPage } from '../pages/SubCategoryListPage';
import { categoryHandlers } from '../../../mocks/handlers/categories';
import { subCategoryHandlers } from '../../../mocks/handlers/subCategories';
import { resetLookupStore } from '../../../mocks/handlers/lookupHelpers';
import { mockStore } from '../../../mocks/store';
import { apiClient } from '../../../api/client';
import { createMswAdapter } from '../../../test/mswAdapter';

const originalAdapter = apiClient.defaults.adapter;

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SubCategoryListPage />
    </QueryClientProvider>
  );

// Parent category options load separately from the list; wait for them.
// Options are picked by value: selectOptions compares labels as HTML, so a
// name with "&" would not match.
const waitForParentOptions = (container: HTMLElement) =>
  within(container).findByRole('option', { name: 'Hospitals / Providers' });

describe('SubCategoryListPage', () => {
  beforeEach(() => {
    apiClient.defaults.adapter = createMswAdapter([...categoryHandlers, ...subCategoryHandlers]);
    resetLookupStore();
    sessionStorage.setItem('dev_mock_user_id', 'usr-ploy'); // ADMIN
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('lists sub-categories grouped by parent category', async () => {
    renderPage();

    expect(await screen.findByText('Listed group')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–9 of 9')).toBeInTheDocument();
    const [, firstRow] = screen.getAllByRole('row');
    expect(firstRow).toHaveTextContent('Listed group');
    expect(firstRow).toHaveTextContent('Hospitals / Providers');
  });

  it('filters by parent category', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Listed group');

    const parentFilter = screen.getByLabelText('Filter by parent category');
    await waitForParentOptions(parentFilter);
    await user.selectOptions(parentFilter, 'cat-pe');

    expect(await screen.findByText('Showing 1–2 of 2')).toBeInTheDocument();
    expect(screen.getByText('Buyout / control fund')).toBeInTheDocument();
    expect(screen.getByText('Growth equity')).toBeInTheDocument();
    expect(screen.queryByText('Listed group')).not.toBeInTheDocument();
  });

  it('needs a parent and a name, rejects a duplicate in the same category, allows it in another', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Listed group');

    await user.click(screen.getByRole('button', { name: 'Add sub-category' }));
    const dialog = screen.getByRole('dialog', { name: 'Add sub-category' });
    const submit = within(dialog).getByRole('button', { name: 'Add sub-category' });

    await user.click(submit);
    expect(within(dialog).getByText('Choose a parent category.')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter a sub-category name.')).toBeInTheDocument();

    const parent = within(dialog).getByLabelText(/Parent category/);
    await waitForParentOptions(parent);
    await user.selectOptions(parent, 'cat-hosp');
    await user.type(within(dialog).getByLabelText(/^Name/), 'Listed group');
    await user.click(submit);
    expect(
      await within(dialog).findByText("Hospitals / Providers already has a sub-category named 'Listed group'.")
    ).toBeInTheDocument();

    await user.selectOptions(parent, 'cat-medtech');
    await user.click(submit);
    expect(await screen.findByRole('status')).toHaveTextContent('Listed group was added to MedTech & Devices.');
    // Same store as GET /api/accounts/lookups, so the account form's dropdown has it.
    expect(mockStore.subCategories.some((s) => s.name === 'Listed group' && s.categoryId === 'cat-medtech')).toBe(true);
  });

  it('preselects the filtered category when adding', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Listed group');

    const parentFilter = screen.getByLabelText('Filter by parent category');
    await waitForParentOptions(parentFilter);
    await user.selectOptions(parentFilter, 'cat-pharma');
    await user.click(screen.getByRole('button', { name: 'Add sub-category' }));

    const dialog = screen.getByRole('dialog', { name: 'Add sub-category' });
    await waitFor(() =>
      expect(within(dialog).getByLabelText(/Parent category/)).toHaveDisplayValue('Pharmaceuticals & Biotech')
    );
  });

  it('will not activate a sub-category whose category is inactive', async () => {
    mockStore.categories = mockStore.categories.map((c) => (c.id === 'cat-pe' ? { ...c, status: 'INACTIVE' } : c));
    mockStore.subCategories = mockStore.subCategories.map((s) =>
      s.id === 'sub-pe-growth' ? { ...s, status: 'INACTIVE' } : s
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Activate Growth equity' }));
    const dialog = screen.getByRole('dialog', { name: 'Activate sub-category?' });
    await user.click(within(dialog).getByRole('button', { name: 'Activate' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Private Equity & Funds is inactive. Activate the category first, or choose an active one.'
    );
  });
});
