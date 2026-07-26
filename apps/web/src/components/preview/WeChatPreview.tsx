import {
  Check,
  CheckCircle2,
  Code2,
  Copy,
  FileCode2,
  Monitor,
  Palette,
  Send,
  Smartphone,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Toast, type ToastState } from '../common/Toast';
import { PublishModal } from '../publish/PublishModal';
import { renderMarkdown } from '../../renderers/markdown-renderer';
import { renderWechatHtml } from '../../renderers/wechat-renderer';
import {
  defaultWechatThemeId,
  getWechatTheme,
  isWechatThemeId,
  wechatThemes,
  type WechatThemeId,
} from '../../renderers/wechat-themes';
import type { AppDoc } from '../../types/document';
import { copyRichHtmlToClipboard, copyToClipboard } from '../../utils/clipboard';

const WECHAT_THEME_STORAGE_KEY = 'block-notes-wechat-theme-v4';
type PreviewMode = 'desktop' | 'mobile';

interface WeChatPreviewProps {
  doc: AppDoc;
}

export function WeChatPreview({ doc }: WeChatPreviewProps) {
  const [themeId, setThemeId] = useState<WechatThemeId>(() => {
    const storedThemeId = window.localStorage.getItem(WECHAT_THEME_STORAGE_KEY);
    return isWechatThemeId(storedThemeId) ? storedThemeId : defaultWechatThemeId;
  });
  const [toast, setToast] = useState<ToastState>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const theme = getWechatTheme(themeId);
  const html = useMemo(() => renderWechatHtml(doc, themeId), [doc, themeId]);
  const markdown = useMemo(() => renderMarkdown(doc), [doc]);

  useEffect(() => {
    window.localStorage.setItem(WECHAT_THEME_STORAGE_KEY, themeId);
  }, [themeId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
  }, []);

  const handleCopyText = useCallback(
    async (value: string, label: string) => {
      try {
        await copyToClipboard(value);
        notify(`${label}已复制`);
      } catch {
        notify(`${label}复制失败`, 'error');
      }
    },
    [notify],
  );

  const handleCopyToWechat = useCallback(async () => {
    try {
      await copyRichHtmlToClipboard(html);
      notify('已复制富文本，可直接粘贴到公众号');
    } catch {
      notify('富文本复制失败，请检查剪贴板权限', 'error');
    }
  }, [html, notify]);

  return (
    <>
      <Toast toast={toast} />
      <aside className="preview-pane flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--ui-app-bg)]">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--ui-line)] bg-[var(--ui-surface)] px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileCode2 size={18} className="shrink-0 text-[var(--ui-text-secondary)]" />
            <div className="min-w-0">
              <h2 className="m-0 truncate text-sm font-semibold text-[var(--ui-text)]">微信排版预览</h2>
              <div className="truncate text-xs text-[var(--ui-muted)]">内容实时同步</div>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center rounded-lg border border-[var(--ui-line)] bg-[var(--ui-subtle)] p-1"
            aria-label="预览设备"
          >
            <DeviceButton
              active={previewMode === 'desktop'}
              label="桌面预览"
              icon={<Monitor size={15} />}
              onClick={() => setPreviewMode('desktop')}
            />
            <DeviceButton
              active={previewMode === 'mobile'}
              label="手机预览"
              icon={<Smartphone size={15} />}
              onClick={() => setPreviewMode('mobile')}
            />
          </div>
        </header>

        <section className="preview-toolbar grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--ui-line)] bg-[var(--ui-surface)] px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--ui-text-secondary)]">
              <Palette size={14} />
              主题
            </div>
            <div className="preview-theme-list flex min-w-0 gap-1.5 overflow-x-auto">
              {wechatThemes.map((themeOption) => {
                const active = themeOption.id === themeId;

                return (
                  <button
                    key={themeOption.id}
                    className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
                      active
                        ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-soft)] font-medium text-[var(--ui-accent)]'
                        : 'border-[var(--ui-line)] bg-[var(--ui-surface)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-line-strong)] hover:bg-[var(--ui-subtle)]'
                    }`}
                    type="button"
                    title={themeOption.description}
                    aria-pressed={active}
                    onClick={() => setThemeId(themeOption.id)}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
                      style={{ backgroundColor: themeOption.swatch }}
                      aria-hidden="true"
                    />
                    {themeOption.label}
                    <span className="grid h-3 w-3 place-items-center">{active ? <Check size={11} /> : null}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="preview-actions flex max-w-full shrink-0 items-center justify-end gap-2">
            <ActionButton
              icon={<Copy size={15} />}
              label="复制到微信"
              primary
              onClick={handleCopyToWechat}
            />
            <ActionButton
              icon={<Code2 size={15} />}
              label="Markdown"
              onClick={() => handleCopyText(markdown, 'Markdown')}
            />
            <ActionButton
              icon={<Send size={15} />}
              label="发布预演"
              onClick={() => setPublishOpen(true)}
            />
          </div>
        </section>

        <div className="preview-stage min-h-0 flex-1 overflow-auto p-5">
          <div
            className={`preview-paper mx-auto overflow-hidden bg-[var(--ui-surface)] transition-[width] duration-200 ${
              previewMode === 'mobile' ? 'preview-paper-mobile' : 'preview-paper-desktop'
            }`}
          >
            <div className="preview-paper-bar flex h-10 items-center justify-between border-b border-[var(--ui-line)] bg-[var(--ui-subtle)] px-3 text-xs text-[var(--ui-muted)]">
              <span className="flex items-center gap-1.5 font-medium text-[var(--ui-text-secondary)]">
                <FileCode2 size={13} />
                文章预览
              </span>
              <span>{previewMode === 'mobile' ? '手机 · 375 px' : '桌面视图'}</span>
              <CheckCircle2 size={14} className="text-[var(--ui-success)]" />
            </div>
            <article
              className={`preview-paper-content ${previewMode === 'mobile' ? 'px-5 py-7' : 'px-9 py-9'}`}
              style={{ backgroundColor: theme.preview.background }}
            >
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </article>
          </div>
        </div>
      </aside>
      <PublishModal
        doc={doc}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onCopyLink={(url) => handleCopyText(url, '链接')}
      />
    </>
  );
}

function DeviceButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`grid h-7 w-8 place-items-center rounded-md transition-colors ${
        active
          ? 'bg-[var(--ui-surface)] text-[var(--ui-text)] shadow-[var(--ui-shadow-xs)]'
          : 'text-[var(--ui-muted)] hover:text-[var(--ui-text)]'
      }`}
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  primary = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
        primary
          ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-white hover:border-[var(--ui-accent-hover)] hover:bg-[var(--ui-accent-hover)]'
          : 'border-[var(--ui-line)] bg-[var(--ui-surface)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-line-strong)] hover:bg-[var(--ui-subtle)]'
      }`}
      type="button"
      title={label}
      onClick={onClick}
    >
      {icon}
      <span className="preview-action-label min-w-0 truncate">{label}</span>
    </button>
  );
}
