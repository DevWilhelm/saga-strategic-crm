import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceListPage } from '../pages/ServiceListPage';
import { serviceHandlers } from '../../../mocks/handlers/services';
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
      <ServiceListPage />
    </QueryClientProvider>
  );

describe('ServiceListPage', () => {
  beforeEach(() => {
    apiClient.defaults.adapter = createMswAdapter(serviceHandlers);
    resetLookupStore();
    actAs('usr-ploy'); // ADMIN
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('lists the services from the mock store by name', async () => {
    renderPage();

    expect(await screen.findByText('Commercial Due Diligence')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–4 of 4')).toBeInTheDocument();
    const [, firstRow] = screen.getAllByRole('row');
    expect(firstRow).toHaveTextContent('Commercial Due Diligence');
    expect(firstRow).toHaveTextContent('Active');
  });

  it('searches by name', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Commercial Due Diligence');

    await user.type(screen.getByLabelText('Search services'), 'market');

    await waitFor(() => expect(screen.queryByText('Commercial Due Diligence')).not.toBeInTheDocument());
    expect(screen.getByText('Cross-Border Market Entry')).toBeInTheDocument();
  });

  it('checks the form, reports a duplicate, then adds a service the Accounts form can use', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Commercial Due Diligence');

    await user.click(screen.getByRole('button', { name: 'Add service' }));
    const dialog = screen.getByRole('dialog', { name: 'Add service' });
    const submit = within(dialog).getByRole('button', { name: 'Add service' });

    await user.click(submit);
    expect(within(dialog).getByText('Enter a service name.')).toBeInTheDocument();

    const name = within(dialog).getByLabelText(/Name/);
    await user.type(name, 'strategic partnerships');
    await user.click(submit);
    expect(
      await within(dialog).findByText("A service named 'strategic partnerships' already exists.")
    ).toBeInTheDocument();

    await user.clear(name);
    await user.type(name, 'Valuation Advisory');
    await user.click(submit);

    expect(await screen.findByRole('status')).toHaveTextContent('Valuation Advisory was added.');
    // Same store as GET /api/accounts/lookups, so the account form's Service dropdown has it.
    expect(mockStore.services.map((s) => s.name)).toContain('Valuation Advisory');
  });

  it('deactivates a service after confirmation', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Strategic Partnerships');

    await user.click(screen.getByRole('button', { name: 'Deactivate Strategic Partnerships' }));
    const dialog = screen.getByRole('dialog', { name: 'Deactivate service?' });
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Strategic Partnerships is now inactive.');
    const row = await screen.findByRole('row', { name: /Strategic Partnerships/ });
    await waitFor(() => expect(within(row).getByText('Inactive')).toBeInTheDocument());
  });

  it('shows the server message when a member tries to save', async () => {
    actAs('usr-1'); // MEMBER: no lookup.manage
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Commercial Due Diligence');

    await user.click(screen.getByRole('button', { name: 'Edit Commercial Due Diligence' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit service' });
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'You do not have permission to manage services.'
    );
  });
});
