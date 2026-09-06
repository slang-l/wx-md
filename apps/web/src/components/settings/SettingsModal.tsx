import {
  Check,
  Database,
  Download,
  Info,
  LogOut,
  Monitor,
  RotateCcw,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  clearAppliedSettingsPreferences,
  downloadSettingsJson,
  useSettingsPreferences,
} from './preferences';
import type {
  SettingsAccent,
  SettingsModalProps,
  SettingsPreferences,
  SettingsScale,
} from './types';

type SectionId = 'account' | 'appearance' | 'data' | 'about';

const sections = [
  { id: 'account' as const, label: '账号', icon: UserRound },
  { id: 'appearance' as const, label: '外观', icon: Monitor },
  { id: 'data' as const, label: '数据与隐私', icon: ShieldCheck },
  { id: 'about' as const, label: '关于', icon: Info },
];

const accentOptions: Array<{ value: SettingsAccent; label: string; color: string }> = [
  { value: 'indigo', label: '靛蓝', color: '#4f67e8' },
  { value: 'purple', label: '紫色', color: '#7c5ce7' },
  { value: 'green', label: '绿色', color: '#2f8061' },
  { value: 'graphite', label: '石墨', color: '#4f5967' },
];

const scaleOptions: Array<{ value: SettingsScale; label: string; description: string }> = [
  { value: 'small', label: '紧凑', description: '适合同时查看更多内容' },
  { value: 'default', label: '默认', description: '平衡的信息密度' },
  { value: 'large', label: '宽松', description: '更大的文字与控件' },
];

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  // querySelector 会返回响应式布局中 display:none 的按钮，需要排除后再做焦点环。
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.getClientRects().length > 0,
  );
}

