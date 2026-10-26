"use client";

import { useState } from "react";
import { AlertCircle, X, ChevronDown, Copy, Check } from "lucide-react";
import { formatClientError, type FormattedError } from "@/lib/errors";

interface ErrorAlertProps {
  error: FormattedError | string | null | undefined;
  errorId?: string | null;
  details?: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  error,
  errorId,
  details,
  onDismiss,
  className = "",
}: ErrorAlertProps) {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const formatted: FormattedError =
    typeof error === "string"
      ? formatClientError(error)
      : error;

  const resolvedErrorId = errorId || formatted.errorId;
  const resolvedDetails = details || formatted.technicalDetails;
  const isDev = process.env.NODE_ENV === "development";

  const handleCopyErrorId = () => {
    if (resolvedErrorId) {
      navigator.clipboard.writeText(resolvedErrorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="alert"
      className={`relative w-full rounded-2xl border border-destructive/30 bg-destructive/10 p-4 shadow-lg shadow-destructive/5 backdrop-blur-md transition-all duration-300 animate-slide-in overflow-hidden ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className="mt-0.5 flex-shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-destructive/20 text-destructive shadow-inner">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-destructive leading-tight tracking-tight">
              {formatted.title}
            </h4>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg hover:bg-white/5"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="text-xs text-foreground/80 leading-relaxed break-words">
            {formatted.message}
          </p>

          {formatted.suggestion && (
            <p className="text-xs text-muted-foreground pt-0.5 italic">
              💡 {formatted.suggestion}
            </p>
          )}

          {/* Dev/Diagnostics Expandable Panel (only for system errors with details or errorId) */}
          {Boolean(resolvedDetails || resolvedErrorId) && (
            <details className="mt-2 text-xs group">
              <summary className="cursor-pointer select-none text-[11px] font-medium text-destructive/80 hover:text-destructive flex items-center gap-1">
                <span>Diagnostic Info</span>
                <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-1.5 rounded-lg bg-black/40 p-2.5 font-mono text-[10px] text-muted-foreground border border-white/5 space-y-1 overflow-x-auto max-h-32">
                <div className="flex items-center justify-between gap-2 text-foreground/70">
                  <span>Code: {formatted.code}</span>
                  {resolvedErrorId && (
                    <button
                      type="button"
                      onClick={handleCopyErrorId}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-green-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                {resolvedErrorId && (
                  <div className="text-[10px] text-muted-foreground/80">
                    ID: {resolvedErrorId}
                  </div>
                )}
                {resolvedDetails && (
                  <div className="break-all whitespace-pre-wrap text-destructive/90 pt-1 border-t border-white/5">
                    {resolvedDetails}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
