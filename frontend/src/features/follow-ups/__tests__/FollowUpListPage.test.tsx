import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../context/AuthContext';
import { FollowUpListPage } from '../pages/FollowUpListPage';
import { followUpHandlers, resetFollowUpStore } from '../../../mocks/handlers/followUps';
import { userHandlers } from '../../../mocks/handlers/users';
import { mockStore } from '../../../mocks/store';
import { apiClient } from '../../../api/client';
import { createMswAdapter } from '../../../test/mswAdapter';
import { addDaysISO, todayISO } from '../../../utils/dates';

const originalAdapter = apiClient.defaults.adapter;

// Signed in as this mock user (token present, mock store answers as them).
const signInAs = (userId: 'usr-ploy' | 'usr-1') => {
  sessionStorage.setItem('crm.accessToken', `mock-token.${userId}`);
  sessionStorage.setItem('dev_mock_user_id', userId);
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthProvider>
        <FollowUpListPage />
      </AuthProvider>
    </QueryClientProvider>
  );

const tab = (label: RegExp) => screen.getByRole('button', { name: label });

describe('FollowUpListPage', () => {
  beforeEach(() => {
    apiClient.defaults.adapter = createMswAdapter([...followUpHandlers, ...userHandlers]);
    resetFollowUpStore();
    signInAs('usr-ploy'); // ADMIN
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("shows my follow-ups by default and everyone's on request, soonest first", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Send revised pilot proposal')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–2 of 2')).toBeInTheDocument();
    await waitFor(() => expect(tab(/^This week/)).toHaveTextContent('2'));

    await user.selectOptions(screen.getByLabelText('Whose follow-ups'), 'everyone');

    expect(await screen.findByText('Showing 1–5 of 5')).toBeInTheDocument();
    const [, firstRow] = screen.getAllByRole('row');
    expect(firstRow).toHaveTextContent('Dr. Robert Harrison');
    expect(firstRow).toHaveTextContent('Overdue');
    await waitFor(() => expect(tab(/^Overdue/)).toHaveTextContent('1'));
  });

  it('filters by due-date tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Send revised pilot proposal');
    await user.selectOptions(screen.getByLabelText('Whose follow-ups'), 'everyone');
    await screen.findByText('Showing 1–5 of 5');

    await user.click(tab(/^Today/));

    expect(await screen.findByText('Showing 1–1 of 1')).toBeInTheDocument();
    expect(screen.getByText('Confirm attendee list for partner pitch next Thursday')).toBeInTheDocument();
  });

  it('logs a contact, which moves the follow-up out of the overdue list', async () => {
    const user = userEvent.setup();
    const nextDue = addDaysISO(todayISO(), 14);
    renderPage();
    await screen.findByText('Send revised pilot proposal');
    await user.selectOptions(screen.getByLabelText('Whose follow-ups'), 'everyone');

    await user.click(
      await screen.findByRole('button', { name: 'Log contact for Follow up on regulatory validation schedule' })
    );
    const dialog = screen.getByRole('dialog', { name: 'Log contact' });

    // No "repeat every" on this one, so the next date must be chosen.
    await user.click(within(dialog).getByRole('button', { name: 'Log contact' }));
    expect(within(dialog).getByText('Choose when the next follow-up is due.')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/Next due date/), { target: { value: nextDue } });
    await user.click(within(dialog).getByRole('button', { name: 'Log contact' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Contact with Dr. Robert Harrison logged.');
    await waitFor(() => expect(tab(/^Overdue/)).toHaveTextContent('0'));
    const saved = mockStore.followUps.find((f) => f.id === 'flw-003');
    expect(saved).toMatchObject({ lastContactedDate: todayISO(), dueDate: nextDue });
    // Bside's account contacts tab reads this field.
    expect(mockStore.contacts.find((c) => c.id === 'cnt-004')?.nextFollowUpDate).toBe(nextDue);
  });

  it('checks the form, then adds a repeating follow-up', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Send revised pilot proposal');

    await user.click(screen.getByRole('button', { name: 'Add follow-up' }));
    const dialog = screen.getByRole('dialog', { name: 'Add follow-up' });
    const submit = within(dialog).getByRole('button', { name: 'Add follow-up' });

    await user.click(submit);
    expect(within(dialog).getByText('Choose a contact.')).toBeInTheDocument();
    expect(within(dialog).getByText(/Describe the next action/)).toBeInTheDocument();

    const contact = within(dialog).getByLabelText(/^Contact/);
    await within(contact).findByRole('option', { name: /Thanawat Ratanaporn/ });
    await user.selectOptions(contact, 'cnt-003');
    await user.type(within(dialog).getByLabelText(/Next action/), 'Book hospital walkthrough');
    await user.type(within(dialog).getByLabelText(/Repeat every/), '0');
    await user.click(submit);
    expect(within(dialog).getByText(/Enter a whole number of days from 1 to 365/)).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText(/Repeat every/));
    await user.type(within(dialog).getByLabelText(/Repeat every/), '14');
    await user.click(submit);

    expect(await screen.findByRole('status')).toHaveTextContent('Follow-up with Thanawat Ratanaporn added');
    expect(mockStore.followUps.find((f) => f.action === 'Book hospital walkthrough')).toMatchObject({
      contactId: 'cnt-003',
      ownerId: 'usr-ploy',
      period: 14,
    });
  });

  it("lets a member work only on their own follow-ups", async () => {
    signInAs('usr-1'); // MEMBER
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Follow up on regulatory validation schedule');
    await user.selectOptions(screen.getByLabelText('Whose follow-ups'), 'everyone');

    const othersRow = await screen.findByRole('row', { name: /Alistair Vance/ });
    expect(within(othersRow).getByText('View only')).toBeInTheDocument();
    const ownRow = screen.getByRole('row', { name: /Dr. Robert Harrison/ });
    expect(within(ownRow).getByRole('button', { name: /Log contact/ })).toBeInTheDocument();
  });
});
