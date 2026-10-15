import React from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-[var(--text)] opacity-70 hover:opacity-100 hover:bg-[var(--background)] md:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--tag-bg)] text-[var(--tag-text)]">
            CRM Workspace
          </span>
        </div>
      </div>

      {/* Right side: user identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sidebar)] text-[var(--sidebar-text)] text-xs font-bold">
            {user?.name ? user.name.split(' ').map((n) => n[0]).join('') : 'EX'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold leading-none text-[var(--text)]">{user?.name || 'Executive User'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-[var(--link)]" />
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">Partner</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
