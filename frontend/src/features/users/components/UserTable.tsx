import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit2,
  KeyRound,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Building2,
  Users,
  Loader2,
} from 'lucide-react';
import type { UserListItem } from '../../../types/user';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import { useToggleUserStatus } from '../hooks/useUsers';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { useAuth } from '../../../context/AuthContext';

interface UserTableProps {
  users: UserListItem[];
  totalElements: number;
  page: number;
  size: number;
  sort?: string;
  onPageChange: (newPage: number) => void;
  onSizeChange: (newSize: number) => void;
  onSortChange: (newSort: string) => void;
  onResetPassword: (user: UserListItem) => void;
  onConflict: (message: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  totalElements,
  page,
  size,
  sort = 'updatedDate,desc',
  onPageChange,
  onSizeChange,
  onSortChange,
  onResetPassword,
  onConflict,
}) => {
  const toggleMutation = useToggleUserStatus();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const [currentField = 'updatedDate', currentDirection = 'desc'] = sort.split(',');

  const handleSort = (field: 'name' | 'updatedDate') => {
    if (currentField === field) {
      const nextDir = currentDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(`${field},${nextDir}`);
    } else {
      const defaultDir = field === 'updatedDate' ? 'desc' : 'asc';
      onSortChange(`${field},${defaultDir}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'name' | 'updatedDate') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(field);
    }
  };

  const renderSortIcon = (field: 'name' | 'updatedDate') => {
    const isActive = currentField === field;
    if (isActive) {
      return currentDirection === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 ml-1 text-slate-700 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 ml-1 text-slate-700 shrink-0" aria-hidden="true" />
      );
    }
    return (
      <ArrowUpDown
        className="w-3.5 h-3.5 ml-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        aria-hidden="true"
      />
    );
  };

  const totalPages = Math.ceil(totalElements / size);
  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';

  const [confirmingUser, setConfirmingUser] = useState<UserListItem | null>(null);

  const handleToggleStatus = (targetUser: UserListItem) => {
    if (targetUser.role === 'SUPER_ADMIN') {
      onConflict('The Super Admin account cannot be deactivated or changed.');
      return;
    }
    if (currentUser?.id === targetUser.id) {
      onConflict('You cannot deactivate your own active account.');
      return;
    }
    setConfirmingUser(targetUser);
  };

  const handleConfirmedToggleStatus = async () => {
    if (!confirmingUser) return;
    const targetUser = confirmingUser;
    const nextStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      setLoadingUserId(targetUser.id);
      await toggleMutation.mutateAsync({
        id: targetUser.id,
        status: nextStatus,
      });
      setConfirmingUser(null);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        'Unable to modify user account status.';
      setConfirmingUser(null);
      onConflict(message);
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      className="rounded-xl border shadow-xs overflow-hidden"
    >
      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--table-header-bg)',
                color: 'var(--table-header-text)',
              }}
              className="border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider select-none"
            >
              {/* Name column - SORTABLE */}
              <th
                scope="col"
                aria-sort={
                  currentField === 'name'
                    ? currentDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                tabIndex={0}
                onClick={() => handleSort('name')}
                onKeyDown={(e) => handleKeyDown(e, 'name')}
                className="py-3 px-4 cursor-pointer group hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--btn-primary)]"
              >
                <div className="flex items-center">
                  User {renderSortIcon('name')}
                </div>
              </th>

              {/* Role - NON-SORTABLE */}
              <th scope="col" className="py-3 px-3 text-center">Role</th>

              {/* Manager / Admin - SUPER_ADMIN only */}
              {isSuperAdmin && (
                <th scope="col" className="py-3 px-3 text-center">Manager / Admin</th>
              )}

              {/* Status - NON-SORTABLE */}
              <th scope="col" className="py-3 px-3 text-center">Status</th>

              {/* Accounts Count - NON-SORTABLE */}
              <th scope="col" className="py-3 px-3 text-center">Accounts</th>

              {/* Contacts Count - NON-SORTABLE */}
              <th scope="col" className="py-3 px-3 text-center">Contacts</th>

              {/* Updated Date - SORTABLE */}
              <th
                scope="col"
                aria-sort={
                  currentField === 'updatedDate'
                    ? currentDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                tabIndex={0}
                onClick={() => handleSort('updatedDate')}
                onKeyDown={(e) => handleKeyDown(e, 'updatedDate')}
                className="py-3 px-4 cursor-pointer group hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--btn-primary)]"
              >
                <div className="flex items-center">
                  Updated {renderSortIcon('updatedDate')}
                </div>
              </th>

              {/* Actions - NON-SORTABLE */}
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]" style={{ color: 'var(--text)' }}>
            {users.map((usr) => {
              const initials = usr.code
                ? usr.code
                : usr.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();

              const isToggling = loadingUserId === usr.id && toggleMutation.isPending;

              return (
                <tr
                  key={usr.id}
                  className="hover:bg-slate-50/75 transition-colors group"
                >
                  {/* User Column */}
                  <td className="py-3.5 px-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--sidebar)] text-[var(--sidebar-text)] text-xs font-bold shadow-xs overflow-hidden border border-[var(--border)] select-none">
                        {usr.photoUrl ? (
                          <img src={usr.photoUrl} alt={usr.name} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[var(--text)] truncate">{usr.name}</p>
                          {usr.code && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--tag-bg)] text-[var(--tag-text)]">
                              {usr.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] truncate">
                          <span>@{usr.username}</span>
                          {usr.email && <span>• {usr.email}</span>}
                        </div>
                      </div>
                  </td>

                  {/* Role Column */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <UserRoleBadge role={usr.role} />
                  </td>

                  {/* Manager / Admin Column (SUPER_ADMIN only) */}
                  {isSuperAdmin && (
                    <td className="py-3.5 px-3 text-center whitespace-nowrap text-xs text-[var(--text)]">
                      {usr.role === 'MEMBER' ? (
                        usr.managerName ? (
                          <span className="inline-flex items-center gap-1 font-medium text-[var(--text)]">
                            {usr.managerName}
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] italic">Unassigned</span>
                        )
                      ) : usr.role === 'ADMIN' ? (
                        <span className="text-[var(--text-secondary)] text-[11px]">— (Admin)</span>
                      ) : (
                        <span className="text-[var(--text-secondary)] text-[11px]">— (Super Admin)</span>
                      )}
                    </td>
                  )}

                  {/* Status Column */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <UserStatusBadge status={usr.status} />
                  </td>

                  {/* Accounts Count Column */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap text-xs text-[var(--text)]">
                    <div className="inline-flex items-center gap-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{usr.accountCount ?? 0}</span>
                    </div>
                  </td>

                  {/* Contacts Count Column */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap text-xs text-[var(--text)]">
                    <div className="inline-flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{usr.contactCount ?? 0}</span>
                    </div>
                  </td>

                  {/* Updated Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[var(--text-secondary)]">
                    {usr.updatedDate ? usr.updatedDate.split('T')[0] : '—'}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {(() => {
                      const isTargetSelf = currentUser?.id === usr.id;
                      const canAdminManage = isAdmin && usr.role === 'MEMBER' && usr.managerId === currentUser?.id;
                      const canSuperAdminManage = isSuperAdmin && usr.role !== 'SUPER_ADMIN';
                      const canManage = canSuperAdminManage || canAdminManage;

                      if (!canManage && !isTargetSelf) {
                        return <span className="text-xs text-[var(--text-secondary)] italic pr-2">—</span>;
                      }

                      return (
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit User Button */}
                          <Link
                            to={isTargetSelf ? '/profile' : `/users/${usr.id}/edit`}
                            style={{
                              backgroundColor: 'var(--btn-secondary-bg)',
                              borderColor: 'var(--btn-secondary-border)',
                              color: 'var(--text-secondary)',
                            }}
                            className="p-1.5 rounded-md border hover:bg-slate-100 transition-colors"
                            title={isTargetSelf ? 'Edit My Profile' : 'Edit User'}
                            aria-label={`Edit ${usr.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => onResetPassword(usr)}
                            style={{
                              backgroundColor: 'var(--btn-secondary-bg)',
                              borderColor: 'var(--btn-secondary-border)',
                              color: 'var(--text-secondary)',
                            }}
                            className="p-1.5 rounded-md border hover:bg-slate-100 transition-colors cursor-pointer"
                            title={isTargetSelf ? 'Change Password' : 'Reset Password'}
                            aria-label={`Reset password for ${usr.name}`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Inactive Status */}
                          {canManage && usr.role !== 'SUPER_ADMIN' && !isTargetSelf && (
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleStatus(usr)}
                              style={{
                                backgroundColor: 'var(--btn-secondary-bg)',
                                borderColor: 'var(--btn-secondary-border)',
                                color:
                                  usr.status === 'ACTIVE'
                                    ? 'var(--status-overdue-text)'
                                    : 'var(--status-success-text)',
                              }}
                              className="p-1.5 rounded-md border hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                              title={
                                usr.status === 'ACTIVE'
                                  ? 'Deactivate User Account'
                                  : 'Activate User Account'
                              }
                              aria-label={
                                usr.status === 'ACTIVE'
                                  ? `Deactivate ${usr.name}`
                                  : `Activate ${usr.name}`
                              }
                            >
                              {isToggling ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : usr.status === 'ACTIVE' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          borderTopColor: 'var(--border)',
          backgroundColor: 'var(--background)',
          color: 'var(--text-secondary)',
        }}
        className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-[var(--text)]">{startItem}</strong> to{' '}
            <strong className="text-[var(--text)]">{endItem}</strong> of{' '}
            <strong className="text-[var(--text)]">{totalElements}</strong> users
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select
              value={size}
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
              aria-label="Rows per page"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
              style={{
                borderColor: 'var(--btn-secondary-border)',
                color: page <= 0 ? 'var(--text-secondary)' : 'var(--btn-secondary-text)',
              }}
              className="p-1.5 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              title="Previous Page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-medium text-[var(--text)]">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              style={{
                borderColor: 'var(--btn-secondary-border)',
                color: page >= totalPages - 1 ? 'var(--text-secondary)' : 'var(--btn-secondary-text)',
              }}
              className="p-1.5 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              title="Next Page"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Styled Confirmation Dialog for Deactivate / Activate */}
      <ConfirmDialog
        isOpen={Boolean(confirmingUser)}
        title={
          confirmingUser?.status === 'ACTIVE'
            ? 'Deactivate User Account'
            : 'Activate User Account'
        }
        message={
          confirmingUser?.status === 'ACTIVE'
            ? `Are you sure you want to deactivate ${confirmingUser?.name}? This will revoke their access to the CRM.`
            : `Are you sure you want to activate ${confirmingUser?.name}? This will restore their access to the CRM.`
        }
        confirmLabel={
          confirmingUser?.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'
        }
        isDestructive={confirmingUser?.status === 'ACTIVE'}
        isLoading={toggleMutation.isPending}
        onConfirm={handleConfirmedToggleStatus}
        onClose={() => setConfirmingUser(null)}
      />
    </div>
  );
};
