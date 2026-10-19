import React from 'react';
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom';
import { BriefcaseBusiness } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { APP_NAME, APP_TAGLINE } from '../../../constants/app';

const BrandMark: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="flex items-center gap-2.5">
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-xs ${
        compact ? 'bg-[var(--sidebar)]' : 'bg-white/10'
      } text-[var(--sidebar-selected)]`}
    >
      <BriefcaseBusiness className="h-5 w-5" />
    </div>
    <div>
      <div
        className={`flex items-center gap-1.5 font-bold tracking-tight ${
          compact ? 'text-[var(--text)]' : 'text-[var(--sidebar-text)]'
        }`}
      >
        <span>{APP_NAME}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--sidebar-selected)]" />
      </div>
      <p
        className={`text-[10px] tracking-widest uppercase ${
          compact ? 'text-[var(--text-secondary)]' : 'text-[var(--sidebar-text)] opacity-60'
        }`}
      >
        {APP_TAGLINE}
      </p>
    </div>
  </div>
);

export const LoginPage: React.FC = () => {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;
  const destination = from && from.pathname !== '/login' ? `${from.pathname}${from.search}` : '/dashboard';

  if (status === 'authenticated') {
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="grid min-h-screen bg-[var(--background)] text-[var(--text)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Brand panel - desktop only, matches the sidebar */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[var(--sidebar)] p-10 text-[var(--sidebar-text)] lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full border-[40px] border-white/5"
        />
        <BrandMark />

        <div className="relative max-w-sm space-y-6">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Accounts, contacts and follow-ups in one place.
          </h2>
          <p className="text-sm leading-relaxed opacity-75">
            The strategic CRM for SAGASIA Consulting. Track every relationship, owner and next step across all
            business lines.
          </p>
        </div>

        <p className="relative text-xs opacity-60">Internal use only · SAGASIA Consulting</p>
      </aside>

      {/* Sign-in card */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <BrandMark compact />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs sm:p-8">
            <div className="mb-6 space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">Sign in</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Use the email and password your CRM administrator gave you.
              </p>
            </div>

            <LoginForm onSuccess={() => navigate(destination, { replace: true })} />
          </div>

          <p className="text-center text-xs text-[var(--text-secondary)]">
            Forgot your password? Ask your CRM administrator to reset it.
          </p>
        </div>
      </main>
    </div>
  );
};
