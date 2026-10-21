import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Building2,
  Lock,
  AlertCircle,
  Loader2,
  Mail,
  FileText,
  Target,
  Sparkles,
  User as UserIcon,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { LinkedInIcon } from './LinkedInIcon';
import { useQuery } from '@tanstack/react-query';
import type { Contact } from '../../../types/contact';
import { CONTACT_TIERS, RELATIONSHIP_STATUSES, CONTACT_STATUSES } from '../../../types/contact';
import { contactFormSchema, type ContactFormData } from '../schemas/contactSchema';
import { useCreateContact, useUpdateContact } from '../hooks/useContacts';
import { accountsApi } from '../../../api/accountsApi';
import { usersApi } from '../../../api/usersApi';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

interface ContactFormProps {
  initialData?: Contact;
  isEdit?: boolean;
  preselectedCompanyId?: string;
  onConflict?: (message: string) => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  isEdit = false,
  preselectedCompanyId,
  onConflict,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();

  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Fetch accounts list for company selector
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts', 'select-options'],
    queryFn: () => accountsApi.getAccounts({ size: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch users for owner selector
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'options'],
    queryFn: () => usersApi.getUserOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const accounts = React.useMemo(() => accountsData?.content || [], [accountsData]);
  const allUsers = React.useMemo(() => usersData || [], [usersData]);

  // Scoped owner options according to role:
  // - MEMBER: only self
  // - ADMIN: self + their direct members
  // - SUPER_ADMIN: all active users
  const availableOwnerOptions = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'MEMBER') {
      return allUsers.filter((u) => u.id === currentUser.id);
    }
    if (currentUser.role === 'ADMIN') {
      return allUsers.filter(
        (u) =>
          u.id === currentUser.id ||
          (u as unknown as { managerId?: string | null }).managerId === currentUser.id
      );
    }
    return allUsers; // SUPER_ADMIN
  }, [currentUser, allUsers]);

  const defaultCompanyId = preselectedCompanyId || initialData?.companyId || '';
  const isCompanyLocked = Boolean(preselectedCompanyId && !isEdit);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      companyId: defaultCompanyId,
      targetRole: initialData?.targetRole || '',
      personaCategory: initialData?.personaCategory || '',
      roleKeyword: initialData?.roleKeyword || '',
      tier: initialData?.tier || 'TIER_2',
      linkedinSearchName: initialData?.linkedinSearchName || '',
      linkedinProfileUrl: initialData?.linkedinProfileUrl || '',
      email: initialData?.email || '',
      phoneNo: initialData?.phoneNo || '',
      targetAngle: initialData?.targetAngle || '',
      status: initialData?.status || 'ACTIVE',
      nextStep: initialData?.nextStep || '',
      ownerId: initialData?.ownerId || currentUser?.id || '',
      note: initialData?.note || '',
      relationshipStatus: initialData?.relationshipStatus || 'WARM',
      isClosed: initialData?.isClosed ?? false,
      remark: initialData?.remark || '',
    },
  });

  useEffect(() => {
    if (preselectedCompanyId && !initialData?.companyId) {
      setValue('companyId', preselectedCompanyId);
    }
  }, [preselectedCompanyId, initialData?.companyId, setValue]);

  const onSubmit = async (data: ContactFormData) => {
    setServerErrors({});
    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data,
        });
        navigate(`/contacts/${initialData.id}`);
      } else {
        const created = await createMutation.mutateAsync(data);
        navigate(`/contacts/${created.id}`);
      }
    } catch (err: unknown) {
      // Handle Axios error responses (400 validation, 403 forbidden, 409 conflict)
      const errorObj = err as {
        response?: {
          status: number;
          data?: {
            error?: {
              code?: string;
              message?: string;
              details?: Array<{ field: string; message: string }>;
            };
            message?: string;
          };
        };
        message?: string;
      };

      if (errorObj.response?.status === 409) {
        const conflictMsg =
          errorObj.response.data?.error?.message ||
          errorObj.response.data?.message ||
          'A duplicate contact record with this name or email already exists.';
        if (onConflict) {
          onConflict(conflictMsg);
        } else {
          setServerErrors({ general: conflictMsg });
        }
        return;
      }

      if (errorObj.response?.data?.error?.details) {
        const fieldMap: Record<string, string> = {};
        errorObj.response.data.error.details.forEach((d) => {
          fieldMap[d.field] = d.message;
        });
        setServerErrors(fieldMap);
        return;
      }

      const fallbackMsg =
        errorObj.response?.data?.error?.message ||
        errorObj.response?.data?.message ||
        errorObj.message ||
        'An error occurred while saving the contact profile.';
      setServerErrors({ general: fallbackMsg });
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      navigate(-1);
    }
  };

  const matchedAccount = accounts.find((a) => a.id === defaultCompanyId);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Server Error Banner */}
        {serverErrors.general && (
          <div
            style={{
              backgroundColor: 'var(--status-inactive-bg)',
              color: 'var(--status-inactive-text)',
              borderColor: 'var(--border)',
            }}
            className="p-4 rounded-xl border flex items-start gap-3 text-sm font-medium animate-fadeIn"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to Save Contact Profile</p>
              <p className="mt-0.5 text-xs opacity-90">{serverErrors.general}</p>
            </div>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Building2 className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              1. Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Name */}
            <div>
              <label htmlFor="contact-name" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="e.g. Dr. Somchai Prasert"
                {...register('name')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: errors.name || serverErrors.name ? 'red' : 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
              {(errors.name || serverErrors.name) && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name?.message || serverErrors.name}
                </p>
              )}
            </div>

            {/* Company / Account Selection */}
            <div>
              <label htmlFor="contact-companyId" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Associated Company <span className="text-red-500">*</span>
              </label>
              {isCompanyLocked ? (
                <div
                  style={{
                    backgroundColor: 'var(--table-header-bg)',
                    borderColor: 'var(--border)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {matchedAccount?.name || 'Pre-selected Account'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                    Locked from Account
                  </span>
                </div>
              ) : (
                <select
                  id="contact-companyId"
                  {...register('companyId')}
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text)',
                    borderColor: errors.companyId || serverErrors.companyId ? 'red' : 'var(--input-border)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] cursor-pointer"
                  disabled={isLoadingAccounts}
                >
                  <option value="">-- Select Company Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.country || 'Global'})
                    </option>
                  ))}
                </select>
              )}
              {(errors.companyId || serverErrors.companyId) && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.companyId?.message || serverErrors.companyId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Strategic Targeting & Positioning */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Target className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              2. Targeting & Positioning
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Role */}
            <div>
              <label htmlFor="contact-targetRole" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Target Role / Title
              </label>
              <input
                id="contact-targetRole"
                type="text"
                placeholder="e.g. Chief Medical Officer"
                {...register('targetRole')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
            </div>

            {/* Persona Category */}
            <div>
              <label htmlFor="contact-personaCategory" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Persona Category
              </label>
              <input
                id="contact-personaCategory"
                type="text"
                placeholder="e.g. C-Suite, M&A / Strategy"
                {...register('personaCategory')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
            </div>

            {/* Role Keyword */}
            <div>
              <label htmlFor="contact-roleKeyword" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Role Keyword
              </label>
              <input
                id="contact-roleKeyword"
                type="text"
                placeholder="e.g. Medical Officer, Clinical Trials"
                {...register('roleKeyword')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Tier */}
            <div>
              <label htmlFor="contact-tier" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Strategic Priority Tier <span className="text-red-500">*</span>
              </label>
              <select
                id="contact-tier"
                {...register('tier')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] cursor-pointer"
              >
                {CONTACT_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Angle */}
            <div className="md:col-span-2">
              <label htmlFor="contact-targetAngle" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Target Angle (Strategic Hook / Engagement Thesis)
              </label>
              <textarea
                id="contact-targetAngle"
                rows={2}
                placeholder="What strategic theme or pain point aligns with this executive? (e.g. Cross-border telehealth expansion into private hospital network...)"
                {...register('targetAngle')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] resize-y"
              />
            </div>
          </div>
        </div>

        {/* Section 3: LinkedIn & Social Intelligence */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <LinkedInIcon className="w-4 h-4 text-[#0077b5]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              3. LinkedIn & Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-linkedinSearchName" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                LinkedIn Search Name / Handle
              </label>
              <input
                id="contact-linkedinSearchName"
                type="text"
                placeholder="e.g. somchai-prasert"
                {...register('linkedinSearchName')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
            </div>

            <div>
              <label htmlFor="contact-linkedinProfileUrl" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                LinkedIn Profile URL (must begin with https://)
              </label>
              <input
                id="contact-linkedinProfileUrl"
                type="url"
                placeholder="https://www.linkedin.com/in/somchai-prasert"
                {...register('linkedinProfileUrl')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: errors.linkedinProfileUrl ? 'red' : 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
              {errors.linkedinProfileUrl && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.linkedinProfileUrl.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Contact Details */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Mail className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              4. Contact Coordinates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-email" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                placeholder="e.g. somchai.p@siamcare.th"
                {...register('email')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: errors.email || serverErrors.email ? 'red' : 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
              {(errors.email || serverErrors.email) && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email?.message || serverErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-phoneNo" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Phone Number (max 20 digits)
              </label>
              <input
                id="contact-phoneNo"
                type="tel"
                placeholder="e.g. +66 2 123 4567"
                {...register('phoneNo')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: errors.phoneNo ? 'red' : 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
              />
              {errors.phoneNo && (
                <p className="text-xs text-red-500 mt-1">{errors.phoneNo.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Relationship & Engagement */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              5. Relationship & Engagement State
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Relationship Status */}
            <div>
              <label htmlFor="contact-relationshipStatus" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Relationship Status <span className="text-red-500">*</span>
              </label>
              <select
                id="contact-relationshipStatus"
                {...register('relationshipStatus')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] cursor-pointer"
              >
                {RELATIONSHIP_STATUSES.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Status (Active / Inactive placeholder) */}
            <div>
              <label htmlFor="contact-status" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Contact Record Status <span className="text-red-500">*</span>
              </label>
              <select
                id="contact-status"
                {...register('status')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] cursor-pointer"
              >
                {CONTACT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Closed State Toggle */}
            <div className="flex flex-col justify-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('isClosed')}
                  className="w-4 h-4 rounded text-[var(--btn-primary)] focus:ring-[var(--btn-primary)] cursor-pointer"
                />
                <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                  Mark as Closed / Archived
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Archived contacts preserve past records without active cadence.
              </p>
            </div>
          </div>

          {/* Next Step */}
          <div className="pt-2">
            <label htmlFor="contact-nextStep" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Immediate Next Step / Action Objective
            </label>
            <input
              id="contact-nextStep"
              type="text"
              placeholder="e.g. Finalize terms for telehealth pilot across 3 flagship hospitals"
              {...register('nextStep')}
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text)',
                borderColor: 'var(--input-border)',
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)]"
            />
          </div>
        </div>

        {/* Section 6: Notes & Remarks */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <FileText className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              6. Advisory Notes & Remarks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-note" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Advisory Profile Note
              </label>
              <textarea
                id="contact-note"
                rows={3}
                placeholder="Key stakeholder personality, communication preferences, background..."
                {...register('note')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] resize-y"
              />
            </div>

            <div>
              <label htmlFor="contact-remark" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Internal Executive Remarks
              </label>
              <textarea
                id="contact-remark"
                rows={3}
                placeholder="Internal partner comments, confidential caveats, deal sensitivities..."
                {...register('remark')}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--input-border)',
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] resize-y"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Ownership & Assignment */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
          className="p-6 rounded-xl border shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--btn-primary)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              7. Ownership & Account Executive Assignment
            </h2>
          </div>

          <div>
            <label htmlFor="contact-ownerId" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Assigned Owner <span className="text-red-500">*</span>
            </label>

            {currentUser?.role === 'MEMBER' ? (
              <div
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  borderColor: 'var(--border)',
                }}
                className="w-full max-w-md px-3.5 py-2.5 text-sm rounded-lg border flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentUser.name} ({currentUser.code})
                  </span>
                </div>
                <span className="text-xs text-slate-500">Auto-assigned to self (Member role)</span>
              </div>
            ) : (
              <div className="max-w-md">
                <select
                  id="contact-ownerId"
                  {...register('ownerId')}
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text)',
                    borderColor: errors.ownerId ? 'red' : 'var(--input-border)',
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-[var(--btn-primary)] cursor-pointer"
                  disabled={isLoadingUsers}
                >
                  <option value="">-- Select Contact Owner --</option>
                  {availableOwnerOptions.map((usr) => (
                    <option key={usr.id} value={usr.id}>
                      {usr.name} ({usr.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {currentUser?.role === 'ADMIN'
                    ? 'Admins can assign contacts to themselves or their direct team members.'
                    : 'Super Admins can assign contacts to any active team member.'}
                </p>
              </div>
            )}
            {errors.ownerId && (
              <p className="text-xs text-red-500 mt-1">{errors.ownerId.message}</p>
            )}
          </div>
        </div>

        {/* Submit / Cancel Actions Toolbar */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleCancelClick}
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            style={{
              backgroundColor: 'var(--btn-primary)',
              color: 'var(--btn-primary-text)',
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg shadow hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Contact...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Create Contact'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this contact profile. Leaving now will discard all modified information."
        confirmLabel="Discard & Exit"
        isDestructive
        onConfirm={() => {
          setShowDiscardDialog(false);
          navigate(-1);
        }}
        onClose={() => setShowDiscardDialog(false)}
      />
    </>
  );
};
