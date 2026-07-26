import { CheckCircle2, Copy, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AppDoc } from '../../types/document';
import { formatDateTime } from '../../utils/date';

export interface PublishResult {
  title: string;
  url: string;
  publishedAt: string;
}

interface PublishModalProps {
  doc: AppDoc;
  open: boolean;
  onClose: () => void;
  onCopyLink: (url: string) => void;
}

export function PublishModal({ doc, open, onClose, onCopyLink }: PublishModalProps) {
  const [result, setResult] = useState<PublishResult | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(
      () =>
        setResult({
          title: doc.title,
          url: `https://mp.weixin.qq.com/s/mock-${doc.id.slice(0, 8)}-${Date.now().toString(36)}`,
          publishedAt: new Date().toISOString(),
        }),
      450,
    );
    return () => {
      window.clearTimeout(timer);
      setResult(null);
    };
  }, [doc.id, doc.title, open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[var(--ui-overlay)] px-4" role="dialog" aria-modal="true">
      <section className="w-full max-w-[460px] rounded-[var(--ui-radius-overlay)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-overlay)]">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ui-text)]">公众号发布预演</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--ui-text-muted)]">生成本地演示结果，不会提交到真实公众号</p>
          </div>
          <button
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--ui-radius-control)] text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)]"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </header>

        {result ? (
          <div>
            <div className="mb-5 flex items-center gap-2.5 rounded-[var(--ui-radius-surface)] bg-[var(--ui-status-success-soft)] px-3 py-2.5 text-sm font-medium text-[var(--ui-status-success)]">
              <CheckCircle2 size={18} />
              发布预演已生成
            </div>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="mb-1 text-xs text-[var(--ui-text-muted)]">文章标题</dt>
                <dd className="font-medium text-[var(--ui-text)]">{result.title}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-[var(--ui-text-muted)]">生成时间</dt>
                <dd className="text-[var(--ui-text-secondary)]">{formatDateTime(result.publishedAt)}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-[var(--ui-text-muted)]">演示链接</dt>
                <dd className="flex items-center gap-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2 text-[var(--ui-text-secondary)]">
                  <ExternalLink size={15} className="shrink-0 text-[var(--ui-text-muted)]" />
                  <span className="min-w-0 flex-1 truncate">{result.url}</span>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                className="h-10 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 text-sm font-medium text-[var(--ui-text-secondary)] transition-colors hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-subtle)]"
                onClick={onClose}
              >
                关闭
              </button>
              <button
                className="flex h-10 items-center gap-2 rounded-[var(--ui-radius-control)] bg-[var(--ui-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--ui-primary-hover)]"
                onClick={() => onCopyLink(result.url)}
              >
                <Copy size={16} />
                复制链接
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-[var(--ui-text-muted)]">正在生成预演结果...</div>
        )}
      </section>
    </div>
  );
}
