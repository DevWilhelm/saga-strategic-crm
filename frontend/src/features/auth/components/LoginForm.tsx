import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getApiErrorInfo } from '../../../api/errors';

interface LoginFormProps {
  onSuccess: () => void;
}

interface FieldErrors {
  identifier?: string;
  password?: string;
}

// The backend accepts a username or an email address (LoginRequest.identifier).
const validate = (identifier: string, password: string): FieldErrors => {
  const errors: FieldErrors = {};
  if (!identifier) {
    errors.identifier = 'Enter your email or username.';
  }
  if (!password) {
    errors.password = 'Enter your password.';
  }
  return errors;
};

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] shadow-xs transition placeholder:text-[var(--text-secondary)] placeholder:opacity-60 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-[var(--status-overdue-text)] focus:ring-[var(--status-overdue-bg)]'
      : 'border-[var(--border)] focus:border-[var(--btn-primary)] focus:ring-[var(--tag-bg)]'
  }`;

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // After the first submit, re-check fields as the user types.
  const revalidate = (nextIdentifier: string, nextPassword: string) => {
    if (submitted) setFieldErrors(validate(nextIdentifier.trim(), nextPassword));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);

    const trimmedIdentifier = identifier.trim();
    const errors = validate(trimmedIdentifier, password);
    setFieldErrors(errors);
    if (errors.identifier || errors.password) return;

    setSubmitting(true);
    try {
      await login(trimmedIdentifier, password);
      onSuccess();
    } catch (error) {
      const apiError = getApiErrorInfo(error);
      const serverFieldErrors: FieldErrors = {};
      apiError.fieldErrors.forEach((detail) => {
        if (detail.field === 'identifier' || detail.field === 'password') {
          serverFieldErrors[detail.field] = detail.message;
        }
      });
      setFieldErrors(serverFieldErrors);
      setFormError(apiError.message);
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  const trackCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(event.getModifierState('CapsLock'));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-[var(--status-overdue-bg)] bg-[var(--status-overdue-bg)] px-3.5 py-3 text-sm text-[var(--status-overdue-text)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="login-identifier" className="block text-sm font-semibold text-[var(--text)]">
          Email or username
        </label>
        <input
          id="login-identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          placeholder="name@sagasia.com"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            revalidate(e.target.value, password);
          }}
          aria-invalid={!!fieldErrors.identifier}
          aria-describedby={fieldErrors.identifier ? 'login-identifier-error' : undefined}
          className={inputClass(!!fieldErrors.identifier)}
        />
        {fieldErrors.identifier && (
          <p id="login-identifier-error" className="text-xs font-medium text-[var(--status-overdue-text)]">
            {fieldErrors.identifier}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="block text-sm font-semibold text-[var(--text)]">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              revalidate(identifier, e.target.value);
            }}
            onKeyDown={trackCapsLock}
            onKeyUp={trackCapsLock}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              [fieldErrors.password && 'login-password-error', capsLockOn && 'login-capslock']
                .filter(Boolean)
                .join(' ') || undefined
            }
            className={`${inputClass(!!fieldErrors.password)} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[var(--text-secondary)] transition hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--btn-primary)] cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p id="login-password-error" className="text-xs font-medium text-[var(--status-overdue-text)]">
            {fieldErrors.password}
          </p>
        )}
        {capsLockOn && (
          <p id="login-capslock" className="text-xs font-medium text-[var(--status-warning-text)]">
            Caps Lock is on.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--btn-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--btn-primary-text)] shadow transition hover:bg-[var(--btn-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--btn-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign in
          </>
        )}
      </button>
    </form>
  );
};