function formatBytes(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return '未知';
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let amount = value / 1024;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }
  return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${units[index]}`;
}

function roleLabel(role: string): string {
  if (role.toLowerCase() === 'admin') return '管理员';
  if (role.toLowerCase() === 'user') return '成员';
  return role;
}

function statusLabel(status: string): string {
  if (status.toLowerCase() === 'active') return '正常';
  if (status.toLowerCase() === 'disabled') return '已停用';
  return status;
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--ui-border)] py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 pr-4">
        <div className="text-sm font-medium text-[var(--ui-text)]">{title}</div>
        {description ? (
          <div className="mt-1 text-xs leading-5 text-[var(--ui-text-muted)]">{description}</div>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`ui-pressable relative h-6 w-10 rounded-full ${
        checked ? 'bg-[var(--ui-primary)]' : 'bg-[var(--ui-border-strong)]'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function SettingsModal({
  open,
  onOpenChange,
  user,
  onSignOut,
  appName = 'Block Notes',
  appVersion,
}: SettingsModalProps) {
  const [section, setSection] = useState<SectionId>('account');
  const [storage, setStorage] = useState<{ usage?: number; quota?: number; loading: boolean }>({
    loading: false,
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const closeRef = useRef(onOpenChange);
  const { preferences, setPreferences, reset } = useSettingsPreferences(user.id);

  closeRef.current = onOpenChange;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearAppliedSettingsPreferences();
    };
  }, [user.id]);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    const appRootHadInert = appRoot?.hasAttribute('inert') ?? false;
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden') ?? null;
    document.body.style.overflow = 'hidden';

    // 先把焦点移入 Portal，再隔离背景，避免 aria-hidden 包含当前焦点。
    const dialog = dialogRef.current;
    if (dialog) (getFocusableElements(dialog)[0] ?? dialog).focus();
    appRoot?.setAttribute('inert', '');
    appRoot?.setAttribute('aria-hidden', 'true');

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      // 基本焦点环：Tab 不会越过弹窗进入被遮罩的应用区域。
      const items = getFocusableElements(dialogRef.current);
      if (items.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // 使用捕获阶段，确保弹窗内部为了隔离编辑器快捷键而 stopPropagation 时 Escape 仍有效。
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (appRoot) {
        if (!appRootHadInert) appRoot.removeAttribute('inert');
        if (previousAriaHidden === null) appRoot.removeAttribute('aria-hidden');
        else appRoot.setAttribute('aria-hidden', previousAriaHidden);
      }
      previouslyFocused?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || section !== 'data') return;
    let cancelled = false;
    setStorage((current) => ({ ...current, loading: true }));

    if (!navigator.storage?.estimate) {
      setStorage({ loading: false });
      return;
    }

    void navigator.storage.estimate().then(
      (estimate) => {
        if (!cancelled) setStorage({ usage: estimate.usage, quota: estimate.quota, loading: false });
      },
      () => {
        if (!cancelled) setStorage({ loading: false });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [open, section]);

  useEffect(() => {
    if (!open) {
      setConfirmReset(false);
      setMessage(null);
    }
  }, [open]);

  const updateAppearance = (patch: Partial<SettingsPreferences['appearance']>) => {
    setPreferences((current) => ({
      ...current,
      appearance: { ...current.appearance, ...patch },
    }));
  };

  const handleSignOut = async () => {
    if (!onSignOut || signOutPending) return;
    setSignOutPending(true);
    setMessage(null);
    try {
      await onSignOut();
      if (mountedRef.current) onOpenChange(false);
    } catch {
      if (mountedRef.current) setMessage('退出失败，请稍后重试。');
    } finally {
      if (mountedRef.current) setSignOutPending(false);
    }
  };

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // 避免弹窗中的按键继续触发编辑器快捷键。
    event.stopPropagation();
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="ui-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-[var(--ui-overlay)] p-0 backdrop-blur-[2px] md:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="ui-modal-surface flex h-[100dvh] w-full max-w-[940px] flex-col overflow-hidden border-0 bg-[var(--ui-surface)] shadow-[var(--ui-shadow-overlay)] md:h-[min(82vh,680px)] md:flex-row md:rounded-[var(--ui-radius-overlay)] md:border md:border-[var(--ui-border)]"
      >
        <aside className="shrink-0 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 pb-2 pt-4 md:w-[220px] md:border-b-0 md:border-r md:px-3 md:py-5">
          <div className="mb-3 flex items-center justify-between px-2">
            <h2 id="settings-title" className="text-base font-semibold tracking-tight text-[var(--ui-text)]">
              设置
            </h2>
            <button
              type="button"
              className="ui-pressable ui-icon-button h-8 w-8 text-[var(--ui-text-muted)] hover:bg-[var(--ui-border)] hover:text-[var(--ui-text)] md:hidden"
              onClick={() => onOpenChange(false)}
              aria-label="关闭设置"
            >
              <X size={17} />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 md:block md:space-y-0.5 md:overflow-visible" aria-label="设置分类">
            {sections.map((item) => {
              const Icon = item.icon;
              const selected = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  className={`ui-pressable flex h-9 shrink-0 items-center gap-2 rounded-[var(--ui-radius-control)] px-3 text-sm md:w-full ${
                    selected
                      ? 'bg-[var(--ui-surface)] font-medium text-[var(--ui-text)] shadow-[var(--ui-shadow-xs)]'
                      : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)]'
                  }`}
                  onClick={() => {
                    setSection(item.id);
                    setMessage(null);
                    setConfirmReset(false);
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto hidden px-3 pt-6 text-[11px] leading-5 text-[var(--ui-text-muted)] md:block">
            偏好保存在此浏览器中
          </div>
        </aside>

        <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
          <button
            type="button"
            className="ui-pressable ui-icon-button absolute right-5 top-5 z-10 hidden h-8 w-8 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)] md:grid"
            onClick={() => onOpenChange(false)}
            aria-label="关闭设置"
          >
            <X size={18} />
          </button>

          <div className="mx-auto w-full max-w-[660px] px-5 pb-12 pt-7 sm:px-10 sm:pt-10">
            {section === 'account' ? (
              <section aria-labelledby="account-heading">
                <h3 id="account-heading" className="text-xl font-semibold tracking-tight text-[var(--ui-text)]">账号</h3>
                <p className="mt-1 text-sm text-[var(--ui-text-muted)]">查看当前登录账号的信息。</p>

                <div className="mt-7 flex items-center gap-4 rounded-[var(--ui-radius-surface)] border border-[var(--ui-border)] p-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--ui-primary-soft)] text-base font-semibold text-[var(--ui-primary)]">
                    {(user.name || user.email).trim().slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--ui-text)]">{user.name || '未设置名称'}</div>
                    <div className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">{user.email}</div>
                  </div>
                </div>

                <dl className="mt-5 divide-y divide-[var(--ui-border)]">
                  {[
                    ['名称', user.name || '—'],
                    ['邮箱', user.email],
                    ['角色', roleLabel(user.role)],
                    ['账号状态', statusLabel(user.status)],
                  ].map(([term, value]) => (
                    <div key={term} className="grid grid-cols-[100px_1fr] gap-4 py-3.5 text-sm">
                      <dt className="text-[var(--ui-text-muted)]">{term}</dt>
                      <dd className="min-w-0 break-words text-[var(--ui-text)]">{value}</dd>
                    </div>
                  ))}
                </dl>

                {onSignOut ? (
                  <div className="mt-8 border-t border-[var(--ui-border)] pt-5">
                    <button
                      type="button"
                      disabled={signOutPending}
                      onClick={() => void handleSignOut()}
                      className="ui-pressable inline-flex h-9 items-center gap-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] px-3 text-sm font-medium text-[var(--ui-status-danger)] hover:border-[var(--ui-status-danger)] hover:bg-[var(--ui-status-danger-soft)] disabled:cursor-wait disabled:opacity-60"
                    >
                      <LogOut size={16} />
                      {signOutPending ? '正在退出…' : '退出登录'}
                    </button>
                    {message ? <p role="alert" className="mt-2 text-xs text-[var(--ui-status-danger)]">{message}</p> : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {section === 'appearance' ? (
              <section aria-labelledby="appearance-heading">
                <h3 id="appearance-heading" className="text-xl font-semibold tracking-tight text-[var(--ui-text)]">外观</h3>
                <p className="mt-1 text-sm text-[var(--ui-text-muted)]">调整这个浏览器上的界面体验。</p>

                <div className="mt-7">
                  <div className="text-sm font-medium text-[var(--ui-text)]">强调色</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {accentOptions.map((option) => {
                      const selected = preferences.appearance.accent === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          aria-pressed={selected}
                          onClick={() => updateAppearance({ accent: option.value })}
                          className={`ui-pressable flex h-11 items-center gap-2.5 rounded-[var(--ui-radius-control)] border px-3 text-sm ${
                            selected
                              ? 'border-[var(--ui-primary)] bg-[var(--ui-primary-soft)] text-[var(--ui-text)]'
                              : 'border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)]'
                          }`}
                        >
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: option.color }} />
                          <span>{option.label}</span>
                          {selected ? <Check className="ml-auto text-[var(--ui-primary)]" size={14} /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-sm font-medium text-[var(--ui-text)]">界面缩放</div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {scaleOptions.map((option) => {
                      const selected = preferences.appearance.scale === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          aria-pressed={selected}
                          onClick={() => updateAppearance({ scale: option.value })}
                          className={`ui-pressable rounded-[var(--ui-radius-surface)] border p-3 text-left ${
                            selected
                              ? 'border-[var(--ui-primary)] bg-[var(--ui-primary-soft)]'
                              : 'border-[var(--ui-border)] hover:bg-[var(--ui-surface-subtle)]'
                          }`}
                        >
                          <span className="block text-sm font-medium text-[var(--ui-text)]">{option.label}</span>
                          <span className="mt-1 block text-[11px] leading-4 text-[var(--ui-text-muted)]">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <SettingRow title="减少动效" description="缩短界面动画与过渡，减少视觉移动。">
                    <Toggle
                      label="减少动效"
                      checked={preferences.appearance.reduceMotion}
                      onChange={(reduceMotion) => updateAppearance({ reduceMotion })}
                    />
                  </SettingRow>
                </div>
              </section>
            ) : null}

            {section === 'data' ? (
              <section aria-labelledby="data-heading">
                <h3 id="data-heading" className="text-xl font-semibold tracking-tight text-[var(--ui-text)]">数据与隐私</h3>
                <p className="mt-1 text-sm text-[var(--ui-text-muted)]">管理设置模块保存在本机浏览器中的数据。</p>

                <div className="mt-7 rounded-[var(--ui-radius-surface)] border border-[var(--ui-border)] p-4">
                  <div className="flex items-start gap-3">
                    <Database className="mt-0.5 shrink-0 text-[var(--ui-primary)]" size={18} />
                    <div>
                      <div className="text-sm font-medium text-[var(--ui-text)]">本站存储空间</div>
                      <p className="mt-1 text-xs leading-5 text-[var(--ui-text-muted)]">
                        {storage.loading
                          ? '正在估算…'
                          : storage.usage === undefined
                            ? '当前浏览器不支持存储空间估算。'
                            : `已使用 ${formatBytes(storage.usage)}，浏览器配额 ${formatBytes(storage.quota)}。`}
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-[var(--ui-text-muted)]">该数值涵盖本站在此浏览器中的全部本地数据，不代表云端用量。</p>
                    </div>
                  </div>
                </div>

                <SettingRow title="导出时包含账号信息" description="默认导出只包含设置；开启后会附带当前账号的 ID、名称和邮箱。">
                  <Toggle
                    label="导出时包含账号信息"
                    checked={preferences.privacy.includeAccountInExport}
                    onChange={(includeAccountInExport) =>
                      setPreferences((current) => ({
                        ...current,
                        privacy: { ...current.privacy, includeAccountInExport },
                      }))
                    }
                  />
                </SettingRow>

                <SettingRow title="导出设置" description="下载一个可读的 JSON 文件，不会上传任何内容。">
                  <button
                    type="button"
                    onClick={() => downloadSettingsJson(user, preferences)}
                    className="ui-pressable inline-flex h-9 items-center gap-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] px-3 text-sm font-medium text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)]"
                  >
                    <Download size={15} /> 导出 JSON
                  </button>
                </SettingRow>

                <SettingRow title="重置本地设置" description="恢复默认强调色、缩放、动效和导出隐私偏好，不会删除文档或账号。">
                  {confirmReset ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="ui-pressable h-9 rounded-[var(--ui-radius-control)] px-3 text-sm text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)]"
                        onClick={() => setConfirmReset(false)}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        className="ui-pressable h-9 rounded-[var(--ui-radius-control)] bg-[var(--ui-status-danger)] px-3 text-sm font-medium text-white"
                        onClick={() => {
                          reset();
                          setConfirmReset(false);
                          setMessage('设置已恢复为默认值。');
                        }}
                      >
                        确认重置
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="ui-pressable inline-flex h-9 items-center gap-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] px-3 text-sm font-medium text-[var(--ui-status-danger)] hover:border-[var(--ui-status-danger)] hover:bg-[var(--ui-status-danger-soft)]"
                    >
                      <RotateCcw size={15} /> 重置
                    </button>
                  )}
                </SettingRow>
                {message ? <p role="status" className="mt-3 text-xs text-[var(--ui-status-success)]">{message}</p> : null}
              </section>
            ) : null}

            {section === 'about' ? (
              <section aria-labelledby="about-heading">
                <h3 id="about-heading" className="text-xl font-semibold tracking-tight text-[var(--ui-text)]">关于</h3>
                <div className="mt-8 flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--ui-primary)] text-xl font-bold text-white shadow-[var(--ui-shadow-card)]">M</div>
                  <div>
                    <div className="text-base font-semibold text-[var(--ui-text)]">{appName}</div>
                    {appVersion ? <div className="mt-1 text-xs text-[var(--ui-text-muted)]">版本 {appVersion}</div> : null}
                  </div>
                </div>
                <p className="mt-7 max-w-lg text-sm leading-7 text-[var(--ui-text-secondary)]">
                  一个专注 Markdown 编辑与微信内容预览的工作空间。设置模块独立运行，只通过公开属性接收账号信息与退出动作。
                </p>
                <div className="mt-7 rounded-[var(--ui-radius-surface)] bg-[var(--ui-surface-subtle)] p-4 text-xs leading-6 text-[var(--ui-text-muted)]">
                  外观与隐私偏好按账号 ID 保存在当前浏览器，不会自动同步到其他设备。本页不提供修改邮箱、密码或云端数据管理等尚未接入的服务端能力。
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
