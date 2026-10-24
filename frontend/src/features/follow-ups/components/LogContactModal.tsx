import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { FieldShell } from '../../../components/common/FormField';
import { fieldClass } from '../../../components/common/fieldClass';
import { getApiErrorInfo } from '../../../api/errors';
import { useLogContact } from '../hooks/useFollowUps';
import { addDaysISO, formatISODate, isISODate, todayISO } from '../../../utils/dates';
import type { FollowUpRecord } from '../../../types/followUp';

interface LogContactModalProps {
  followUp: FollowUpRecord;
  onClose: () => void;
  onLogged: (followUp: FollowUpRecord) => void;
}

type FieldErrors = { contactedDate?: string; nextDueDate?: string };

// DL-05: logging a contact records today's contact and moves the follow-up to
// its next due date (today + "repeat every" days when set), so it leaves the
// overdue list without needing a status column.
export const LogContactModal: React.FC<LogContactModalProps> = ({ followUp, onClose, onLogged }) => {
  const today = todayISO();
  const [contactedDate, setContactedDate] = useState(today);
  const [nextDueDate, setNextDueDate] = useState(followUp.period ? addDaysISO(today, followUp.period) : '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const logContact = useLogContact();

  const onContactedDateChange = (value: string) => {
    setContactedDate(value);
    // Keep the suggested next date in step with the contact date while it follows the period.
    if (followUp.period && isISODate(value)) setNextDueDate(addDaysISO(value, followUp.period));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors: FieldErrors = {};
    if (!isISODate(contactedDate)) errors.contactedDate = 'Choose the date you made contact.';
    else if (contactedDate > today) errors.contactedDate = "The contact date can't be in the future.";
    if (!isISODate(nextDueDate)) errors.nextDueDate = 'Choose when the next follow-up is due.';
    else if (isISODate(contactedDate) && nextDueDate <= contactedDate)
      errors.nextDueDate = 'The next due date must be after the contact date.';
    setFieldErrors(errors);
    if (errors.contactedDate || errors.nextDueDate) return;

    logContact.mutate(
      { id: followUp.id, input: { contactedDate, nextDueDate } },
      {
        onSuccess: onLogged,
        onError: (error) => {
          const apiError = getApiErrorInfo(error);
          const serverErrors: FieldErrors = {};
          apiError.fieldErrors.forEach((d) => {
            if (d.field === 'contactedDate' || d.field === 'nextDueDate') serverErrors[d.field] = d.message;
          });
          setFieldErrors(serverErrors);
          if (!serverErrors.contactedDate && !serverErrors.nextDueDate) setFormError(apiError.message);
        },
      }
    );
  };

  return (
    <Modal
      open
      size="sm"
      title="Log contact"
      description={`${followUp.action} · ${followUp.contactName}`}
      onClose={onClose}
      busy={logContact.isPending}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-[var(--status-overdue-bg)] px-3 py-2.5 text-sm text-[var(--status-overdue-text)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <p className="text-sm text-[var(--text-secondary)]">
          Was due {formatISODate(followUp.dueDate)}. Logging the contact moves this follow-up to the next due date.
        </p>

        <FieldShell label="Date contacted" required error={fieldErrors.contactedDate}>
          {({ inputId, describedBy, invalid }) => (
            <input
              id={inputId}
              type="date"
              value={contactedDate}
              max={today}
              onChange={(e) => onContactedDateChange(e.target.value)}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-required
              className={fieldClass(invalid)}
            />
          )}
        </FieldShell>

        <FieldShell
          label="Next due date"
          required
          hint={
            followUp.period
              ? `Suggested from "repeat every ${followUp.period} days". You can change it.`
              : 'No repeat interval is set, so choose the next date.'
          }
          error={fieldErrors.nextDueDate}
        >
          {({ inputId, describedBy, invalid }) => (
            <input
              id={inputId}
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-required
              className={fieldClass(invalid)}
            />
          )}
        </FieldShell>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={logContact.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={logContact.isPending}>
            Log contact
          </Button>
        </div>
      </form>
    </Modal>
  );
};
