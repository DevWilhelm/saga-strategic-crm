import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { accountSchema, type AccountFormValues } from '../schemas/accountSchema';
import { useAccountLookups, useSaveAccount } from '../hooks/useAccounts';
import type { AccountDetail, BusinessLine, Tier, DealSide, AccountStatus } from '../../../types/account';

interface AccountFormProps {
  initialData?: AccountDetail;
  isEdit?: boolean;
}

export const AccountForm: React.FC<AccountFormProps> = ({ initialData, isEdit = false }) => {
  const navigate = useNavigate();
  const { data: lookups } = useAccountLookups();
  const saveMutation = useSaveAccount();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: initialData?.name || '',
      businessLine: (initialData?.businessLine as BusinessLine) || 'Healthcare',
      categoryId: initialData?.categoryId || '',
      subCategoryId: initialData?.subCategoryId || '',
      serviceId: initialData?.serviceId || '',
      tier: (initialData?.tier as Tier) || 'TIER_1',
      ownerId: initialData?.ownerId || '',
      status: (initialData?.status as AccountStatus) || 'ACTIVE',
      dealSide: (initialData?.dealSide as DealSide) || null,
      country: initialData?.country || 'Thailand',
      websiteUrl: initialData?.websiteUrl || '',
      sourceRef: initialData?.sourceRef || '',
      note: initialData?.note || '',
    },
  });

  const selectedCategoryId = watch('categoryId');
  const selectedSubCategoryId = watch('subCategoryId');

  // Dependent sub-categories: reset subCategoryId if selected category changes
  const filteredSubCategories = React.useMemo(() => {
    return lookups?.subCategories.filter((s) => s.categoryId === selectedCategoryId) || [];
  }, [lookups?.subCategories, selectedCategoryId]);

  useEffect(() => {
    if (selectedCategoryId && selectedSubCategoryId) {
      const stillValid = filteredSubCategories.some((s) => s.id === selectedSubCategoryId);
      if (!stillValid) {
        setValue('subCategoryId', '');
      }
    }
  }, [selectedCategoryId, selectedSubCategoryId, filteredSubCategories, setValue]);

  // Window unload guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (values: AccountFormValues) => {
    setServerErrors({});

    try {
      const savedAccount = await saveMutation.mutateAsync({
        id: isEdit ? initialData?.id : undefined,
        data: values,
      });

      // Navigate to detail page on success
      navigate(`/accounts/${savedAccount.id}`, { replace: true });
    } catch (err: unknown) {
      const errorObj = err as {
        errors?: Array<{ field: string; message: string }>;
        message?: string;
      };

      if (errorObj.errors && Array.isArray(errorObj.errors)) {
        const map: Record<string, string> = {};
        errorObj.errors.forEach((e) => {
          map[e.field] = e.message;
        });
        setServerErrors(map);
      } else {
        setServerErrors({
          form: errorObj.message || 'An unexpected error occurred while saving the account.',
        });
      }
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!confirmLeave) {
        e.preventDefault();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top Banner Error if generic */}
      {serverErrors.form && (
        <div
          style={{
            backgroundColor: 'var(--status-overdue-bg)',
            borderColor: 'var(--status-overdue-text)',
            color: 'var(--status-overdue-text)',
          }}
          className="p-4 rounded-lg border text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{serverErrors.form}</span>
        </div>
      )}

      {/* Primary Card: Account Core Details */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-6 rounded-xl border shadow-xs space-y-5"
      >
        <h3 style={{ color: 'var(--text)' }} className="text-base font-bold pb-2 border-b border-slate-100">
          Core Profile & Ownership
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name (Required, max 200) */}
          <div className="sm:col-span-2">
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Bangkok Medical Consortium"
              style={{
                borderColor: errors.name || serverErrors.name ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            {errors.name && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.name.message}
              </p>
            )}
            {serverErrors.name && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.name}
              </p>
            )}
          </div>

          {/* Business Line (Required) */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Business Line <span className="text-red-500">*</span>
            </label>
            <select
              {...register('businessLine')}
              style={{
                borderColor: errors.businessLine || serverErrors.businessLine ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none cursor-pointer"
            >
              <option value="Healthcare">Healthcare</option>
              <option value="Financial Advisory">Financial Advisory</option>
              <option value="Networking & Partnerships">Networking & Partnerships</option>
            </select>
            {errors.businessLine && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.businessLine.message}
              </p>
            )}
          </div>

          {/* Tier (Required) */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Client Tier <span className="text-red-500">*</span>
            </label>
            <select
              {...register('tier')}
              style={{
                borderColor: errors.tier || serverErrors.tier ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none cursor-pointer"
            >
              <option value="TIER_1">Tier 1 (Key Strategic)</option>
              <option value="TIER_2">Tier 2 (Growth Target)</option>
              <option value="TIER_3">Tier 3 (Standard Portfolio)</option>
            </select>
            {errors.tier && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.tier.message}
              </p>
            )}
          </div>

          {/* Category (Required) */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('categoryId')}
              style={{
                borderColor: errors.categoryId || serverErrors.categoryId ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none cursor-pointer"
            >
              <option value="">Select Category...</option>
              {lookups?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.categoryId.message}
              </p>
            )}
            {serverErrors.categoryId && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.categoryId}
              </p>
            )}
          </div>

          {/* SubCategory (Optional, dependent on Category) */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Sub-Category (Optional)
            </label>
            <select
              {...register('subCategoryId')}
              disabled={!selectedCategoryId}
              style={{
                borderColor: errors.subCategoryId ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">
                {selectedCategoryId ? 'Select Sub-Category...' : 'Choose Category first'}
              </option>
              {filteredSubCategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service (Required) */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Mandate Service <span className="text-red-500">*</span>
            </label>
            <select
              {...register('serviceId')}
              style={{
                borderColor: errors.serviceId || serverErrors.serviceId ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none cursor-pointer"
            >
              <option value="">Select Service...</option>
              {lookups?.services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
            {errors.serviceId && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.serviceId.message}
              </p>
            )}
            {serverErrors.serviceId && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.serviceId}
              </p>
            )}
          </div>

          {/* Account Owner (Required) */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Account Owner <span className="text-red-500">*</span>
            </label>
            <select
              {...register('ownerId')}
              style={{
                borderColor: errors.ownerId || serverErrors.ownerId ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none cursor-pointer"
            >
              <option value="">Select Owner...</option>
              {lookups?.owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.code})
                </option>
              ))}
            </select>
            {errors.ownerId && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.ownerId.message}
              </p>
            )}
            {serverErrors.ownerId && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.ownerId}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Card: Strategic Engagement & Metadata */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-6 rounded-xl border shadow-xs space-y-5"
      >
        <h3 style={{ color: 'var(--text)' }} className="text-base font-bold pb-2 border-b border-slate-100">
          Engagement Details & Metadata
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* Status */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Account Status
            </label>
            <select
              {...register('status')}
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none cursor-pointer"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Deal Side */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Deal Side (Optional)
            </label>
            <Controller
              name="dealSide"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none cursor-pointer"
                >
                  <option value="">None / Not Applicable</option>
                  <option value="BUY_SIDE">BUY_SIDE</option>
                  <option value="SELL_SIDE">SELL_SIDE</option>
                </select>
              )}
            />
          </div>

          {/* Country */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Country
            </label>
            <input
              type="text"
              {...register('country')}
              placeholder="e.g. Thailand"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none"
            />
          </div>

          {/* Website URL */}
          <div className="sm:col-span-2">
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Website URL
            </label>
            <input
              type="text"
              {...register('websiteUrl')}
              placeholder="https://example.com"
              style={{
                borderColor: errors.websiteUrl || serverErrors.websiteUrl ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none"
            />
            {errors.websiteUrl && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.websiteUrl.message}
              </p>
            )}
            {serverErrors.websiteUrl && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.websiteUrl}
              </p>
            )}
          </div>

          {/* Source Reference */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Source Reference
            </label>
            <input
              type="text"
              {...register('sourceRef')}
              placeholder="e.g. Conference Lead 2026"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none"
            />
          </div>

          {/* Note (Max 2000) */}
          <div className="sm:col-span-3">
            <label style={{ color: 'var(--text)' }} className="block text-xs font-semibold uppercase mb-1">
              Internal Profile Note (Max 2000 chars)
            </label>
            <textarea
              {...register('note')}
              rows={4}
              placeholder="Strategic notes, syndicate priorities, executive briefing..."
              style={{
                borderColor: errors.note || serverErrors.note ? 'var(--status-overdue-text)' : 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            {errors.note && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {errors.note.message}
              </p>
            )}
            {serverErrors.note && (
              <p style={{ color: 'var(--status-overdue-text)' }} className="text-xs mt-1">
                {serverErrors.note}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          to={isEdit && initialData ? `/accounts/${initialData.id}` : '/accounts'}
          onClick={handleCancel}
          style={{
            backgroundColor: 'var(--btn-secondary-bg)',
            borderColor: 'var(--btn-secondary-border)',
            color: 'var(--btn-secondary-text)',
          }}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting || saveMutation.isPending}
          style={{
            backgroundColor: 'var(--btn-primary)',
            color: 'var(--btn-primary-text)',
          }}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting || saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Account...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEdit ? 'Save Changes' : 'Create Account'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
