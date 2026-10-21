import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Archive } from 'lucide-react';
import { useContact } from '../hooks/useContacts';
import { ContactForm } from '../components/ContactForm';
import { LoadingSkeleton, ErrorState } from '../../../components/common/WidgetState';
import { usePermissions } from '../../../lib/permissions';
import { NoAccessPage } from '../../../components/common/NoAccessPage';

export const ContactFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || undefined;

  const isEdit = Boolean(id);
  const { can } = usePermissions();

  const { data: contact, isLoading, isError, error, refetch } = useContact(id);

  // Permission checks
  if (!isEdit && !can('contact.create')) {
    return <NoAccessPage requiredAction="contact.create" />;
  }

  if (isEdit && !isLoading && contact && !can('contact.edit', { ownerId: contact.ownerId })) {
    return (
      <NoAccessPage
        message="You do not have permission to edit this contact. Members may only edit contacts they own."
        requiredAction="contact.edit"
      />
    );
  }

  if (isEdit && !isLoading && contact?.isClosed) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-8">
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-sm text-center space-y-4"
        >
          <div
            style={{
              backgroundColor: 'var(--relationship-cold-bg)',
              color: 'var(--relationship-cold-text)',
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          >
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Closed Contact Engagement
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              <strong>{contact.name}</strong> is currently flagged as Closed. Closed contacts are read-only until reopened.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to={`/contacts/${contact.id}`}
              style={{
                backgroundColor: 'var(--btn-primary)',
                color: 'var(--btn-primary-text)',
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold shadow hover:opacity-90 transition"
            >
              View Contact & Reopen
            </Link>
            <Link
              to="/contacts"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
              className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Back to Contacts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          to="/contacts"
          style={{ color: 'var(--link)' }}
          className="hover:underline font-medium"
        >
          Contacts
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        {isEdit && contact ? (
          <>
            <Link
              to={`/contacts/${contact.id}`}
              style={{ color: 'var(--link)' }}
              className="hover:underline truncate max-w-[200px]"
            >
              {contact.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span style={{ color: 'var(--text-secondary)' }}>Edit</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>New Contact</span>
        )}
      </nav>

      {/* Page Title & Back Link */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-bold tracking-tight">
            {isEdit ? `Edit Contact: ${contact?.name || '...'}` : 'Create New Contact'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-0.5">
            {isEdit
              ? 'Update contact coordinates, persona targeting, relationship status, and ownership.'
              : 'Add a new key decision-maker, stakeholder, or executive to the CRM database.'}
          </p>
        </div>

        <Link
          to={isEdit && id ? `/contacts/${id}` : '/contacts'}
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </Link>
      </div>

      {/* Form Content / States */}
      {isEdit && isLoading ? (
        <div
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          className="p-6 rounded-xl border shadow-2xs"
        >
          <LoadingSkeleton rows={8} />
        </div>
      ) : isEdit && isError ? (
        <ErrorState
          message={error?.message || `Failed to load contact '${id}' for editing.`}
          onRetry={() => refetch()}
        />
      ) : (
        <ContactForm
          isEdit={isEdit}
          initialData={contact}
          preselectedCompanyId={companyId}
        />
      )}
    </div>
  );
};
