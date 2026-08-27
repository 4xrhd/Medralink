import React, { useState } from 'react';
import { AlertCircle, HelpCircle, ArrowRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { formatErrorMessage } from '../utils/errorFormatter';

export default function ErrorBanner({ error, onDismiss, className = '' }) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!error) return null;

  const formatted = formatErrorMessage(error);

  return (
    <div className={`p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs shadow-lg animate-in fade-in space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-100 text-sm">{formatted.title}</h4>
            <p className="text-rose-200/90 mt-1 leading-relaxed">{formatted.message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-rose-400 hover:text-rose-200 p-1 rounded-md transition-colors"
            title="Dismiss error message"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {formatted.context && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-xs text-rose-300/90 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-200">Why this happened: </span>
            {formatted.context}
          </div>
        </div>
      )}

      {formatted.action && (
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-teal-300">Recommended Action: </span>
            {formatted.action}
          </div>
        </div>
      )}

      {formatted.raw && (
        <div className="pt-1">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-2xs text-rose-400/80 hover:text-rose-300 flex items-center gap-1 font-mono transition-colors"
          >
            {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showTechnicalDetails ? 'Hide technical ledger details' : 'Show technical ledger details'}
          </button>

          {showTechnicalDetails && (
            <div className="mt-2 p-2 rounded bg-slate-950/80 border border-slate-800 font-mono text-2xs text-rose-300/70 break-all">
              {formatted.raw}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
