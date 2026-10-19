import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  Clock,
  X,
  BriefcaseBusiness,
  UserCog,
  Tags,
  ListTree,
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../constants/app';
import { usePermissions } from '../../auth/permissions';
import type { PermissionAction } from '../../constants/users';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredAction?: PermissionAction;
}

const baseNavItems: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', to: '/accounts', icon: Building2 },
  { name: 'Contacts', to: '/contacts', icon: Users },
  { name: 'Pipeline', to: '/pipeline', icon: TrendingUp },
  { name: 'Follow-ups', to: '/follow-ups', icon: Clock },
  { name: 'Users', to: '/users', icon: UserCog, requiredAction: 'user.manage' },
  { name: 'Categories', to: '/settings/categories', icon: Tags, requiredAction: 'lookup.manage' },
  { name: 'Sub-categories', to: '/settings/sub-categories', icon: ListTree, requiredAction: 'lookup.manage' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { can } = usePermissions();

  const navItems = baseNavItems.filter((item) => {
    if (!item.requiredAction) return true;
    return can(item.requiredAction);
  });
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClose();
          }}
          className="fixed inset-0 z-40 bg-[var(--sidebar)] opacity-50 md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 h-screen flex-col bg-[var(--sidebar)] text-[var(--sidebar-text)] transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-[var(--sidebar-selected)] shadow-xs">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-[var(--sidebar-text)]">
                <span>{APP_NAME}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--sidebar-selected)]" />
              </div>
              <p className="text-[10px] tracking-widest text-[var(--sidebar-text)] opacity-60 uppercase">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--sidebar-text)] opacity-70 hover:opacity-100 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-3 py-6" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors border-l-4 rounded-r-md ${
                    isActive
                      ? 'border-[var(--sidebar-selected)] bg-white/5 text-[var(--sidebar-text)] font-semibold'
                      : 'border-transparent text-[var(--sidebar-text)] opacity-75 hover:bg-white/5 hover:opacity-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[var(--sidebar-selected)]' : 'text-current'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-white/5 p-3 text-xs">
            <p className="font-semibold text-[var(--sidebar-text)]">SAGASIA Advisory Portal</p>
            <p className="mt-0.5 text-[var(--sidebar-text)] opacity-60">Spring REST &bull; v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};
