import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Eye,
  Pencil,
  Archive,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import type { ContactListItem } from '../../../types/contact';
import { ContactTierBadge } from './ContactTierBadge';
import { ContactStatusBadge } from './ContactStatusBadge';
import { ContactFollowUpBadge } from './ContactFollowUpBadge';
import { RelationshipBadge } from './RelationshipBadge';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { usePermissions, canEditContact, canCloseContact } from '../../../lib/permissions';

interface ContactTableProps {
  contacts: ContactListItem[];
  totalElements?: number;
  page?: number;
  size?: number;
  sort?: string;
  onPageChange?: (newPage: number) => void;
  onSizeChange?: (newSize: number) => void;
  onSortChange: (newSort: string) => void;
  onToggleClosed: (contactId: string, isClosed: boolean) => void;
  isTogglingClosed?: boolean;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  totalElements = 0,
  page = 0,
  size = 10,
  sort = 'updatedDate,desc',
  onPageChange,
  onSizeChange,
  onSortChange,
  onToggleClosed,
  isTogglingClosed = false,
}) => {
  const { user } = usePermissions();
  const [closingContact, setClosingContact] = useState<ContactListItem | null>(null);

  const [currentField = 'updatedDate', currentDirection = 'desc'] = sort.split(',');

  const handleSort = (field: string) => {
    if (currentField === field) {
      const nextDir = currentDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(`${field},${nextDir}`);
    } else {
      const defaultDir = field === 'nextFollowUpDate' ? 'asc' : field === 'updatedDate' ? 'desc' : 'asc';
      onSortChange(`${field},${defaultDir}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(field);
    }
  };

  const renderSortIcon = (field: string) => {
    const isActive = currentField === field;
    if (isActive) {
      return currentDirection === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 ml-1 text-slate-700 dark:text-slate-200 shrink-0 inline" aria-hidden="true" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 ml-1 text-slate-700 dark:text-slate-200 shrink-0 inline" aria-hidden="true" />
      );
    }
    return (
      <ArrowUpDown
        className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-40 transition-opacity text-slate-400 shrink-0 inline"
        aria-hidden="true"
      />
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="rounded-xl border shadow-xs overflow-hidden flex flex-col"
      >
        {/* Desktop / Tablet Table View (768px and up) */}
        <div className="hidden md:block overflow-x-auto w-full relative">
          <table
            className="w-full text-left text-sm border-collapse"
            style={{ minWidth: 'max-content', tableLayout: 'auto' }}
          >
            {/* Column Width Definitions */}
            <colgroup>
              <col style={{ width: '260px', minWidth: '260px' }} /> {/* Contact Name */}
              <col style={{ width: '200px', minWidth: '200px' }} /> {/* Company */}
              <col style={{ width: '200px', minWidth: '200px' }} /> {/* Target Role */}
              <col style={{ width: '70px', minWidth: '70px' }} />   {/* Tier */}
              <col style={{ width: '130px', minWidth: '130px' }} /> {/* Relationship */}
              <col style={{ width: '110px', minWidth: '110px' }} /> {/* Status */}
              <col style={{ width: '150px', minWidth: '150px' }} /> {/* Owner */}
              <col style={{ width: '150px', minWidth: '150px' }} /> {/* Next follow-up */}
              <col className="hidden xl:table-column" style={{ width: '80px', minWidth: '80px' }} /> {/* Closed */}
              <col className="hidden xl:table-column" style={{ width: '110px', minWidth: '110px' }} /> {/* Updated */}
              <col style={{ width: '100px', minWidth: '100px' }} /> {/* Actions */}
            </colgroup>

            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  color: 'var(--table-header-text)',
                  borderColor: 'var(--border)',
                }}
                className="border-b text-xs font-semibold uppercase tracking-wider select-none"
              >
                {/* Contact Name (Sticky Left) */}
                <th
                  scope="col"
                  aria-sort={currentField === 'name' ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onClick={() => handleSort('name')}
                  onKeyDown={(e) => handleKeyDown(e, 'name')}
                  style={{
                    backgroundColor: 'var(--table-header-bg)',
                    color: 'var(--table-header-text)',
                    minWidth: '260px',
                    width: '260px',
                  }}
                  className="sticky left-0 z-20 py-3.5 px-4 cursor-pointer group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center">
                    <span>Contact Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                {/* Company */}
                <th
                  scope="col"
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '200px' }}
                  className="py-3.5 px-4"
                >
                  Company
                </th>

                {/* Target Role */}
                <th
                  scope="col"
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '200px' }}
                  className="py-3.5 px-3"
                >
                  Target Role
                </th>

                {/* Tier */}
                <th
                  scope="col"
                  aria-sort={currentField === 'tier' ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onClick={() => handleSort('tier')}
                  onKeyDown={(e) => handleKeyDown(e, 'tier')}
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '70px' }}
                  className="py-3.5 px-3 text-center cursor-pointer group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center">
                    <span>Tier</span>
                    {renderSortIcon('tier')}
                  </div>
                </th>

                {/* Relationship */}
                <th
                  scope="col"
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '130px' }}
                  className="py-3.5 px-3 text-center"
                >
                  Relationship
                </th>

                {/* Status */}
                <th
                  scope="col"
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '110px' }}
                  className="py-3.5 px-3 text-center"
                >
                  Status
                </th>

                {/* Owner */}
                <th
                  scope="col"
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '150px' }}
                  className="py-3.5 px-3"
                >
                  Owner
                </th>

                {/* Next Follow-Up */}
                <th
                  scope="col"
                  aria-sort={currentField === 'nextFollowUpDate' ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onClick={() => handleSort('nextFollowUpDate')}
                  onKeyDown={(e) => handleKeyDown(e, 'nextFollowUpDate')}
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '150px' }}
                  className="py-3.5 px-4 cursor-pointer group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center">
                    <span>Next Follow-Up</span>
                    {renderSortIcon('nextFollowUpDate')}
                  </div>
                </th>

                {/* Closed (Hidden below 1280px) */}
                <th
                  scope="col"
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '80px' }}
                  className="hidden xl:table-cell py-3.5 px-3 text-center"
                >
                  Closed
                </th>

                {/* Updated Date (Hidden below 1280px) */}
                <th
                  scope="col"
                  aria-sort={currentField === 'updatedDate' ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onClick={() => handleSort('updatedDate')}
                  onKeyDown={(e) => handleKeyDown(e, 'updatedDate')}
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)', width: '110px' }}
                  className="hidden xl:table-cell py-3.5 px-4 cursor-pointer group hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center">
                    <span>Updated</span>
                    {renderSortIcon('updatedDate')}
                  </div>
                </th>

                {/* Actions (Sticky Right) */}
                <th
                  scope="col"
                  style={{
                    backgroundColor: 'var(--table-header-bg)',
                    color: 'var(--table-header-text)',
                    minWidth: '100px',
                    width: '100px',
                  }}
                  className="sticky right-0 z-20 py-3.5 px-4 text-right shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {contacts.map((contact) => {
                const mayEdit = canEditContact(contact, user) && !contact.isClosed;
                const mayClose = canCloseContact(contact, user);

                return (
                  <tr
                    key={contact.id}
                    className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors group"
                    style={{ color: 'var(--text)' }}
                  >
                    {/* Contact Name (Sticky Left) */}
                    <td
                      style={{
                        backgroundColor: 'var(--surface)',
                        minWidth: '260px',
                        width: '260px',
                      }}
                      className="sticky left-0 z-10 py-3.5 px-4 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            backgroundColor: 'var(--tag-bg)',
                            color: 'var(--tag-text)',
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs"
                        >
                          {contact.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/contacts/${contact.id}`}
                            style={{ color: 'var(--link)' }}
                            className="font-semibold text-sm hover:underline block truncate max-w-[190px]"
                            title={contact.name}
                          >
                            {contact.name}
                          </Link>
                          {contact.email ? (
                            <span
                              style={{ color: 'var(--text-secondary)' }}
                              className="text-xs truncate block flex items-center gap-1 mt-0.5 max-w-[190px]"
                              title={contact.email}
                            >
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }} className="text-xs block mt-0.5">
                              No email
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4" style={{ width: '200px', minWidth: '200px' }}>
                      <Link
                        to={`/accounts/${contact.companyId}`}
                        style={{ color: 'var(--text)' }}
                        className="font-medium text-xs hover:underline flex items-center gap-1.5"
                        title={contact.companyName || 'Associated Account'}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="truncate max-w-[160px]">{contact.companyName || 'Account'}</span>
                      </Link>
                    </td>

                    {/* Target Role (Clamped to 2 lines, full text in title tooltip) */}
                    <td className="py-3.5 px-3" style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }}>
                      <div className="w-[200px] max-w-[200px]">
                        <span
                          className="font-medium text-xs block text-slate-800 dark:text-slate-200 line-clamp-2 break-words"
                          title={contact.targetRole || undefined}
                        >
                          {contact.targetRole || '—'}
                        </span>
                        {contact.personaCategory && (
                          <span
                            style={{ color: 'var(--text-secondary)' }}
                            className="text-[11px] block mt-0.5 truncate"
                            title={contact.personaCategory}
                          >
                            {contact.personaCategory}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap" style={{ width: '70px' }}>
                      <ContactTierBadge tier={contact.tier} />
                    </td>

                    {/* Relationship */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap" style={{ width: '130px' }}>
                      <RelationshipBadge status={contact.relationshipStatus} />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap" style={{ width: '110px' }}>
                      <ContactStatusBadge status={contact.status} />
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-3 whitespace-nowrap" style={{ width: '150px' }}>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{
                            backgroundColor: 'var(--table-header-bg)',
                            color: 'var(--text-secondary)',
                          }}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        >
                          {contact.ownerCode || '—'}
                        </span>
                        <span className="text-xs font-medium truncate max-w-[110px]" title={contact.ownerName}>
                          {contact.ownerName || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Next Follow-Up */}
                    <td className="py-3.5 px-4 whitespace-nowrap" style={{ width: '150px' }}>
                      <ContactFollowUpBadge dateStr={contact.nextFollowUpDate} showIcon />
                    </td>

                    {/* Closed State (Hidden below 1280px) */}
                    <td className="hidden xl:table-cell py-3.5 px-3 text-center whitespace-nowrap" style={{ width: '80px' }}>
                      {contact.isClosed ? (
                        <span
                          style={{
                            backgroundColor: 'var(--relationship-cold-bg)',
                            color: 'var(--relationship-cold-text)',
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          title="Contact engagement is closed"
                        >
                          <Archive className="w-3 h-3" />
                          Closed
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: 'var(--status-active-bg)',
                            color: 'var(--status-active-text)',
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Open
                        </span>
                      )}
                    </td>

                    {/* Updated Date (Hidden below 1280px) */}
                    <td
                      className="hidden xl:table-cell py-3.5 px-4 whitespace-nowrap text-xs"
                      style={{ color: 'var(--text-secondary)', width: '110px' }}
                    >
                      {contact.updatedDate || '—'}
                    </td>

                    {/* Actions (Sticky Right) */}
                    <td
                      style={{
                        backgroundColor: 'var(--surface)',
                        minWidth: '100px',
                        width: '100px',
                      }}
                      className="sticky right-0 z-10 py-3.5 px-4 text-right whitespace-nowrap shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                    >
                      <div className="inline-flex items-center justify-end gap-1">
                        {/* View Button (Eye) */}
                        <Link
                          to={`/contacts/${contact.id}`}
                          aria-label={`View ${contact.name}`}
                          title="View Details"
                          style={{
                            backgroundColor: 'var(--btn-secondary-bg)',
                            borderColor: 'var(--btn-secondary-border)',
                            color: 'var(--link)',
                          }}
                          className="p-1.5 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Edit Button (Pencil) */}
                        {mayEdit ? (
                          <Link
                            to={`/contacts/${contact.id}/edit`}
                            aria-label={`Edit ${contact.name}`}
                            title="Edit Contact"
                            style={{
                              backgroundColor: 'var(--btn-secondary-bg)',
                              borderColor: 'var(--btn-secondary-border)',
                              color: 'var(--text-secondary)',
                            }}
                            className="p-1.5 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            aria-label="Edit restricted"
                            title={contact.isClosed ? 'Contact is closed. Reopen to edit.' : 'Editing restricted to contact owner'}
                            style={{
                              backgroundColor: 'var(--btn-secondary-bg)',
                              borderColor: 'var(--btn-secondary-border)',
                              color: 'var(--text-secondary)',
                              opacity: 0.35,
                            }}
                            className="p-1.5 rounded-md border cursor-not-allowed"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Close / Reopen Button (Archive) */}
                        {mayClose && (
                          <button
                            type="button"
                            onClick={() => setClosingContact(contact)}
                            aria-label={contact.isClosed ? `Reopen ${contact.name}` : `Close ${contact.name}`}
                            title={contact.isClosed ? 'Reopen Contact' : 'Close Contact'}
                            style={{
                              backgroundColor: 'var(--btn-secondary-bg)',
                              borderColor: 'var(--btn-secondary-border)',
                              color: contact.isClosed ? 'var(--status-info-text)' : 'var(--text-secondary)',
                            }}
                            className="p-1.5 rounded-md border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View (below 768px: md:hidden) */}
        <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
          {contacts.map((contact) => {
            const mayEdit = canEditContact(contact, user) && !contact.isClosed;
            const mayClose = canCloseContact(contact, user);

            return (
              <div
                key={contact.id}
                className="p-4 space-y-3 hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Header: Name + Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{
                        backgroundColor: 'var(--tag-bg)',
                        color: 'var(--tag-text)',
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs"
                    >
                      {contact.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/contacts/${contact.id}`}
                        style={{ color: 'var(--link)' }}
                        className="font-semibold text-sm hover:underline block truncate"
                      >
                        {contact.name}
                      </Link>
                      <Link
                        to={`/accounts/${contact.companyId}`}
                        style={{ color: 'var(--text-secondary)' }}
                        className="text-xs hover:underline block truncate flex items-center gap-1 mt-0.5"
                      >
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>{contact.companyName || 'Associated Account'}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="inline-flex items-center gap-1 shrink-0">
                    <Link
                      to={`/contacts/${contact.id}`}
                      aria-label={`View ${contact.name}`}
                      title="View Details"
                      style={{
                        backgroundColor: 'var(--btn-secondary-bg)',
                        borderColor: 'var(--btn-secondary-border)',
                        color: 'var(--link)',
                      }}
                      className="p-1.5 rounded-md border hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    {mayEdit ? (
                      <Link
                        to={`/contacts/${contact.id}/edit`}
                        aria-label={`Edit ${contact.name}`}
                        title="Edit Contact"
                        style={{
                          backgroundColor: 'var(--btn-secondary-bg)',
                          borderColor: 'var(--btn-secondary-border)',
                          color: 'var(--text-secondary)',
                        }}
                        className="p-1.5 rounded-md border hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-label="Edit restricted"
                        title={contact.isClosed ? 'Contact is closed. Reopen to edit.' : 'Editing restricted to owner'}
                        style={{
                          backgroundColor: 'var(--btn-secondary-bg)',
                          borderColor: 'var(--btn-secondary-border)',
                          color: 'var(--text-secondary)',
                          opacity: 0.35,
                        }}
                        className="p-1.5 rounded-md border cursor-not-allowed"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {mayClose && (
                      <button
                        type="button"
                        onClick={() => setClosingContact(contact)}
                        aria-label={contact.isClosed ? `Reopen ${contact.name}` : `Close ${contact.name}`}
                        title={contact.isClosed ? 'Reopen Contact' : 'Close Contact'}
                        style={{
                          backgroundColor: 'var(--btn-secondary-bg)',
                          borderColor: 'var(--btn-secondary-border)',
                          color: contact.isClosed ? 'var(--status-info-text)' : 'var(--text-secondary)',
                        }}
                        className="p-1.5 rounded-md border hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Target Role & Badges */}
                <div className="space-y-2 text-xs">
                  {contact.targetRole && (
                    <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                      {contact.targetRole}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <ContactTierBadge tier={contact.tier} />
                    <RelationshipBadge status={contact.relationshipStatus} />
                    <ContactStatusBadge status={contact.status} />
                    {contact.isClosed && (
                      <span
                        style={{
                          backgroundColor: 'var(--relationship-cold-bg)',
                          color: 'var(--relationship-cold-text)',
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      >
                        <Archive className="w-3 h-3" />
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Next Follow-Up and Owner */}
                <div
                  style={{ backgroundColor: 'var(--table-header-bg)', borderColor: 'var(--border)' }}
                  className="p-2.5 rounded-lg border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: 'var(--text-secondary)' }}>Follow-up:</span>
                    <ContactFollowUpBadge dateStr={contact.nextFollowUpDate} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Owner:</span>
                    <span className="font-medium">{contact.ownerName || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Footer */}
        {totalElements !== undefined && onPageChange && onSizeChange && (
          <div
            style={{
              borderTopColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
            }}
            className="border-t px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm"
          >
            {/* Count string */}
            <div style={{ color: 'var(--text-secondary)' }}>
              Showing{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {startItem}-{endItem}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {totalElements}
              </span>
            </div>

            {/* Page Size & Navigation Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span style={{ color: 'var(--text-secondary)' }}>Per page:</span>
                <select
                  value={size}
                  aria-label="Items per page"
                  onChange={(e) => {
                    onSizeChange(parseInt(e.target.value, 10));
                    onPageChange(0);
                  }}
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                  className="px-2 py-1 rounded border text-xs outline-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => onPageChange(page - 1)}
                  style={{
                    borderColor: 'var(--btn-secondary-border)',
                    color: page <= 0 ? 'var(--text-secondary)' : 'var(--btn-secondary-text)',
                  }}
                  className="p-1.5 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  title="Previous Page"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span style={{ color: 'var(--text-secondary)' }} className="px-2 font-medium">
                  Page {page + 1} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                  style={{
                    borderColor: 'var(--btn-secondary-border)',
                    color:
                      page >= totalPages - 1
                        ? 'var(--text-secondary)'
                        : 'var(--btn-secondary-text)',
                  }}
                  className="p-1.5 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  title="Next Page"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Close / Reopen */}
      {closingContact && (
        <ConfirmDialog
          isOpen={Boolean(closingContact)}
          title={closingContact.isClosed ? 'Reopen Contact?' : 'Close Contact?'}
          message={
            closingContact.isClosed
              ? `Are you sure you want to reopen ${closingContact.name}? This will mark their status as Open for team outreach.`
              : `Are you sure you want to close ${closingContact.name}? This will flag engagement as closed while preserving all past notes and follow-ups. Closed contacts become read-only until reopened.`
          }
          confirmLabel={closingContact.isClosed ? 'Reopen Contact' : 'Close Contact'}
          isDestructive={!closingContact.isClosed}
          isLoading={isTogglingClosed}
          onConfirm={() => {
            onToggleClosed(closingContact.id, !closingContact.isClosed);
            setClosingContact(null);
          }}
          onClose={() => setClosingContact(null)}
        />
      )}
    </>
  );
};
