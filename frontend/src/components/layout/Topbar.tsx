import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, User as UserIcon, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../constants/users';

interface TopbarProps {
  onToggleSidebar: () => void;
}

const DEV_PERSONAS: Array<{
  id: string;
  name: string;
  username: string;
  role: UserRole;
  desc: string;
}> = [
  { id: 'usr-ploy', name: 'Ploy S.', username: 'ploy.s', role: 'ADMIN', desc: 'Full System Admin' },
  { id: 'usr-1', name: 'Danai K.', username: 'danai.k', role: 'MEMBER', desc: 'Healthcare Lead' },
  { id: 'usr-2', name: 'Somchai P.', username: 'somchai.p', role: 'MEMBER', desc: 'Financial Advisory' },
  { id: 'usr-5', name: 'Ananda K.', username: 'ananda.k', role: 'VIEWER', desc: 'Read-only Analyst' },
];

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, switchDevUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle switching persona
  const handleSelectPersona = async (personaId: string) => {
    if (personaId === user?.id) {
      setDropdownOpen(false);
      return;
    }
    try {
      setIsSwitching(true);
      await switchDevUser(personaId);
    } finally {
      setIsSwitching(false);
      setDropdownOpen(false);
    }
  };

  const getRoleBadgeClasses = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-[var(--sidebar)] text-[var(--sidebar-text)]';
      case 'MEMBER':
        return 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]';
      case 'VIEWER':
        return 'bg-[var(--relationship-cold-bg)] text-[var(--relationship-cold-text)]';
      default:
        return 'bg-[var(--background)] text-[var(--text-secondary)]';
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

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

      {/* Right side: User menu & Dev Switcher */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-[var(--background)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sidebar)] text-[var(--sidebar-text)] text-xs font-bold shadow-xs overflow-hidden border border-[var(--border)] select-none">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user?.name || 'User'} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold leading-none text-[var(--text)]">{user?.name || 'Loading...'}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${getRoleBadgeClasses(
                  user?.role
                )}`}
              >
                {user?.role || 'MEMBER'}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--text-secondary)] opacity-70" />
        </button>

        {/* Dropdown Card */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* User Header */}
            <div className="border-b border-[var(--border)] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--text)]">{user?.name}</p>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${getRoleBadgeClasses(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">@{user?.username}</p>
            </div>

            {/* Profile Action */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--background)] transition-colors cursor-pointer"
              >
                <UserIcon className="h-4 w-4 text-[var(--text-secondary)]" />
                <span>My Profile &amp; Password</span>
              </button>
            </div>

            {/* DEV Mock Role Switcher Section */}
            <div className="border-t border-[var(--border)] pt-2 mt-1">
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Dev Role Switcher
                </span>
                {isSwitching && (
                  <span className="text-[10px] text-[var(--link)] animate-pulse">Switching...</span>
                )}
              </div>

              <div className="mt-1 space-y-1">
                {DEV_PERSONAS.map((persona) => {
                  const isActive = persona.id === user?.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      disabled={isSwitching}
                      onClick={() => handleSelectPersona(persona.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[var(--tag-bg)] text-[var(--tag-text)] font-semibold'
                          : 'text-[var(--text)] hover:bg-[var(--background)]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{persona.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${getRoleBadgeClasses(
                              persona.role
                            )}`}
                          >
                            {persona.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">{persona.desc}</p>
                      </div>
                      {isActive && <UserCheck className="h-4 w-4 shrink-0 text-[var(--tag-text)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
