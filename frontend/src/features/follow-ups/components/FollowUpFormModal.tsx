import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { FieldShell } from '../../../components/common/FormField';
import { fieldClass } from '../../../components/common/fieldClass';
import { getApiErrorInfo } from '../../../api/errors';
import { useAuth } from '../../../context/AuthContext';
import { useUserOptions } from '../../users/hooks/useUsers';
import { useContactOptions, useSaveFollowUp } from '../hooks/useFollowUps';
import { addDaysISO, isISODate, todayISO } from '../../../utils/dates';
import {
  FOLLOW_UP_ACTION_MAX,
  FOLLOW_UP_PERIOD_MAX,
  FOLLOW_UP_REMARK_MAX,
  type FollowUpRecord,
} from '../../../types/followUp';

interface FollowUpFormModalProps {
  // Edit this follow-up, or create a new one when null.
  followUp: FollowUpRecord | null;
  onClose: () => void;
  onSaved: (followUp: FollowUpRecord, mode: 'created' | 'updated') => void;
}

const FIELDS = ['contactId', 'ownerId', 'action', 'dueDate', 'lastContactedDate', 'period', 'descriptionRemark'] as const;
type Field = (typeof FIELDS)[number];
type FieldErrors = Partial<Record<Field, string>>;

interface FormValues {
  contactId: string;
  ownerId: string;
  action: string;
  dueDate: string;
  lastContactedDate: string;
  period: string;
  descriptionRemark: string;
}

const validate = (v: FormValues): FieldErrors => {
  const errors: FieldErrors = {};
  const today = todayISO();
  if (!v.contactId) errors.contactId = 'Choose a contact.';
  if (!v.ownerId) errors.ownerId = 'Choose an owner.';
  const action = v.action.trim();
  if (!action) errors.action = 'Describe the next action, e.g. "Send pilot proposal".';
  else if (action.length > FOLLOW_UP_ACTION_MAX)
    errors.action = `Keep the action to ${FOLLOW_UP_ACTION_MAX} characters or fewer.`;
  if (!isISODate(v.dueDate)) errors.dueDate = 'Choose a due date.';
  if (v.lastContactedDate) {
    if (v.lastContactedDate > today) errors.lastContactedDate = "Last contacted can't be in the future.";
    else if (isISODate(v.dueDate) && v.dueDate < v.lastContactedDate)
      errors.dueDate = "The due date can't be before the last contact.";
  }
  if (v.period) {
    const n = Number(v.period);
    if (!Number.isInteger(n) || n < 1 || n > FOLLOW_UP_PERIOD_MAX)
      errors.period = `Enter a whole number of days from 1 to ${FOLLOW_UP_PERIOD_MAX}, or leave it empty.`;
  }
  if (v.descriptionRemark.trim().length > FOLLOW_UP_REMARK_MAX)
    errors.descriptionRemark = `Keep the remark to ${FOLLOW_UP_REMARK_MAX} characters or fewer.`;
  return errors;
};

