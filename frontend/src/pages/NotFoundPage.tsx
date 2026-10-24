import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div
        style={{
          backgroundColor: 'var(--status-info-bg)',
          color: 'var(--status-info-text)',
        }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs mb-4"
      >
        <Compass className="h-8 w-8" />
      </div>

      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--link)] mb-1">
        Error 404
      </span>

      <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
        Page Not Found
      </h1>

      <p style={{ color: 'var(--text-secondary)' }} className="mt-2 max-w-md text-sm leading-relaxed">
        The destination you are looking for doesn't exist, has been removed, or the link may be mistyped.
      </p>

      <div className="mt-6">
        <Link
          to="/dashboard"
          style={{
            backgroundColor: 'var(--btn-primary)',
            color: 'var(--btn-primary-text)',
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
