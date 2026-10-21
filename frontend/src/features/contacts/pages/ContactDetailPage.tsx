import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  User as UserIcon,
  Pencil,
  Archive,
  Trash2,
  Plus,
  ExternalLink,
  FileText,
  History,
  ListTodo,
} from 'lucide-react';
import { LinkedInIcon } from '../components/LinkedInIcon';
import {
  useContact,
  useToggleContactClosed,
  useDeleteContact,
  useCreateFollowUp,
} from '../hooks/useContacts';
import { TierBadge } from '../../accounts/components/TierBadge';
import { StatusBadge } from '../../accounts/components/StatusBadge';
import { RelationshipBadge } from '../components/RelationshipBadge';
import { FollowUpDateBadge } from '../../accounts/components/FollowUpDateBadge';
import { ContactOverviewCard } from '../components/ContactOverviewCard';
import { ContactFollowUpsTab } from '../components/ContactFollowUpsTab';
import { FollowUpModalDialog } from '../components/FollowUpModalDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { LoadingSkeleton, ErrorState } from '../../../components/common/WidgetState';
import {
  usePermissions,
  canEditContact,
  canCloseContact,
  canDeleteContact,
  canManageFollowUp,
} from '../../../lib/permissions';
import { getFollowUpUrgency } from '../utils/followUpHelpers';
import type { CreateFollowUpDTO } from '../../../types/contact';

