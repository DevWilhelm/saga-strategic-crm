import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Calendar, AlertTriangle, Loader2, Save } from 'lucide-react';
import type { FollowUp, CreateFollowUpDTO, UpdateFollowUpDTO } from '../../../types/contact';
import { followUpFormSchema, type FollowUpFormData } from '../schemas/followUpSchema';
import {
  calculateDueDateFromPeriod,
  getTodayDateString,
  isDueDateInPast,
} from '../utils/followUpHelpers';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../../api/usersApi';
import { useAuth } from '../../../context/AuthContext';

interface FollowUpModalDialogProps {
  isOpen: boolean;
  contactId: string;
  initialData?: FollowUp;
  onClose: () => void;
  onSubmit: (data: CreateFollowUpDTO | UpdateFollowUpDTO) => Promise<void>;
  isLoading?: boolean;
}

export const FollowUpModalDialog: React.FC<FollowUpModalDialogProps> = ({
  isOpen,
  contactId,
  initialData,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { user: currentUser } = useAuth();
  const isEdit = Boolean(initialData);

  // Fetch users for owner assignment
  const { data: usersData } = useQuery({
    queryKey: ['users', 'options'],
    queryFn: () => usersApi.getUserOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const users = usersData || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      action: initialData?.action || '',
      dueDate: initialData?.dueDate || getTodayDateString(),
      period: initialData?.period ?? 7,
      lastContactedDate: initialData?.lastContactedDate || getTodayDateString(),
      descriptionRemark: initialData?.descriptionRemark || '',
      ownerId: initialData?.ownerId || currentUser?.id || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        action: initialData.action,
        dueDate: initialData.dueDate,
        period: initialData.period,
        lastContactedDate: initialData.lastContactedDate,
        descriptionRemark: initialData.descriptionRemark || '',
        ownerId: initialData.ownerId,
      });
    } else {
      reset({
        action: '',
        dueDate: calculateDueDateFromPeriod(getTodayDateString(), 7),
        period: 7,
        lastContactedDate: getTodayDateString(),
        descriptionRemark: '',
        ownerId: currentUser?.id || '',
      });
    }
  }, [initialData, currentUser, reset]);

  const watchedLastDate = watch('lastContactedDate');
  const watchedPeriod = watch('period');
  const watchedDueDate = watch('dueDate');

  // Auto-calculate dueDate when lastContactedDate or period changes
  const handleAutoCalculate = () => {
    if (watchedLastDate && watchedPeriod && watchedPeriod > 0) {
      const calculated = calculateDueDateFromPeriod(watchedLastDate, watchedPeriod);
      if (calculated) {
        setValue('dueDate', calculated);
      }
    }
  };

  if (!isOpen) return null;

  const isPast = isDueDateInPast(watchedDueDate);

  const handleFormSubmit = async (data: FollowUpFormData) => {
    await onSubmit({
      contactId,
      action: data.action,
      dueDate: data.dueDate,
      period: data.period || null,
      lastContactedDate: data.lastContactedDate || null,
      descriptionRemark: data.descriptionRemark || null,
      ownerId: data.ownerId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="followup-dialog-title"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
        className="w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: 'var(--btn-primary)' }} />
            <h2 id="followup-dialog-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isEdit ? 'Edit Scheduled Follow-Up' : 'Schedule New Follow-Up'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Action Objective */}
          <div>
            <label htmlFor="followup-action" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Follow-Up Action Objective <span className="text-red-500">*</span>
            </label>
            <input
              id="followup-action"
              type="text"
              placeholder="e.g. Send revised pilot proposal, Schedule partner call..."
              {...register('action')}
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text)',
                borderColor: errors.action ? 'red' : 'var(--input-border)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
            />
            {errors.action && <p className="text-xs text-red-500 mt-1">{errors.action.message}</p>}
          </div>

          {/* Last Contacted Date & Period Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="followup-lastContactedDate" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Last Contacted Date
              </label>
              <input
                id="followup-lastContactedDate"
                type="date"
                {...register('lastContactedDate')}
                onChange={(e) => {
                  register('lastContactedDate').onChange(e);
                  if (watchedPeriod) {
                    const calc = calculateDueDateFromPeriod(e.target.value, watchedPeriod);
                    if (calc) setValue('dueDate', calc);
                  }
                }}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
            </div>

            <div>
              <label htmlFor="followup-period" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Cadence Period (Days)
              </label>
              <input
                id="followup-period"
                type="number"
                min={1}
                placeholder="e.g. 7"
                {...register('period', { valueAsNumber: true })}
                onChange={(e) => {
                  register('period', { valueAsNumber: true }).onChange(e);
                  const p = parseInt(e.target.value, 10);
                  if (watchedLastDate && p > 0) {
                    const calc = calculateDueDateFromPeriod(watchedLastDate, p);
                    if (calc) setValue('dueDate', calc);
                  }
                }}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="followup-dueDate" className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Target Due Date <span className="text-red-500">*</span>
              </label>
              {watchedLastDate && watchedPeriod && (
                <button
                  type="button"
                  onClick={handleAutoCalculate}
                  className="text-[11px] font-medium text-[var(--link)] hover:underline cursor-pointer"
                >
                  Recalculate (Last date + Period)
                </button>
              )}
            </div>
            <input
              id="followup-dueDate"
              type="date"
              {...register('dueDate')}
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text)',
                borderColor: errors.dueDate ? 'red' : 'var(--input-border)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
            />
            {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>}

            {/* Non-blocking Warning for past due dates */}
            {isPast && (
              <div
                style={{
                  backgroundColor: 'var(--status-overdue-bg)',
                  color: 'var(--status-overdue-text)',
                }}
                className="p-2.5 rounded-lg text-xs flex items-center gap-2 mt-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Notice: This due date is in the past. It will be scheduled and labeled as <strong>Overdue</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Owner Assignment */}
          <div>
            <label htmlFor="followup-ownerId" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Assigned Follow-Up Owner <span className="text-red-500">*</span>
            </label>
            <select
              id="followup-ownerId"
              {...register('ownerId')}
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text)',
                borderColor: 'var(--input-border)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>

          {/* Description / Remark */}
          <div>
            <label htmlFor="followup-descriptionRemark" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Description & Strategy Remarks
            </label>
            <textarea
              id="followup-descriptionRemark"
              rows={3}
              placeholder="Context notes, talking points, key deliverables..."
              {...register('descriptionRemark')}
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text)',
                borderColor: 'var(--input-border)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] resize-y"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
              className="px-4 py-2 text-sm font-semibold rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: 'var(--btn-primary)',
                color: 'var(--btn-primary-text)',
              }}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg shadow hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Save Changes' : 'Schedule Follow-Up'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
