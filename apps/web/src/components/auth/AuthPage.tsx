import { useId, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  LayoutTemplate,
  LockKeyhole,
  Mail,
  PenLine,
  Smartphone,
} from 'lucide-react';
import {
  AuthApiError,
  login,
  register,
  type AuthUser,
} from '../../services/auth-api';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  onAuthenticated: (user: AuthUser) => void | Promise<void>;
}

interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: AuthFormState = {
  email: '',
  password: '',
  confirmPassword: '',
};

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_BYTES = 72;

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<AuthFormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === 'login';

  const switchMode = (nextMode: AuthMode) => {
    if (isSubmitting) return;
    setMode(nextMode);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setError('');
  };

  const updateField = (field: keyof AuthFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      setError(`邮箱地址不能超过 ${MAX_EMAIL_LENGTH} 个字符`);
      return;
    }

    if (!form.password) {
      setError('请输入密码');
      return;
    }

    // 只有注册创建新密码时要求至少 8 位；登录必须兼容服务端已有账号，
    // 包括本地开发环境提供的 6 位管理员密码。
    if (!isLogin && form.password.length < 8) {
      setError('密码至少需要 8 个字符');
      return;
    }

    // bcrypt 只读取前 72 个 UTF-8 字节；前后端同时拒绝超长输入，避免两段
    // 看起来不同的密码在截断后得到相同的校验结果。
    if (new TextEncoder().encode(form.password).byteLength > MAX_PASSWORD_BYTES) {
      setError(`密码不能超过 ${MAX_PASSWORD_BYTES} 个 UTF-8 字节`);
      return;
    }

    if (!isLogin && form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const authenticate = isLogin ? login : register;
      const user = await authenticate({ email, password: form.password });
      await onAuthenticated(user);
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError, isLogin));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page relative min-h-[100dvh] overflow-x-hidden bg-[var(--ui-background)] text-[var(--ui-text)]">
      <div className="auth-page-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-[var(--ui-primary-soft)] blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1240px] flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between">
          <a className="flex items-center gap-2.5 text-[var(--ui-text)] no-underline" href="/" aria-label="Block Notes 首页">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--ui-primary)] text-white shadow-[0_6px_16px_rgba(79,103,232,0.22)]">
              <PenLine size={18} strokeWidth={1.9} />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.015em]">Block Notes</span>
          </a>
          <span className="hidden text-xs text-[var(--ui-text-muted)] sm:block">为公众号创作者而生</span>
        </header>

        <div className="grid flex-1 grid-cols-[minmax(0,1fr)] items-center gap-12 py-10 lg:grid-cols-[minmax(0,1.08fr)_440px] lg:gap-16 lg:py-12">
          <ProductStory />

          <section
            className="mx-auto w-full min-w-0 max-w-[440px] rounded-2xl border border-[var(--ui-border)] bg-[rgba(255,255,255,0.94)] p-6 shadow-[0_18px_60px_rgba(31,40,55,0.09)] backdrop-blur sm:p-8"
            aria-labelledby="auth-title"
          >
            <div className="mb-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-primary)]">
                {isLogin ? 'Welcome back' : 'Join Block Notes'}
              </p>
              <h1 id="auth-title" className="m-0 text-[28px] font-semibold tracking-[-0.035em] text-[var(--ui-text)]">
                {isLogin ? '欢迎回来' : '创建你的账号'}
              </h1>
              <p className="mb-0 mt-2 text-sm leading-6 text-[var(--ui-text-secondary)]">
                {isLogin ? '登录后继续创作你的公众号内容。' : '使用邮箱注册，开始整理灵感与文章。'}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-lg bg-[var(--ui-surface-subtle)] p-1" aria-label="登录或注册">
              <ModeButton active={isLogin} disabled={isSubmitting} label="登录" onClick={() => switchMode('login')} />
              <ModeButton active={!isLogin} disabled={isSubmitting} label="注册" onClick={() => switchMode('register')} />
            </div>

            <form noValidate aria-busy={isSubmitting} onSubmit={handleSubmit}>
              <fieldset className="m-0 space-y-4 border-0 p-0" disabled={isSubmitting}>
                <FormField
                  autoComplete="email"
                  icon={<Mail size={16} />}
                  id={emailId}
                  label="邮箱"
                  maxLength={MAX_EMAIL_LENGTH}
                  onChange={(value) => updateField('email', value)}
                  placeholder="name@example.com"
                  type="email"
                  value={form.email}
                />

                <PasswordField
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  id={passwordId}
                  label="密码"
                  onChange={(value) => updateField('password', value)}
                  placeholder={isLogin ? '输入你的密码' : '至少 8 个字符'}
                  showPassword={showPassword}
                  value={form.password}
                  onToggleVisibility={() => setShowPassword((visible) => !visible)}
                />

                {!isLogin ? (
                  <PasswordField
                    autoComplete="new-password"
                    id={confirmPasswordId}
                    label="确认密码"
                    onChange={(value) => updateField('confirmPassword', value)}
                    placeholder="再次输入密码"
                    showPassword={showPassword}
                    value={form.confirmPassword}
                    onToggleVisibility={() => setShowPassword((visible) => !visible)}
                  />
                ) : null}
              </fieldset>

              <div className="mt-3 min-h-5" role="status" aria-live="polite">
                {error ? <p className="m-0 text-xs text-[var(--ui-status-danger)]">{error}</p> : null}
              </div>

              <button
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ui-primary)] px-4 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(79,103,232,0.2)] transition-all hover:-translate-y-px hover:bg-[var(--ui-primary-hover)] hover:shadow-[0_7px_18px_rgba(79,103,232,0.24)] active:translate-y-0 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                type="submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? (isLogin ? '正在登录…' : '正在注册…') : (isLogin ? '登录并进入工作台' : '创建账号')}</span>
                <ArrowRight size={16} strokeWidth={1.9} />
              </button>
            </form>

            <p className="mb-0 mt-6 text-center text-xs leading-5 text-[var(--ui-text-muted)]">
              {isLogin ? '还没有账号？' : '已有账号？'}
              <button
                className="ml-1 border-0 bg-transparent p-0 font-medium text-[var(--ui-primary)] hover:text-[var(--ui-primary-hover)] hover:underline"
                type="button"
                disabled={isSubmitting}
                onClick={() => switchMode(isLogin ? 'register' : 'login')}
              >
                {isLogin ? '免费注册' : '立即登录'}
              </button>
            </p>
          </section>
        </div>

        <footer className="flex items-center justify-center gap-2 text-[11px] text-[var(--ui-text-muted)] lg:justify-start">
          <LockKeyhole size={12} />
          <span>你的创作内容仅对自己可见</span>
        </footer>
      </div>
    </main>
  );
}

