import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import type { FollowUp, MarkFollowUpDoneDTO } from '../../../types/contact';
import { markFollowUpDoneSchema, type MarkFollowUpDoneFormData } from '../schemas/followUpSchema';
import { calculateDueDateFromPeriod, getTodayDateString } from '../utils/followUpHelpers';

interface MarkFollowUpDoneDialogProps {
  isOpen: boolean;
  followUp: FollowUp | null;
  onClose: () => void;
  onConfirm: (dto: MarkFollowUpDoneDTO) => Promise<void>;
  isLoading?: boolean;
}

export const MarkFollowUpDoneDialog: React.FC<MarkFollowUpDoneDialogProps> = ({
  isOpen,
  followUp,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [scheduleNextChecked, setScheduleNextChecked] = useState(true);

  const todayStr = getTodayDateString();
  const defaultNextDueDate = calculateDueDateFromPeriod(todayStr, 7);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MarkFollowUpDoneFormData>({
    resolver: zodResolver(markFollowUpDoneSchema),
    defaultValues: {
      resultNote: '',
      scheduleNext: true,
      nextAction: followUp ? `Follow up on: ${followUp.action}` : '',
      nextDueDate: defaultNextDueDate,
      nextPeriod: 7,
      nextDescription: '',
    },
  });

  if (!isOpen || !followUp) return null;

  const handleFormSubmit = async (data: MarkFollowUpDoneFormData) => {
    const payload: MarkFollowUpDoneDTO = {
      resultNote: data.resultNote.trim(),
    };

    if (scheduleNextChecked && data.nextDueDate && data.nextAction) {
      payload.scheduleNext = {
        action: data.nextAction.trim(),
        dueDate: data.nextDueDate,
        period: data.nextPeriod || null,
        descriptionRemark: data.nextDescription || null,
        ownerId: followUp.ownerId,
      };
    }

    await onConfirm(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-done-dialog-title"
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
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 id="mark-done-dialog-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              Complete Follow-Up Action
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
          <div
            style={{
              backgroundColor: 'var(--table-header-bg)',
              borderColor: 'var(--border)',
            }}
            className="p-3.5 rounded-lg border text-xs space-y-1"
          >
            <span className="font-semibold text-slate-500 uppercase tracking-wider block">
              Completing Action:
            </span>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{followUp.action}</p>
            <p className="text-slate-500">
              Scheduled Due: {followUp.dueDate} • Assigned: {followUp.ownerName || 'Unassigned'}
            </p>
          </div>

          {/* Result Note */}
          <div>
            <label htmlFor="done-resultNote" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Outcome / Meeting Result Note <span className="text-red-500">*</span>
            </label>
            <textarea
              id="done-resultNote"
              rows={3}
              placeholder="What was the outcome? (e.g. Client agreed on terms; requested revised commercial pilot draft by next Friday...)"
              {...register('resultNote')}
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text)',
                borderColor: errors.resultNote ? 'red' : 'var(--input-border)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] resize-y"
            />
            {errors.resultNote && (
              <p className="text-xs text-red-500 mt-1">{errors.resultNote.message}</p>
            )}
          </div>

          {/* Schedule Next Follow-up Section */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={scheduleNextChecked}
                onChange={(e) => setScheduleNextChecked(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--btn-primary)] focus:ring-[var(--btn-primary)] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Schedule Next Follow-Up Cadence
              </span>
            </label>

            {scheduleNextChecked && (
              <div
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  borderColor: 'var(--border)',
                }}
                className="p-4 rounded-xl border mt-3 space-y-3 animate-fadeIn"
              >
                <div>
                  <label htmlFor="next-action" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Next Action Objective
                  </label>
                  <input
                    id="next-action"
                    type="text"
                    {...register('nextAction')}
                    placeholder="Next step action..."
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text)',
                      borderColor: 'var(--input-border)',
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="next-dueDate" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Next Due Date
                    </label>
                    <input
                      id="next-dueDate"
                      type="date"
                      {...register('nextDueDate')}
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text)',
                        borderColor: 'var(--input-border)',
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="next-period" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Period (Days)
                    </label>
                    <input
                      id="next-period"
                      type="number"
                      min={1}
                      {...register('nextPeriod', { valueAsNumber: true })}
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text)',
                        borderColor: 'var(--input-border)',
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
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
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Done</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
