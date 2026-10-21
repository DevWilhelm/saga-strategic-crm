import React from 'react';
import {
  Mail,
  Phone,
  Target,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { LinkedInIcon } from './LinkedInIcon';
import type { ContactDetail } from '../../../types/contact';
import { TierBadge } from '../../accounts/components/TierBadge';
import { FollowUpDateBadge } from '../../accounts/components/FollowUpDateBadge';

interface ContactOverviewCardProps {
  contact: ContactDetail;
}

export const ContactOverviewCard: React.FC<ContactOverviewCardProps> = ({ contact }) => {
  return (
    <div className="space-y-6">
      {/* 1. Strategic Targeting & Angle */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-6 rounded-xl border shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <Target className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Strategic Targeting & Positioning
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
              Target Role
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
              {contact.targetRole || '—'}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
              Persona Category
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
              {contact.personaCategory || '—'}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
              Role Keyword
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
              {contact.roleKeyword || '—'}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
              Priority Tier
            </span>
            <div className="mt-1">
              <TierBadge tier={contact.tier} />
            </div>
          </div>
        </div>

        {/* Target Angle Banner */}
        {contact.targetAngle && (
          <div
            style={{
              backgroundColor: 'var(--table-header-bg)',
              borderColor: 'var(--border)',
            }}
            className="p-4 rounded-lg border mt-2"
          >
            <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--btn-primary)' }}>
              Strategic Angle & Thesis:
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {contact.targetAngle}
            </p>
          </div>
        )}

        {/* Next Step */}
        {contact.nextStep && (
          <div className="pt-2">
            <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
              Next Step Objective:
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {contact.nextStep}
            </p>
          </div>
        )}
      </div>

      {/* 2. Communication & Social Coordinates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Coordinates */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Mail className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Communication Details
            </h3>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </span>
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  style={{ color: 'var(--link)' }}
                  className="inline-flex items-center gap-1.5 font-semibold hover:underline mt-0.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {contact.email}
                </a>
              ) : (
                <span className="text-slate-400 text-xs">—</span>
              )}
            </div>

            <div>
              <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
                Phone Number
              </span>
              {contact.phoneNo ? (
                <a
                  href={`tel:${contact.phoneNo}`}
                  style={{ color: 'var(--text)' }}
                  className="inline-flex items-center gap-1.5 font-medium hover:underline mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {contact.phoneNo}
                </a>
              ) : (
                <span className="text-slate-400 text-xs">—</span>
              )}
            </div>

            <div>
              <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
                Next Follow-Up Due
              </span>
              <div className="mt-1">
                <FollowUpDateBadge dateStr={contact.nextFollowUpDate} showIcon />
              </div>
            </div>
          </div>
        </div>

        {/* LinkedIn & Social Intelligence */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <LinkedInIcon className="w-4 h-4 text-[#0077b5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              LinkedIn & Social Intelligence
            </h3>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
                LinkedIn Search Name / Handle
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                {contact.linkedinSearchName || '—'}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
                Profile Link
              </span>
              {contact.linkedinProfileUrl ? (
                <a
                  href={contact.linkedinProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0077b5] hover:underline mt-1"
                >
                  <span>Open LinkedIn Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-slate-400 text-xs">No LinkedIn profile URL recorded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Advisory Notes & Remarks */}
      {(contact.note || contact.remark) && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <FileText className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Advisory Profile Notes & Internal Remarks
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {contact.note && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block text-slate-500 mb-1">
                  Profile Note:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {contact.note}
                </p>
              </div>
            )}

            {contact.remark && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block text-slate-500 mb-1">
                  Internal Remarks:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {contact.remark}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
