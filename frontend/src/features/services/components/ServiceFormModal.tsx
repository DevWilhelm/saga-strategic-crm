import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { FieldShell } from '../../../components/common/FormField';
import { fieldClass } from '../../../components/common/fieldClass';
import { StatusField } from '../../../components/common/StatusField';
import { getApiErrorInfo } from '../../../api/errors';
import { useSaveService } from '../hooks/useServices';
import type { RecordStatus } from '../../../types/common';
import { SERVICE_DESCRIPTION_MAX, SERVICE_NAME_MAX, type ServiceRecord } from '../../../types/service';

interface ServiceFormModalProps {
  // Edit this service, or create a new one when null.
  service: ServiceRecord | null;
  onClose: () => void;
  onSaved: (service: ServiceRecord, mode: 'created' | 'updated') => void;
}

interface FieldErrors {
  name?: string;
  description?: string;
}

const validate = (name: string, description: string): FieldErrors => {
  const errors: FieldErrors = {};
  if (!name) errors.name = 'Enter a service name.';
  else if (name.length > SERVICE_NAME_MAX) errors.name = `Keep the name to ${SERVICE_NAME_MAX} characters or fewer.`;
  if (description.length > SERVICE_DESCRIPTION_MAX)
    errors.description = `Keep the description to ${SERVICE_DESCRIPTION_MAX} characters or fewer.`;
  return errors;
};

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ service, onClose, onSaved }) => {
  const isEdit = !!service;
  const [name, setName] = useState(service?.name ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [status, setStatus] = useState<RecordStatus>(service?.status ?? 'ACTIVE');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const save = useSaveService();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const errors = validate(trimmedName, trimmedDescription);
    setFieldErrors(errors);
    if (errors.name || errors.description) return;

    save.mutate(
      {
        id: service?.id,
        input: { name: trimmedName, description: trimmedDescription || null, status },
      },
      {
        onSuccess: (saved) => onSaved(saved, isEdit ? 'updated' : 'created'),
        onError: (error) => {
          const apiError = getApiErrorInfo(error);
          const serverErrors: FieldErrors = {};
          apiError.fieldErrors.forEach((detail) => {
            if (detail.field === 'name' || detail.field === 'description') serverErrors[detail.field] = detail.message;
          });
          setFieldErrors(serverErrors);
          // Field problems are shown on the fields; anything else goes in the banner.
          if (!serverErrors.name && !serverErrors.description) setFormError(apiError.message);
        },
      }
    );
  };

  return (
    <Modal
      open
      title={isEdit ? 'Edit service' : 'Add service'}
      description={isEdit ? `Changes apply everywhere ${service.name} is used.` : 'The advisory service an account is linked to.'}
      onClose={onClose}
      busy={save.isPending}
    >
      <form id="service-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-[var(--status-overdue-bg)] px-3 py-2.5 text-sm text-[var(--status-overdue-text)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <FieldShell
          label="Name"
          required
          error={fieldErrors.name}
          count={{ value: name.trim().length, max: SERVICE_NAME_MAX }}
        >
          {({ inputId, describedBy, invalid }) => (
            <input
              id={inputId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Commercial Due Diligence"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-required
              className={fieldClass(invalid)}
            />
          )}
        </FieldShell>

        <FieldShell
          label="Description"
          hint="Optional. Helps colleagues pick the right service."
          error={fieldErrors.description}
          count={{ value: description.trim().length, max: SERVICE_DESCRIPTION_MAX }}
        >
          {({ inputId, describedBy, invalid }) => (
            <textarea
              id={inputId}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={`${fieldClass(invalid)} resize-y`}
            />
          )}
        </FieldShell>

        <StatusField
          name="service-status"
          value={status}
          onChange={setStatus}
          activeHint="Shown in account dropdowns"
        />

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add service'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
