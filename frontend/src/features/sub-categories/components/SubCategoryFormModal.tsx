import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { FieldShell } from '../../../components/common/FormField';
import { fieldClass } from '../../../components/common/fieldClass';
import { StatusField } from '../../../components/common/StatusField';
import { getApiErrorInfo } from '../../../api/errors';
import { useCategoryOptions } from '../../categories/hooks/useCategories';
import { useSaveSubCategory } from '../hooks/useSubCategories';
import type { RecordStatus } from '../../../types/common';
import { SUB_CATEGORY_DESCRIPTION_MAX, SUB_CATEGORY_NAME_MAX, type SubCategoryRecord } from '../../../types/subCategory';

interface SubCategoryFormModalProps {
  // Edit this sub-category, or create a new one when null.
  subCategory: SubCategoryRecord | null;
  // Preselected parent for a new sub-category (e.g. the category the list is filtered by).
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: (subCategory: SubCategoryRecord, mode: 'created' | 'updated') => void;
}

interface FieldErrors {
  categoryId?: string;
  name?: string;
  description?: string;
}

const FIELDS = ['categoryId', 'name', 'description'] as const;

const validate = (categoryId: string, name: string, description: string): FieldErrors => {
  const errors: FieldErrors = {};
  if (!categoryId) errors.categoryId = 'Choose a parent category.';
  if (!name) errors.name = 'Enter a sub-category name.';
  else if (name.length > SUB_CATEGORY_NAME_MAX)
    errors.name = `Keep the name to ${SUB_CATEGORY_NAME_MAX} characters or fewer.`;
  if (description.length > SUB_CATEGORY_DESCRIPTION_MAX)
    errors.description = `Keep the description to ${SUB_CATEGORY_DESCRIPTION_MAX} characters or fewer.`;
  return errors;
};

export const SubCategoryFormModal: React.FC<SubCategoryFormModalProps> = ({
  subCategory,
  defaultCategoryId,
  onClose,
  onSaved,
}) => {
  const isEdit = !!subCategory;
  const [categoryId, setCategoryId] = useState(subCategory?.categoryId ?? defaultCategoryId ?? '');
  const [name, setName] = useState(subCategory?.name ?? '');
  const [description, setDescription] = useState(subCategory?.description ?? '');
  const [status, setStatus] = useState<RecordStatus>(subCategory?.status ?? 'ACTIVE');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const categoryOptions = useCategoryOptions();
  const save = useSaveSubCategory();

  // Only active categories can be chosen. When editing a sub-category whose
  // parent has since been deactivated, keep that parent visible as the current value.
  const options = [...(categoryOptions.data ?? [])];
  if (subCategory && !options.some((o) => o.id === subCategory.categoryId)) {
    options.unshift({ id: subCategory.categoryId, name: `${subCategory.categoryName} (inactive)` });
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const errors = validate(categoryId, trimmedName, trimmedDescription);
    setFieldErrors(errors);
    if (FIELDS.some((field) => errors[field])) return;

    save.mutate(
      {
        id: subCategory?.id,
        input: { categoryId, name: trimmedName, description: trimmedDescription || null, status },
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
          // Field problems are shown on the fields; anything else goes in the banner.
          if (!FIELDS.some((field) => serverErrors[field]) || apiError.status === 422) {
            setFormError(apiError.message);
          }
        },
      }
    );
  };

  return (
    <Modal
      open
      title={isEdit ? 'Edit sub-category' : 'Add sub-category'}
      description={
        isEdit
          ? `Changes apply everywhere ${subCategory.name} is used.`
          : 'Sub-categories narrow down a category, e.g. Hospitals / Providers › Listed hospital groups.'
      }
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

        <FieldShell
          label="Parent category"
          required
          hint={categoryOptions.isError ? undefined : 'Only active categories are listed.'}
          error={
            fieldErrors.categoryId ??
            (categoryOptions.isError ? "Categories didn't load. Close the form and try again." : undefined)
          }
        >
          {({ inputId, describedBy, invalid }) => (
            <select
              id={inputId}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoryOptions.isLoading}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-required
              className={`${fieldClass(invalid)} cursor-pointer disabled:cursor-wait disabled:opacity-60`}
            >
              <option value="">{categoryOptions.isLoading ? 'Loading categories…' : 'Choose a category'}</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )}
        </FieldShell>

        <FieldShell
          label="Name"
          required
          error={fieldErrors.name}
          count={{ value: name.trim().length, max: SUB_CATEGORY_NAME_MAX }}
        >
          {({ inputId, describedBy, invalid }) => (
            <input
              id={inputId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Listed hospital groups"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-required
              className={fieldClass(invalid)}
            />
          )}
        </FieldShell>

        <FieldShell
          label="Description"
          hint="Optional."
          error={fieldErrors.description}
          count={{ value: description.trim().length, max: SUB_CATEGORY_DESCRIPTION_MAX }}
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
          name="sub-category-status"
          value={status}
          onChange={setStatus}
          activeHint="Shown in account dropdowns"
        />

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add sub-category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