export const FollowUpFormModal: React.FC<FollowUpFormModalProps> = ({ followUp, onClose, onSaved }) => {
  const isEdit = !!followUp;
  const { user, role } = useAuth();
  // Members can only own their own follow-ups (the API enforces this too).
  const canAssign = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const [values, setValues] = useState<FormValues>({
    contactId: followUp?.contactId ?? '',
    ownerId: followUp?.ownerId ?? user?.id ?? '',
    action: followUp?.action ?? '',
    dueDate: followUp?.dueDate ?? addDaysISO(todayISO(), 7),
    lastContactedDate: followUp?.lastContactedDate ?? '',
    period: followUp?.period ? String(followUp.period) : '',
    descriptionRemark: followUp?.descriptionRemark ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const contacts = useContactOptions();
  const owners = useUserOptions();
  const save = useSaveFollowUp();

  const set = (field: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  // A follow-up whose contact is now closed still shows that contact.
  const contactOptions = [...(contacts.data ?? [])];
  if (followUp && !contactOptions.some((c) => c.id === followUp.contactId)) {
    contactOptions.unshift({ id: followUp.contactId, name: followUp.contactName, companyName: followUp.companyName });
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validate(values);
    setFieldErrors(errors);
    if (FIELDS.some((f) => errors[f])) return;

    save.mutate(
      {
        id: followUp?.id,
        input: {
          contactId: values.contactId,
          ownerId: values.ownerId,
          action: values.action.trim(),
          dueDate: values.dueDate,
          lastContactedDate: values.lastContactedDate || null,
          period: values.period ? Number(values.period) : null,
          descriptionRemark: values.descriptionRemark.trim() || null,
        },
      },
      {
        onSuccess: (saved) => onSaved(saved, isEdit ? 'updated' : 'created'),
        onError: (error) => {
          const apiError = getApiErrorInfo(error);
          const serverErrors: FieldErrors = {};
          apiError.fieldErrors.forEach((detail) => {
            const field = FIELDS.find((f) => f === detail.field);
            if (field) serverErrors[field] = detail.message;
          });
          setFieldErrors(serverErrors);
          if (!FIELDS.some((f) => serverErrors[f])) setFormError(apiError.message);
        },
      }
    );
  };

  return (
    <Modal
      open
      title={isEdit ? 'Edit follow-up' : 'Add follow-up'}
      description={isEdit ? `${followUp.contactName}${followUp.companyName ? ` · ${followUp.companyName}` : ''}` : 'Plan the next contact with a person and when it is due.'}
      onClose={onClose}
      busy={save.isPending}
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

        <FieldShell label="Contact" required error={fieldErrors.contactId}>
          {({ inputId, describedBy, invalid }) => (
            <select
              id={inputId}
              value={values.contactId}
              onChange={set('contactId')}
              disabled={contacts.isLoading}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-required
              className={`${fieldClass(invalid)} cursor-pointer disabled:cursor-wait disabled:opacity-60`}
            >
              <option value="">{contacts.isLoading ? 'Loading contacts…' : 'Choose a contact'}</option>
              {contactOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName ? `${c.name} · ${c.companyName}` : c.name}
                </option>
              ))}
            </select>
          )}
        </FieldShell>

        <FieldShell
          label="Next action"
          required
          error={fieldErrors.action}
          count={{ value: values.action.trim().length, max: FOLLOW_UP_ACTION_MAX }}
        >
          {({ inputId, describedBy, invalid }) => (
            <input
              id={inputId}
              type="text"
              value={values.action}
              onChange={set('action')}
              placeholder="e.g. Send revised pilot proposal"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-required
              className={fieldClass(invalid)}
            />
          )}
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Due date" required error={fieldErrors.dueDate}>
            {({ inputId, describedBy, invalid }) => (
              <input
                id={inputId}
                type="date"
                value={values.dueDate}
                onChange={set('dueDate')}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                aria-required
                className={fieldClass(invalid)}
              />
            )}
          </FieldShell>

          <FieldShell
            label="Owner"
            required
            hint={canAssign ? undefined : 'Members own their own follow-ups.'}
            error={fieldErrors.ownerId}
          >
            {({ inputId, describedBy, invalid }) => (
              <select
                id={inputId}
                value={values.ownerId}
                onChange={set('ownerId')}
                disabled={!canAssign || owners.isLoading}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                aria-required
                className={`${fieldClass(invalid)} cursor-pointer disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <option value="">Choose an owner</option>
                {(owners.data ?? (user ? [{ id: user.id, name: user.name }] : [])).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
          </FieldShell>

          <FieldShell label="Last contacted" hint="Optional." error={fieldErrors.lastContactedDate}>
            {({ inputId, describedBy, invalid }) => (
              <input
                id={inputId}
                type="date"
                value={values.lastContactedDate}
                max={todayISO()}
                onChange={set('lastContactedDate')}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={fieldClass(invalid)}
              />
            )}
          </FieldShell>

          <FieldShell
            label="Repeat every (days)"
            hint="Optional. Sets the next due date when you log a contact."
            error={fieldErrors.period}
          >
            {({ inputId, describedBy, invalid }) => (
              <input
                id={inputId}
                type="number"
                inputMode="numeric"
                min={1}
                max={FOLLOW_UP_PERIOD_MAX}
                value={values.period}
                onChange={set('period')}
                placeholder="e.g. 14"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={fieldClass(invalid)}
              />
            )}
          </FieldShell>
        </div>

        <FieldShell
          label="Remark"
          hint="Optional. Context for whoever picks this up."
          error={fieldErrors.descriptionRemark}
          count={{ value: values.descriptionRemark.trim().length, max: FOLLOW_UP_REMARK_MAX }}
        >
          {({ inputId, describedBy, invalid }) => (
            <textarea
              id={inputId}
              rows={3}
              value={values.descriptionRemark}
              onChange={set('descriptionRemark')}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={`${fieldClass(invalid)} resize-y`}
            />
          )}
        </FieldShell>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add follow-up'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
