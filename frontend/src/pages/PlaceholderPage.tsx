import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Layers } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="space-y-6">
      {/* Module Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
            {title}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--link)] shadow-xs">
            <Layers className="h-3.5 w-3.5" />
            <span>Module View</span>
          </div>
        </div>
      </div>

      {/* Module Content Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--table-header-bg)] text-[var(--link)]">
          <Clock className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-[var(--text)]">
          {title} Module Under Development
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
          {description} Full data tables, filtering, and CRUD operations will be available upon Spring Boot backend integration.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--tag-bg)] px-3.5 py-1 text-xs font-semibold text-[var(--tag-text)]">
          Spring Boot REST API in Parallel
        </div>
        <div className="mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--btn-primary)] px-4 py-2 text-sm font-semibold text-[var(--btn-primary-text)] shadow transition hover:bg-[var(--btn-primary-hover)] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Executive Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
