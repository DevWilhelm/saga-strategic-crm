import React from 'react';
import { Globe, Building2, Briefcase, Compass, FileText, Layers } from 'lucide-react';
import type { AccountDetail } from '../../../types/account';
import { BusinessLineDot } from './BusinessLineDot';

interface AccountOverviewCardProps {
  account: AccountDetail;
}

export const AccountOverviewCard: React.FC<AccountOverviewCardProps> = ({ account }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      className="p-6 rounded-xl border shadow-xs space-y-6"
    >
      <h3 style={{ color: 'var(--text)' }} className="text-base font-bold flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-500" />
        Account Overview
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Business Line */}
        <div>
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium block mb-1">
            Business Line
          </span>
          <BusinessLineDot businessLine={account.businessLine} />
        </div>

        {/* Primary Service */}
        <div>
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium block mb-1">
            Mandate Service
          </span>
          <span style={{ color: 'var(--text)' }} className="text-sm font-semibold flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            {account.serviceName}
          </span>
        </div>

        {/* Deal Side */}
        <div>
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium block mb-1">
            Deal Orientation
          </span>
          <span
            style={{
              backgroundColor:
                account.dealSide === 'BUY_SIDE' ? 'var(--status-info-bg)' : 'var(--tag-bg)',
              color:
                account.dealSide === 'BUY_SIDE' ? 'var(--status-info-text)' : 'var(--tag-text)',
            }}
            className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full"
          >
            {account.dealSide === 'BUY_SIDE' ? 'Buy-Side' : account.dealSide === 'SELL_SIDE' ? 'Sell-Side' : 'Unspecified'}
          </span>
        </div>

        {/* Country */}
        <div>
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium block mb-1">
            Incorporation Country
          </span>
          <span style={{ color: 'var(--text)' }} className="text-sm font-medium flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            {account.country}
          </span>
        </div>

        {/* Website Link */}
        <div>
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium block mb-1">
            Website URL
          </span>
          {account.websiteUrl ? (
            <a
              href={account.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--link)' }}
              className="text-sm font-medium hover:underline inline-flex items-center gap-1.5 truncate max-w-full"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              {account.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
              Not provided
            </span>
          )}
        </div>

        {/* Source Reference */}
        <div>
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium block mb-1">
            Source Reference
          </span>
          <span style={{ color: 'var(--text)' }} className="text-sm font-medium flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            {account.sourceRef || '—'}
          </span>
        </div>

        {/* Category & SubCategory */}
        <div className="sm:col-span-2">
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium block mb-1">
            Industry Classification
          </span>
          <span style={{ color: 'var(--text)' }} className="text-sm font-semibold">
            {account.categoryName} {account.subCategoryName ? `› ${account.subCategoryName}` : ''}
          </span>
        </div>
      </div>

      {/* Account Note / Description */}
      {account.note && (
        <div
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border)',
          }}
          className="p-4 rounded-lg border text-sm"
        >
          <div className="flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Account Notes & Profile Brief</span>
          </div>
          <p style={{ color: 'var(--text)' }} className="leading-relaxed whitespace-pre-wrap">
            {account.note}
          </p>
        </div>
      )}
    </div>
  );
};