type TabKey = 'overview' | 'followups' | 'history';

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = usePermissions();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const { data: contact, isLoading, isError, error, refetch } = useContact(id);

  const toggleClosedMutation = useToggleContactClosed();
  const deleteMutation = useDeleteContact();
  const createFollowUpMutation = useCreateFollowUp(id);

  const mayEdit = contact ? canEditContact({ ownerId: contact.ownerId }, user) : false;
  const mayClose = contact ? canCloseContact({ ownerId: contact.ownerId }, user) : false;
  const mayDelete = contact ? canDeleteContact({ ownerId: contact.ownerId }, user) : false;
  const mayManageFollowUp = contact ? canManageFollowUp({ ownerId: contact.ownerId }, user) : false;

  // Auto-dismiss feedback toast
  React.useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--table-header-bg)' }} />
        <div
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          className="p-6 rounded-xl border shadow-2xs"
        >
          <LoadingSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (isError || !contact) {
    return (
      <div className="space-y-4">
        <Link
          to="/contacts"
          style={{ color: 'var(--link)' }}
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
        <ErrorState
          message={error?.message || `Contact with id '${id}' could not be retrieved.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Handle Quick Follow-up Create
  const handleScheduleFollowUp = async (dto: CreateFollowUpDTO | Partial<CreateFollowUpDTO>) => {
    try {
      await createFollowUpMutation.mutateAsync(dto as CreateFollowUpDTO);
      setIsFollowUpModalOpen(false);
      setActionFeedback('Follow-up scheduled successfully.');
    } catch (err) {
      console.error('Failed to create follow-up:', err);
      setActionFeedback('Failed to schedule follow-up.');
    }
  };

  // Handle Close / Reopen
  const handleToggleClosed = async () => {
    try {
      await toggleClosedMutation.mutateAsync({ id: contact.id, isClosed: !contact.isClosed });
      setShowCloseDialog(false);
      setActionFeedback(contact.isClosed ? 'Contact reopened successfully.' : 'Contact closed.');
    } catch (err) {
      console.error('Failed to toggle closed status:', err);
      setActionFeedback('Failed to update status.');
    }
  };

  // Handle Delete
  const handleDeleteContact = async () => {
    try {
      await deleteMutation.mutateAsync(contact.id);
      setShowDeleteDialog(false);
      navigate('/contacts');
    } catch (err) {
      console.error('Failed to delete contact:', err);
      setActionFeedback('Failed to delete contact.');
    }
  };

  const followUpUrgency = contact.nextFollowUpDate ? getFollowUpUrgency(contact.nextFollowUpDate) : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          to="/contacts"
          style={{ color: 'var(--link)' }}
          className="hover:underline font-medium"
        >
          Contacts
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span style={{ color: 'var(--text-secondary)' }} className="truncate font-normal">
          {contact.name}
        </span>
      </nav>

      {/* Main Contact Header Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-6 rounded-xl border shadow-2xs space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Contact Identity */}
          <div className="flex items-start gap-4">
            <div
              style={{
                backgroundColor: 'var(--tag-bg)',
                color: 'var(--tag-text)',
              }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs"
            >
              {contact.name.charAt(0)}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
                  {contact.name}
                </h1>
                <TierBadge tier={contact.tier} />
                <RelationshipBadge status={contact.relationshipStatus} />
                <StatusBadge status={contact.status} />
                {contact.isClosed && (
                  <span
                    style={{
                      backgroundColor: 'var(--status-inactive-bg)',
                      color: 'var(--status-inactive-text)',
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  >
                    <Archive className="w-3 h-3" />
                    Closed Engagement
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {contact.targetRole && (
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {contact.targetRole}
                  </span>
                )}
                {contact.targetRole && contact.companyName && <span>•</span>}
                {contact.companyName && (
                  <Link
                    to={`/accounts/${contact.companyId}`}
                    style={{ color: 'var(--link)' }}
                    className="inline-flex items-center gap-1 hover:underline font-medium"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{contact.companyName}</span>
                  </Link>
                )}
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Owner: <strong className="text-slate-800 dark:text-slate-200">{contact.ownerName}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {mayManageFollowUp && (
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(true)}
                style={{
                  backgroundColor: 'var(--btn-primary)',
                  color: 'var(--btn-primary-text)',
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold shadow-2xs hover:opacity-95 transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Follow-Up</span>
              </button>
            )}

            {mayEdit && !contact.isClosed && (
              <Link
                to={`/contacts/${contact.id}/edit`}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Contact"
              >
                <Pencil className="w-4 h-4 text-slate-500" />
                <span>Edit</span>
              </Link>
            )}

            {mayEdit && contact.isClosed && (
              <button
                type="button"
                disabled
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  opacity: 0.5,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium cursor-not-allowed"
                title="Contact is closed. Reopen engagement to make edits."
              >
                <Pencil className="w-4 h-4 text-slate-400" />
                <span>Edit</span>
              </button>
            )}

            {mayClose && (
              <button
                type="button"
                onClick={() => setShowCloseDialog(true)}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: contact.isClosed ? 'var(--status-info-text)' : 'var(--text-secondary)',
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={contact.isClosed ? 'Reopen Contact' : 'Close Contact'}
              >
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">{contact.isClosed ? 'Reopen' : 'Close'}</span>
              </button>
            )}

            {mayDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--status-danger-text)',
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium shadow-2xs hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                title="Delete Contact"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Coordinates & Metadata Bar */}
        <div
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--table-header-bg)' }}
          className="rounded-lg p-3.5 border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs"
        >
          {/* Email */}
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] block text-slate-500 uppercase tracking-wider font-semibold">Email</span>
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  style={{ color: 'var(--link)' }}
                  className="font-medium hover:underline truncate block"
                >
                  {contact.email}
                </a>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>—</span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] block text-slate-500 uppercase tracking-wider font-semibold">Phone</span>
              {contact.phoneNo ? (
                <a
                  href={`tel:${contact.phoneNo}`}
                  style={{ color: 'var(--text)' }}
                  className="font-medium hover:underline truncate block"
                >
                  {contact.phoneNo}
                </a>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>—</span>
              )}
            </div>
          </div>

          {/* LinkedIn Profile */}
          <div className="flex items-center gap-2">
            <LinkedInIcon className="w-4 h-4 text-[#0077b5] shrink-0" />
            <div className="truncate">
              <span className="text-[11px] block text-slate-500 uppercase tracking-wider font-semibold">LinkedIn</span>
              {contact.linkedinProfileUrl ? (
                <a
                  href={contact.linkedinProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--link)' }}
                  className="font-medium hover:underline inline-flex items-center gap-1 truncate"
                >
                  <span>{contact.linkedinSearchName || 'View Profile'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : contact.linkedinSearchName ? (
                <span style={{ color: 'var(--text)' }} className="font-medium truncate block">
                  {contact.linkedinSearchName}
                </span>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>—</span>
              )}
            </div>
          </div>

          {/* Last Contacted */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] block text-slate-500 uppercase tracking-wider font-semibold">Last Contacted</span>
              <span style={{ color: 'var(--text)' }} className="font-medium block">
                {contact.lastContactedDate || 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Action & Follow-Up Alert Card (if scheduled) */}
      {(contact.nextStep || contact.nextFollowUpDate) && (
        <div
          style={{
            backgroundColor:
              followUpUrgency === 'OVERDUE'
                ? 'var(--status-danger-bg)'
                : followUpUrgency === 'DUE_TODAY'
                ? 'var(--status-warning-bg)'
                : 'var(--surface)',
            borderColor:
              followUpUrgency === 'OVERDUE'
                ? 'var(--status-danger-border)'
                : followUpUrgency === 'DUE_TODAY'
                ? 'var(--status-warning-border)'
                : 'var(--border)',
          }}
          className="p-4 rounded-xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <Clock
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                followUpUrgency === 'OVERDUE'
                  ? 'text-red-600 dark:text-red-400'
                  : followUpUrgency === 'DUE_TODAY'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Scheduled Next Action
                </span>
                {contact.nextFollowUpDate && (
                  <FollowUpDateBadge dateStr={contact.nextFollowUpDate} />
                )}
              </div>
              <p style={{ color: 'var(--text)' }} className="text-sm font-medium mt-1">
                {contact.nextStep || 'Review strategic outreach status.'}
              </p>
            </div>
          </div>

          {mayManageFollowUp && (
            <button
              type="button"
              onClick={() => setActiveTab('followups')}
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto cursor-pointer"
            >
              View in Follow-ups Tab
            </button>
          )}
        </div>
      )}

      {/* Tabs Navigation Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              color: activeTab === 'overview' ? 'var(--btn-primary)' : 'var(--text-secondary)',
              borderBottomColor: activeTab === 'overview' ? 'var(--btn-primary)' : 'transparent',
            }}
            className="pb-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Overview & Strategy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followups')}
            style={{
              color: activeTab === 'followups' ? 'var(--btn-primary)' : 'var(--text-secondary)',
              borderBottomColor: activeTab === 'followups' ? 'var(--btn-primary)' : 'transparent',
            }}
            className="pb-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ListTodo className="w-4 h-4" />
            <span>Follow-Up Tasks</span>
            {contact.followUpCount !== undefined && contact.followUpCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--tag-bg)',
                  color: 'var(--tag-text)',
                }}
                className="text-xs px-2 py-0.2 rounded-full font-bold ml-0.5"
              >
                {contact.followUpCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              color: activeTab === 'history' ? 'var(--btn-primary)' : 'var(--text-secondary)',
              borderBottomColor: activeTab === 'history' ? 'var(--btn-primary)' : 'transparent',
            }}
            className="pb-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            <span>Activity History</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <ContactOverviewCard contact={contact} />
      )}

      {activeTab === 'followups' && (
        <ContactFollowUpsTab
          contactId={contact.id}
          contactOwnerId={contact.ownerId}
        />
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Audit Metadata Card */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            className="p-6 rounded-xl border shadow-2xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Record Audit Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div
                style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border)' }}
                className="p-3.5 rounded-lg border space-y-1"
              >
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Created By
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                  {contact.createdByName || contact.createdBy || '—'}
                </span>
              </div>

              <div
                style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border)' }}
                className="p-3.5 rounded-lg border space-y-1"
              >
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Created Date
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                  {contact.createdDate || '—'}
                </span>
              </div>

              <div
                style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border)' }}
                className="p-3.5 rounded-lg border space-y-1"
              >
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Updated By
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                  {contact.updatedByName || contact.updatedBy || '—'}
                </span>
              </div>

              <div
                style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border)' }}
                className="p-3.5 rounded-lg border space-y-1"
              >
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Updated Date
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                  {contact.updatedDate || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Chronological Event Log */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            className="p-6 rounded-xl border shadow-2xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Chronological Touchpoint & Update Log
            </h3>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {/* Record Creation Event */}
              <div className="relative pl-8 space-y-1">
                <div
                  style={{ backgroundColor: 'var(--btn-primary)' }}
                  className="w-2.5 h-2.5 rounded-full absolute left-2 top-1.5 ring-4 ring-white dark:ring-slate-900"
                />
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Contact Created
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>• {contact.createdDate} by {contact.createdByName || contact.createdBy}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Target profile registered under {contact.companyName || 'strategic account'}.
                </p>
              </div>

              {/* Last Contacted Event if available */}
              {contact.lastContactedDate && (
                <div className="relative pl-8 space-y-1">
                  <div
                    style={{ backgroundColor: 'var(--status-info-text)' }}
                    className="w-2.5 h-2.5 rounded-full absolute left-2 top-1.5 ring-4 ring-white dark:ring-slate-900"
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Client Touchpoint Recorded
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>• {contact.lastContactedDate}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Outreach meeting or call completed by {contact.ownerName}.
                  </p>
                </div>
              )}

              {/* Most recent profile update */}
              <div className="relative pl-8 space-y-1">
                <div
                  style={{ backgroundColor: 'var(--status-success-text)' }}
                  className="w-2.5 h-2.5 rounded-full absolute left-2 top-1.5 ring-4 ring-white dark:ring-slate-900"
                />
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Profile Last Updated
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>• {contact.updatedDate} by {contact.updatedByName || contact.updatedBy}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Strategic positioning and contact metadata synchronized.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Dialog */}
      <FollowUpModalDialog
        isOpen={isFollowUpModalOpen}
        contactId={contact.id}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSubmit={handleScheduleFollowUp}
        isLoading={createFollowUpMutation.isPending}
      />

      {/* Close / Reopen Confirm Dialog */}
      <ConfirmDialog
        isOpen={showCloseDialog}
        title={contact.isClosed ? 'Reopen Contact Engagement?' : 'Close Contact Engagement?'}
        message={
          contact.isClosed
            ? `Reopening ${contact.name} will restore active outreach workflow for this contact.`
            : `Closing ${contact.name} will flag active outreach as concluded while safely preserving all history, notes, and tasks.`
        }
        confirmLabel={contact.isClosed ? 'Reopen Contact' : 'Close Contact'}
        isDestructive={!contact.isClosed}
        isLoading={toggleClosedMutation.isPending}
        onConfirm={handleToggleClosed}
        onClose={() => setShowCloseDialog(false)}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Contact?"
        message={`Are you sure you want to permanently delete ${contact.name}? All linked follow-ups and notes will be removed. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteContact}
        onClose={() => setShowDeleteDialog(false)}
      />

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150 text-sm font-medium"
        >
          <span>{actionFeedback}</span>
        </div>
      )}
    </div>
  );
};
