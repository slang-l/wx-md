import { CheckCircle2, XCircle } from 'lucide-react';

export type ToastState = {
  message: string;
  tone: 'success' | 'error';
} | null;

interface ToastProps {
  toast: ToastState;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  const Icon = toast.tone === 'success' ? CheckCircle2 : XCircle;
  const toneClass = toast.tone === 'success' ? 'text-[var(--ui-status-success)]' : 'text-[var(--ui-status-danger)]';

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2" aria-live="polite" role="status">
      <div className="ui-toast flex min-w-56 max-w-[calc(100vw-32px)] items-center justify-center gap-2 rounded-[var(--ui-radius-surface)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2.5 text-sm font-medium text-[var(--ui-text)] shadow-[var(--ui-shadow-floating)]">
        <Icon size={16} className={`shrink-0 ${toneClass}`} aria-hidden="true" />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
