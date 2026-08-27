import React from 'react';

/**
 * MedraLink UI Design System Tokens & Atomic Components
 */

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg';
  
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm shadow-teal-900/30 focus:ring-teal-500 border border-teal-500/40',
    secondary: 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 focus:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/30 focus:ring-rose-500 border border-rose-500/40',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 focus:ring-slate-500',
    outline: 'bg-transparent border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-800/30 focus:ring-teal-500',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export const Input = ({
  label,
  helperText,
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}
      <div className="relative rounded-lg">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-950/80 border ${
            error ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30' : 'border-slate-750 focus:border-teal-500 focus:ring-teal-500/40'
          } rounded-lg ${Icon ? 'pl-9' : 'px-3.5'} pr-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-2xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-2xs text-slate-400">{helperText}</p>}
    </div>
  );
};

export const Select = ({
  label,
  helperText,
  error,
  children,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-slate-950/80 border ${
          error ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30' : 'border-slate-750 focus:border-teal-500 focus:ring-teal-500/40'
        } rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-2xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-2xs text-slate-400">{helperText}</p>}
    </div>
  );
};

export const Card = ({
  children,
  className = '',
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`${glow ? 'glass-panel-glow' : 'glass-panel'} p-5 sm:p-6 border-slate-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const Badge = ({
  children,
  variant = 'neutral', // 'granted' | 'revoked' | 'pending' | 'emergency' | 'neutral' | 'teal'
  size = 'md', // 'sm' | 'md'
  icon: Icon,
  className = '',
}) => {
  const variantClasses = {
    granted: 'badge-status badge-granted',
    revoked: 'badge-status badge-revoked',
    pending: 'badge-status badge-pending',
    emergency: 'badge-status badge-emergency',
    neutral: 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-2xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700',
    teal: 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-2xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20',
  };

  const sizeClasses = {
    sm: 'text-2xs py-0.5 px-1.5',
    md: 'text-2xs py-1 px-2.5',
  };

  return (
    <span className={`${variantClasses[variant] || variantClasses.neutral} ${sizeClasses[size]} ${className}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
};

export const CopyButton = ({ text, id, label, className = '' }) => {
  return (
    <button
      type="button"
      onClick={() => {
        if (text && navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(text);
        }
      }}
      title="Copy to clipboard"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 text-2xs font-mono transition-all ${className}`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      {label && <span>{label}</span>}
    </button>
  );
};

export const CryptoProofBox = ({ title, hash, details, className = '', actionLabel = 'Copy' }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (hash && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-slate-400 text-2xs">
        <span className="font-semibold text-teal-400 uppercase tracking-wider">{title}</span>
        {hash && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>{copied ? 'Copied Hash' : actionLabel}</span>
          </button>
        )}
      </div>
      <p className="text-teal-300 break-all select-all font-mono leading-relaxed bg-slate-900/90 p-2.5 rounded border border-teal-900/30">
        {hash || 'Computing cryptographic proof...'}
      </p>
      {details && <div className="text-slate-400 text-2xs pt-1 border-t border-slate-800/80">{details}</div>}
    </div>
  );
};

