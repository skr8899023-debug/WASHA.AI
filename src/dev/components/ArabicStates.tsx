import type { ReactNode } from "react";
import type { GenerationErrorInfo } from "../../lib/types";

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="state-icon" aria-hidden>
      {children}
    </span>
  );
}

const SparkIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" strokeLinecap="round" />
  </svg>
);

const AlertIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
    <path d="M10.3 4.2 3.5 16.8A2 2 0 0 0 5.2 20h13.6a2 2 0 0 0 1.7-3.2L13.7 4.2a2 2 0 0 0-3.4 0Z" strokeLinejoin="round" />
  </svg>
);

export function ArabicEmptyState({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions?: ReactNode;
}) {
  return (
    <div className="state-block">
      <Icon>{SparkIcon}</Icon>
      <h3>{title}</h3>
      <p>{body}</p>
      {actions && <div className="state-actions">{actions}</div>}
    </div>
  );
}

export function ArabicErrorState({
  error,
  onRetry,
}: {
  error: GenerationErrorInfo;
  onRetry: () => void;
}) {
  return (
    <div className="state-block error" role="alert">
      <Icon>{AlertIcon}</Icon>
      <h3>{error.message}</h3>
      <p>{error.action}</p>
      <div className="state-actions">
        <button className="btn btn-primary" onClick={onRetry}>
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}

export function ArabicLoadingState({ label }: { label: string }) {
  return (
    <div className="state-block" aria-live="polite">
      <span className="spin" aria-hidden />
      <h3>{label}</h3>
      <div className="loading-shape" style={{ width: "100%", maxWidth: 280, height: 180 }} />
      <p>نجهّز التصميم على القطعة المختارة…</p>
    </div>
  );
}
