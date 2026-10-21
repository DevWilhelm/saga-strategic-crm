import React, { useState } from 'react';
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  User as UserIcon,
  Check,
} from 'lucide-react';
import type { FollowUp, CreateFollowUpDTO, UpdateFollowUpDTO, MarkFollowUpDoneDTO } from '../../../types/contact';
import {
  useContactFollowUps,
  useCreateFollowUp,
  useUpdateFollowUp,
  useDeleteFollowUp,
  useMarkFollowUpDone,
} from '../hooks/useContacts';
import { FollowUpModalDialog } from './FollowUpModalDialog';
import { MarkFollowUpDoneDialog } from './MarkFollowUpDoneDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { getFollowUpUrgency } from '../utils/followUpHelpers';
import { LoadingSkeleton, EmptyState, ErrorState } from '../../../components/common/WidgetState';
import { usePermissions, canManageFollowUp } from '../../../lib/permissions';

interface ContactFollowUpsTabProps {
  contactId: string;
  contactOwnerId: string;
}

export const ContactFollowUpsTab: React.FC<ContactFollowUpsTabProps> = ({
  contactId,
  contactOwnerId,
}) => {
  const { user } = usePermissions();
  const { data: followUps, isLoading, isError, error, refetch } = useContactFollowUps(contactId);

  const createMutation = useCreateFollowUp(contactId);
  const updateMutation = useUpdateFollowUp(contactId);
  const deleteMutation = useDeleteFollowUp(contactId);
  const markDoneMutation = useMarkFollowUpDone(contactId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [doneFollowUp, setDoneFollowUp] = useState<FollowUp | null>(null);
  const [deletingFollowUp, setDeletingFollowUp] = useState<FollowUp | null>(null);

  const mayManage = canManageFollowUp({ ownerId: contactOwnerId }, user);

  if (isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load follow-up tasks.'}
        onRetry={() => refetch()}
      />
    );
  }

  const items = followUps || [];
  const pendingItems = items.filter((f) => !f.isDone);
  const completedItems = items.filter((f) => f.isDone);

  const handleCreateOrUpdate = async (dto: CreateFollowUpDTO | UpdateFollowUpDTO) => {
    if (editingFollowUp) {
      await updateMutation.mutateAsync({
        id: editingFollowUp.id,
        data: dto,
      });
      setEditingFollowUp(null);
    } else {
      await createMutation.mutateAsync(dto as CreateFollowUpDTO);
    }
  };

  const handleMarkDone = async (dto: MarkFollowUpDoneDTO) => {
    if (!doneFollowUp) return;
    await markDoneMutation.mutateAsync({
      id: doneFollowUp.id,
      data: dto,
    });
    setDoneFollowUp(null);
  };

  const handleDelete = async () => {
    if (!deletingFollowUp) return;
    await deleteMutation.mutateAsync(deletingFollowUp.id);
    setDeletingFollowUp(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Cadence & Scheduled Actions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track meetings, calls, proposals, and advisory follow-up commitments.
          </p>
        </div>

        {mayManage && (
          <button
            type="button"
            onClick={() => {
              setEditingFollowUp(null);
              setIsModalOpen(true);
            }}
            style={{
              backgroundColor: 'var(--btn-primary)',
              color: 'var(--btn-primary-text)',
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shadow hover:opacity-90 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-Up</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <EmptyState
          title="No follow-up actions recorded"
          description="There are currently no scheduled calls, meetings, or reminders set for this executive contact."
          actionLabel={mayManage ? 'Schedule First Follow-Up' : undefined}
          onAction={mayManage ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-6">
          {/* Pending Tasks */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Actions ({pendingItems.length})
            </h4>

            {pendingItems.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  borderColor: 'var(--border)',
                }}
                className="p-4 rounded-xl border text-center text-xs text-slate-500"
              >
                All scheduled follow-up actions have been marked as completed.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingItems.map((item) => {
                  const urgency = getFollowUpUrgency(item.dueDate);
                  let stateBg = 'var(--status-info-bg)';
                  let stateColor = 'var(--status-info-text)';
                  let stateLabel = 'Upcoming';

                  if (urgency === 'OVERDUE') {
                    stateBg = 'var(--status-overdue-bg)';
                    stateColor = 'var(--status-overdue-text)';
                    stateLabel = 'Overdue';
                  } else if (urgency === 'DUE_TODAY') {
                    stateBg = 'var(--status-warning-bg)';
                    stateColor = 'var(--status-warning-text)';
                    stateLabel = 'Due Today';
                  }

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                      }}
                      className="p-4 rounded-xl border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-400 dark:hover:border-slate-600"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            style={{ backgroundColor: stateBg, color: stateColor }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                          >
                            {urgency === 'OVERDUE' ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {stateLabel}
                          </span>

                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Due: {item.dueDate}
                          </span>

                          {item.period && (
                            <span className="text-[11px] text-slate-500">
                              (Every {item.period} days)
                            </span>
                          )}

                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {item.ownerName || 'Owner'}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.action}
                        </p>

                        {item.descriptionRemark && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {item.descriptionRemark}
                          </p>
                        )}

                        {item.lastContactedDate && (
                          <p className="text-[11px] text-slate-400">
                            Last contacted: {item.lastContactedDate}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      {mayManage && (
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => setDoneFollowUp(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Done</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingFollowUp(item);
                              setIsModalOpen(true);
                            }}
                            style={{
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Edit Follow-Up"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingFollowUp(item)}
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                            title="Delete Follow-Up"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed History */}
          {completedItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Completed Actions History ({completedItems.length})
              </h4>

              <div className="space-y-2">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--table-header-bg)',
                      borderColor: 'var(--border)',
                    }}
                    className="p-3.5 rounded-xl border text-xs space-y-1 opacity-80"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 line-through">
                          {item.action}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Completed on {item.doneDate || '—'}
                      </span>
                    </div>

                    {item.resultNote && (
                      <div className="pl-6 pt-1 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          Outcome Result:{' '}
                        </span>
                        {item.resultNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <FollowUpModalDialog
        isOpen={isModalOpen}
        contactId={contactId}
        initialData={editingFollowUp || undefined}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFollowUp(null);
        }}
        onSubmit={handleCreateOrUpdate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Mark Done Dialog */}
      <MarkFollowUpDoneDialog
        isOpen={Boolean(doneFollowUp)}
        followUp={doneFollowUp}
        onClose={() => setDoneFollowUp(null)}
        onConfirm={handleMarkDone}
        isLoading={markDoneMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingFollowUp)}
        title="Delete Follow-Up Task?"
        message={
          deletingFollowUp
            ? `Are you sure you want to permanently delete the follow-up task: "${deletingFollowUp.action}"?`
            : ''
        }
        confirmLabel="Delete Task"
        isDestructive
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeletingFollowUp(null)}
      />
    </div>
  );
};
