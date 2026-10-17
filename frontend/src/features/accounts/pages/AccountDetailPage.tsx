import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Edit2, Users, FileText, TrendingUp, ArrowLeft } from 'lucide-react';
import { useAccountDetail } from '../hooks/useAccounts';
import { TierBadge } from '../components/TierBadge';
import { StatusBadge } from '../components/StatusBadge';
import { AccountNextActionCard } from '../components/AccountNextActionCard';
import { AccountOverviewCard } from '../components/AccountOverviewCard';
import { AccountContactsTab } from '../components/AccountContactsTab';
import { AccountNotesTab } from '../components/AccountNotesTab';
import { AccountDealsTab } from '../components/AccountDealsTab';
import { LoadingSkeleton, ErrorState } from '../components/WidgetState';

type TabKey = 'contacts' | 'notes' | 'deals';

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('contacts');

  const { data: account, isLoading, isError, error, refetch } = useAccountDetail(id || '');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--table-header-bg)' }} />
        <div
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          className="p-6 rounded-xl border shadow-xs"
        >
          <LoadingSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="space-y-4">
        <Link
          to="/accounts"
          style={{ color: 'var(--link)' }}
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Accounts
        </Link>
        <ErrorState
          message={error?.message || `Account with id '${id}' could not be retrieved.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          to="/accounts"
          style={{ color: 'var(--link)' }}
          className="hover:underline font-medium"
        >
          Accounts
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span style={{ color: 'var(--text-secondary)' }} className="truncate font-normal">
          {account.name}
        </span>
      </nav>

      {/* Account Header Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-6 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-2">
          {/* Title + Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
              {account.name}
            </h1>
            <TierBadge tier={account.tier} />
            <StatusBadge status={account.status} />
          </div>

          {/* Sub-line: Category > SubCategory & Owner, Status */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium text-slate-700">
              {account.categoryName} {account.subCategoryName ? `› ${account.subCategoryName}` : ''}
            </span>
            <span>•</span>
            <span>
              Owner: <strong className="text-slate-800">{account.ownerName}</strong>
            </span>
            <span>•</span>
            <span>
              Status: <strong className="text-slate-800">{account.status}</strong>
            </span>
          </div>
        </div>

        {/* Action Button: Edit */}
        <div className="flex items-center gap-2">
          <Link
            to={`/accounts/${account.id}/edit`}
            style={{
              backgroundColor: 'var(--btn-primary)',
              color: 'var(--btn-primary-text)',
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity"
          >
            <Edit2 className="w-4 h-4" />
            Edit Account
          </Link>
        </div>
      </div>

      {/* Next Action Priority Card */}
      <AccountNextActionCard nextAction={account.nextAction} />

      {/* Overview Card */}
      <AccountOverviewCard account={account} />

      {/* Sub-Tabs Section */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="rounded-xl border shadow-xs overflow-hidden"
      >
        {/* Tab Header */}
        <div
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--table-header-bg)',
          }}
          className="border-b flex items-center px-4 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            style={{
              color: activeTab === 'contacts' ? 'var(--tag-text)' : 'var(--text-secondary)',
              borderBottomColor: activeTab === 'contacts' ? 'var(--btn-primary)' : 'transparent',
            }}
            className="flex items-center gap-2 py-3.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            Contacts ({account.contactCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            style={{
              color: activeTab === 'notes' ? 'var(--tag-text)' : 'var(--text-secondary)',
              borderBottomColor: activeTab === 'notes' ? 'var(--btn-primary)' : 'transparent',
            }}
            className="flex items-center gap-2 py-3.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            Notes ({account.noteCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deals')}
            style={{
              color: activeTab === 'deals' ? 'var(--tag-text)' : 'var(--text-secondary)',
              borderBottomColor: activeTab === 'deals' ? 'var(--btn-primary)' : 'transparent',
            }}
            className="flex items-center gap-2 py-3.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <TrendingUp className="w-4 h-4" />
            Deals ({account.dealCount})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'contacts' && <AccountContactsTab accountId={account.id} />}
          {activeTab === 'notes' && <AccountNotesTab accountId={account.id} />}
          {activeTab === 'deals' && <AccountDealsTab accountId={account.id} />}
        </div>
      </div>

      {/* Audit Footer */}
      <div
        style={{ color: 'var(--text-secondary)' }}
        className="text-xs flex flex-wrap items-center justify-between gap-3 pt-2 px-2"
      >
        <span>
          Created by <strong>{account.createdByName}</strong> on {account.createdDate}
        </span>
        <span>
          Last updated by <strong>{account.updatedByName}</strong> on {account.updatedDate}
        </span>
      </div>
    </div>
  );
};