function ProductStory() {
  return (
    <section className="hidden min-w-0 lg:block" aria-label="Block Notes 产品介绍">
      <div className="max-w-[590px]">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--ui-text-secondary)] shadow-[var(--ui-shadow-xs)]">
          <Check size={13} className="text-[var(--ui-status-success)]" />
          从灵感到发布，只在一个工作台
        </p>
        <h2 className="m-0 max-w-[570px] text-[42px] font-semibold leading-[1.16] tracking-[-0.045em] text-[var(--ui-text)]">
          写得专注，
          <br />
          预览得刚刚好。
        </h2>
        <p className="mb-8 mt-5 max-w-[500px] text-[15px] leading-7 text-[var(--ui-text-secondary)]">
          在熟悉的编辑体验里整理文章，同时查看公众号最终效果，让每一次发布更从容。
        </p>
      </div>

      <div className="relative max-w-[620px] pr-8">
        <div className="overflow-hidden rounded-xl border border-[var(--ui-border)] bg-white shadow-[0_20px_55px_rgba(31,40,55,0.11)]">
          <div className="flex h-10 items-center justify-between border-b border-[var(--ui-border)] px-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#d8dde6]" />
              <span className="h-2 w-2 rounded-full bg-[#d8dde6]" />
              <span className="h-2 w-2 rounded-full bg-[#d8dde6]" />
            </div>
            <span className="text-[10px] font-medium text-[var(--ui-text-muted)]">Block Notes 工作台</span>
          </div>

          <div className="grid h-[270px] grid-cols-[104px_1fr_164px]">
            <div className="border-r border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3">
              <div className="mb-4 flex items-center gap-1.5 text-[9px] font-semibold text-[var(--ui-text-secondary)]">
                <FileText size={11} />
                我的文档
              </div>
              <div className="space-y-2">
                <div className="rounded-md bg-white p-2 shadow-[var(--ui-shadow-xs)]">
                  <div className="h-1.5 w-12 rounded-full bg-[var(--ui-primary)]/65" />
                  <div className="mt-1.5 h-1 w-9 rounded-full bg-[var(--ui-border-strong)]" />
                </div>
                <MockDocumentItem width="w-14" />
                <MockDocumentItem width="w-10" />
              </div>
            </div>

            <div className="border-r border-[var(--ui-border)] p-5">
              <div className="mb-5 flex items-center gap-1.5 text-[9px] text-[var(--ui-text-muted)]">
                <PenLine size={11} />
                正在编辑
              </div>
              <div className="h-3 w-3/4 rounded-sm bg-[var(--ui-text)]/85" />
              <div className="mt-3 h-1.5 w-full rounded-full bg-[var(--ui-border)]" />
              <div className="mt-2 h-1.5 w-5/6 rounded-full bg-[var(--ui-border)]" />
              <div className="mt-6 h-2 w-2/5 rounded-full bg-[var(--ui-primary)]/75" />
              <div className="mt-3 h-1.5 w-full rounded-full bg-[var(--ui-border)]" />
              <div className="mt-2 h-1.5 w-4/5 rounded-full bg-[var(--ui-border)]" />
              <div className="mt-2 h-1.5 w-11/12 rounded-full bg-[var(--ui-border)]" />
              <div className="mt-6 rounded-md border-l-2 border-[var(--ui-primary)] bg-[var(--ui-primary-soft)] px-3 py-2">
                <div className="h-1.5 w-full rounded-full bg-[var(--ui-primary-border)]" />
                <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-[var(--ui-primary-border)]" />
              </div>
            </div>

            <div className="bg-[var(--ui-surface-subtle)] p-3">
              <div className="mb-3 flex items-center justify-between text-[9px] text-[var(--ui-text-muted)]">
                <span className="flex items-center gap-1">
                  <Smartphone size={10} />
                  公众号预览
                </span>
                <span className="rounded bg-white px-1.5 py-0.5">清简</span>
              </div>
              <div className="mx-auto h-[218px] w-[126px] rounded-md border border-[var(--ui-border)] bg-white px-3 py-4 shadow-[var(--ui-shadow-xs)]">
                <div className="h-2 w-4/5 rounded-sm bg-[var(--ui-text)]/80" />
                <div className="mt-2 flex gap-1">
                  <span className="h-1 w-7 rounded-full bg-[var(--ui-border-strong)]" />
                  <span className="h-1 w-6 rounded-full bg-[var(--ui-primary)]/45" />
                </div>
                <div className="mt-4 h-1 w-full rounded-full bg-[var(--ui-border)]" />
                <div className="mt-1.5 h-1 w-11/12 rounded-full bg-[var(--ui-border)]" />
                <div className="mt-1.5 h-1 w-full rounded-full bg-[var(--ui-border)]" />
                <div className="mt-4 h-1.5 w-1/2 rounded-full bg-[var(--ui-primary)]/70" />
                <div className="mt-2 h-1 w-full rounded-full bg-[var(--ui-border)]" />
                <div className="mt-1.5 h-1 w-4/5 rounded-full bg-[var(--ui-border)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-5 right-0 flex items-center gap-2 rounded-lg border border-[var(--ui-border)] bg-white px-3 py-2.5 shadow-[var(--ui-shadow-floating)]">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--ui-status-success-soft)] text-[var(--ui-status-success)]">
            <LayoutTemplate size={14} />
          </span>
          <div>
            <p className="m-0 text-[10px] font-semibold text-[var(--ui-text)]">排版已同步</p>
            <p className="m-0 mt-0.5 text-[9px] text-[var(--ui-text-muted)]">右侧预览刚刚更新</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockDocumentItem({ width }: { width: string }) {
  return (
    <div className="rounded-md px-2 py-2.5">
      <div className={`h-1.5 ${width} rounded-full bg-[var(--ui-border-strong)]`} />
      <div className="mt-1.5 h-1 w-8 rounded-full bg-[var(--ui-border)]" />
    </div>
  );
}

function ModeButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-9 rounded-md text-sm font-medium transition-all ${
        active
          ? 'bg-white text-[var(--ui-text)] shadow-[var(--ui-shadow-xs)]'
          : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'
      }`}
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function getAuthErrorMessage(error: unknown, isLogin: boolean): string {
  if (error instanceof AuthApiError) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return '邮箱或密码错误';
      case 'EMAIL_ALREADY_EXISTS':
        return '该邮箱已注册，请直接登录';
      case 'ACCOUNT_DISABLED':
        return '该账号已被停用，请联系管理员';
      case 'RATE_LIMITED':
        return '操作过于频繁，请稍后再试';
      case 'VALIDATION_ERROR':
      case 'INVALID_REQUEST':
        return '提交的信息不符合要求，请检查后重试';
      default:
        return isLogin ? '登录失败，请稍后重试' : '注册失败，请稍后重试';
    }
  }

  if (error instanceof TypeError) {
    return '无法连接服务器，请检查网络后重试';
  }

  return isLogin ? '登录失败，请稍后重试' : '注册失败，请稍后重试';
}

interface FormFieldProps {
  autoComplete: string;
  icon: React.ReactNode;
  id: string;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder: string;
  type: 'email' | 'text';
  value: string;
}

function FormField({ autoComplete, icon, id, label, maxLength, onChange, placeholder, type, value }: FormFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-xs font-medium text-[var(--ui-text-secondary)]">{label}</span>
      <span className="flex h-11 items-center gap-2.5 rounded-lg border border-[var(--ui-border-strong)] bg-white px-3 text-[var(--ui-text-muted)] transition-[border-color,box-shadow] focus-within:border-[var(--ui-primary)] focus-within:shadow-[0_0_0_3px_var(--ui-primary-soft)]">
        {icon}
        <input
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--ui-text)] outline-none placeholder:text-[#a1a9b5] focus:outline-none"
          id={id}
          maxLength={maxLength}
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}

interface PasswordFieldProps {
  autoComplete: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  placeholder: string;
  showPassword: boolean;
  value: string;
}

function PasswordField({
  autoComplete,
  id,
  label,
  onChange,
  onToggleVisibility,
  placeholder,
  showPassword,
  value,
}: PasswordFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-xs font-medium text-[var(--ui-text-secondary)]">{label}</span>
      <span className="flex h-11 items-center gap-2.5 rounded-lg border border-[var(--ui-border-strong)] bg-white px-3 text-[var(--ui-text-muted)] transition-[border-color,box-shadow] focus-within:border-[var(--ui-primary)] focus-within:shadow-[0_0_0_3px_var(--ui-primary-soft)]">
        <LockKeyhole size={16} />
        <input
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--ui-text)] outline-none placeholder:text-[#a1a9b5] focus:outline-none"
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)]"
          type="button"
          aria-label={showPassword ? '隐藏密码' : '显示密码'}
          onClick={onToggleVisibility}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}
