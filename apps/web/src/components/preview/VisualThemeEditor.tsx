import {
  AlignJustify, AlignLeft, Check, ChevronDown, Download, LayoutTemplate,
  LoaderCircle, Palette, RotateCcw, Save, SlidersHorizontal, Trash2, Type, Upload, X,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type {
  VisualThemeAlignment, VisualThemeFont, VisualThemeSettings, VisualThemeStructure,
} from '../../renderers/visual-theme';
import { wechatThemes, type WechatThemeId } from '../../renderers/wechat-themes';
import { MAX_SAVED_VISUAL_THEMES, type ActiveVisualTheme } from './visual-theme-storage';
import './visual-theme-editor.css';

type EditorTab = 'colors' | 'typography' | 'elements';

interface VisualThemeEditorProps {
  active: ActiveVisualTheme;
  dirty: boolean;
  savedCount: number;
  saving: boolean;
  onBaseChange: (themeId: WechatThemeId) => void;
  onChange: (settings: VisualThemeSettings) => void;
  onClose: () => void;
  onDelete?: () => void;
  onExport: () => void;
  onImport: (file: File) => void | Promise<void>;
  onNameChange: (name: string) => void;
  onReset: () => void;
  onSave: () => void | Promise<void>;
}

const accentPresets = [
  { color: '#0f4c81', label: '深海蓝' },
  { color: '#5367d8', label: '鸢尾蓝' },
  { color: '#19735b', label: '松石绿' },
  { color: '#b24a3b', label: '陶土红' },
  { color: '#9a5b13', label: '琥珀棕' },
  { color: '#6f4cac', label: '雾紫' },
];

const editorTabs = [
  { id: 'colors', label: '配色', icon: Palette },
  { id: 'typography', label: '文字排版', icon: Type },
  { id: 'elements', label: '元素样式', icon: LayoutTemplate },
] as const;

const templateDescriptions: Record<WechatThemeId, string> = {
  default: '利落 · 清晰',
  grace: '精致 · 醒目',
  simple: '柔和 · 轻盈',
};

export function VisualThemeEditor({
  active, dirty, savedCount, saving, onBaseChange, onChange, onClose,
  onDelete, onExport, onImport, onNameChange, onReset, onSave,
}: VisualThemeEditorProps) {
  const [tab, setTab] = useState<EditorTab>('colors');
  const [deleteArmed, setDeleteArmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const saveDisabled = saving || !active.name.trim();

  useEffect(() => setDeleteArmed(false), [active.savedId]);
  useEffect(() => { panelRef.current?.scrollTo(0, 0); }, [tab]);

  const update = <Key extends keyof VisualThemeSettings>(key: Key, value: VisualThemeSettings[Key]) =>
    onChange({ ...active.settings, [key]: value });

  return (
    <section id="visual-theme-editor" className="visual-theme-editor" aria-labelledby={`${id}-title`}>
      <header className="visual-theme-editor-header">
        <div className="visual-theme-editor-heading">
          <span className="visual-theme-editor-icon" aria-hidden="true"><SlidersHorizontal size={18} /></span>
          <div>
            <h3 id={`${id}-title`}>主题设计</h3>
            <p>让每一篇文章，都有你的风格</p>
          </div>
        </div>
        <div className="visual-theme-editor-tools">
          <ToolButton icon={<Upload size={15} />} label="导入主题" onClick={() => fileInputRef.current?.click()} />
          <ToolButton icon={<Download size={15} />} label="导出主题" onClick={onExport} />
          <span className="visual-theme-tool-divider" aria-hidden="true" />
          <ToolButton icon={<X size={16} />} label="关闭主题编辑器" onClick={onClose} />
        </div>
        <input
          ref={fileInputRef} className="visual-theme-file-input" type="file" tabIndex={-1}
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onImport(file);
            event.target.value = '';
          }}
        />
      </header>

      <div className="visual-theme-navigation">
        <div className="visual-theme-tabs" role="tablist" aria-label="主题设置">
          {editorTabs.map(({ id: tabId, label, icon: Icon }, index) => (
            <button
              key={tabId}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={`${id}-tab-${tabId}`} type="button" role="tab"
              aria-selected={tab === tabId} aria-controls={`${id}-panel`}
              tabIndex={tab === tabId ? 0 : -1}
              className={tab === tabId ? 'is-active' : ''}
              onClick={() => setTab(tabId)}
              onKeyDown={(event) => {
                let nextIndex = index;
                if (event.key === 'ArrowRight') nextIndex = (index + 1) % editorTabs.length;
                else if (event.key === 'ArrowLeft') nextIndex = (index + editorTabs.length - 1) % editorTabs.length;
                else if (event.key === 'Home') nextIndex = 0;
                else if (event.key === 'End') nextIndex = editorTabs.length - 1;
                else return;
                event.preventDefault();
                setTab(editorTabs[nextIndex].id);
                tabRefs.current[nextIndex]?.focus();
              }}
            >
              <Icon size={14} aria-hidden="true" />{label}
            </button>
          ))}
        </div>
        <span className="visual-theme-live"><span aria-hidden="true" />实时预览</span>
      </div>

      <div
        ref={panelRef} id={`${id}-panel`} className="visual-theme-editor-body"
        role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} tabIndex={0}
        style={{ '--theme-sample-accent': active.settings.accentColor } as CSSProperties}
      >
        {tab === 'colors' ? (
          <>
            <ControlSection title="基础模板" description="切换模板将重置当前样式">
              <div className="visual-theme-template-grid" role="group" aria-label="基础模板">
                {wechatThemes.map((theme) => (
                  <button
                    key={theme.id} type="button"
                    className={`visual-theme-template ${active.baseThemeId === theme.id ? 'is-active' : ''}`}
                    aria-pressed={active.baseThemeId === theme.id}
                    onClick={() => { if (active.baseThemeId !== theme.id) onBaseChange(theme.id); }}
                  >
                    <span className={`visual-theme-template-paper is-${theme.id}`} aria-hidden="true">
                      <span className="visual-theme-template-title">一篇好文章</span>
                      <span className="visual-theme-sample-lines"><i /><i /><i /></span>
                      <span className="visual-theme-template-quote" />
                    </span>
                    <span className="visual-theme-template-caption">
                      <strong>{theme.label}</strong>
                      <span className="visual-theme-selection-mark" aria-hidden="true">
                        {active.baseThemeId === theme.id ? <Check size={10} strokeWidth={3} /> : null}
                      </span>
                    </span>
                    <small>{templateDescriptions[theme.id]}</small>
                  </button>
                ))}
              </div>
            </ControlSection>
            <ControlSection title="文章配色" description="用颜色建立你的辨识度">
              <div className="visual-theme-color-card">
                <ColorControl label="强调色" description="标题、链接与装饰" value={active.settings.accentColor} onChange={(value) => update('accentColor', value)} />
                <div className="visual-theme-preset-row">
                  <span>推荐配色</span>
                  <div className="visual-theme-swatches" role="group" aria-label="强调色预设">
                    {accentPresets.map(({ color, label }) => (
                      <button
                        key={color} type="button" aria-label={`${label} ${color}`}
                        aria-pressed={active.settings.accentColor.toLowerCase() === color}
                        title={label} style={{ backgroundColor: color }} onClick={() => update('accentColor', color)}
                      >
                        {active.settings.accentColor.toLowerCase() === color ? <Check size={12} strokeWidth={2.5} /> : null}
                      </button>
                    ))}
                  </div>
                </div>
                <ColorControl label="正文颜色" description="舒适、清晰的阅读体验" value={active.settings.textColor} onChange={(value) => update('textColor', value)} />
                <ColorControl label="页面背景" description="文章的底色" value={active.settings.backgroundColor} onChange={(value) => update('backgroundColor', value)} />
              </div>
            </ControlSection>
          </>
        ) : null}

        {tab === 'typography' ? (
          <>
            <ControlSection title="字体与字号" description="找到适合内容的阅读气质">
              <div className="visual-theme-control-grid">
                <label className="visual-theme-control">
                  <span className="visual-theme-control-label">正文字体</span>
                  <span className="visual-theme-select-wrap">
                    <Type size={15} aria-hidden="true" />
                    <select value={active.settings.font} onChange={(event) => update('font', event.target.value as VisualThemeFont)}>
                      <option value="sans">系统黑体</option>
                      <option value="serif">中文宋体</option>
                      <option value="modern">现代无衬线</option>
                    </select>
                    <ChevronDown size={13} aria-hidden="true" />
                  </span>
                </label>
                <RangeControl label="正文字号" min={13} max={22} step={1} unit="px" value={active.settings.fontSize} onChange={(value) => update('fontSize', value)} />
              </div>
            </ControlSection>
            <ControlSection title="阅读节奏" description="给文字留一点呼吸的空间">
              <div className="visual-theme-control-grid">
                <RangeControl label="行高" min={1.35} max={2.4} step={0.05} unit="倍" value={active.settings.lineHeight} onChange={(value) => update('lineHeight', value)} />
                <RangeControl label="段落间距" min={0.5} max={3} step={0.1} unit="em" value={active.settings.paragraphSpacing} onChange={(value) => update('paragraphSpacing', value)} />
                <RangeControl label="字距" min={0} max={0.2} step={0.01} unit="em" value={active.settings.letterSpacing} onChange={(value) => update('letterSpacing', value)} />
                <div className="visual-theme-control">
                  <span className="visual-theme-control-label">文本对齐</span>
                  <SegmentedControl<VisualThemeAlignment>
                    label="文本对齐" value={active.settings.textAlign}
                    options={[{ value: 'left', label: '左对齐', icon: <AlignLeft size={14} /> }, { value: 'justify', label: '两端对齐', icon: <AlignJustify size={14} /> }]}
                    onChange={(value) => update('textAlign', value)}
                  />
                </div>
              </div>
              <label className="visual-theme-toggle">
                <span><strong>首行缩进</strong><small>每段开头缩进两个字符</small></span>
                <input type="checkbox" role="switch" checked={active.settings.firstLineIndent} onChange={(event) => update('firstLineIndent', event.target.checked)} />
                <span className="visual-theme-toggle-track" aria-hidden="true" />
              </label>
            </ControlSection>
          </>
        ) : null}

        {tab === 'elements' ? (
          <>
            <ControlSection title="标题样式" description="让内容层次一目了然">
              <StructureControl kind="heading" value={active.settings.headingStyle} onChange={(value) => update('headingStyle', value)} />
            </ControlSection>
            <ControlSection title="引用样式" description="为值得注意的文字加一点强调">
              <StructureControl kind="quote" value={active.settings.quoteStyle} onChange={(value) => update('quoteStyle', value)} />
            </ControlSection>
            <ControlSection title="细节与留白">
              <div className="visual-theme-control-grid">
                <RangeControl label="图片圆角" min={0} max={20} step={1} unit="px" value={active.settings.imageRadius} onChange={(value) => update('imageRadius', value)} />
                <RangeControl label="两侧留白" min={0} max={24} step={2} unit="px" value={active.settings.pagePadding} onChange={(value) => update('pagePadding', value)} />
              </div>
            </ControlSection>
          </>
        ) : null}
      </div>

      <footer className="visual-theme-savebar">
        <div className="visual-theme-save-row">
          <label className="visual-theme-name-field">
            <span>主题名称</span>
            <input
              maxLength={40} placeholder="给你的主题起个名字" value={active.name}
              onChange={(event) => onNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  if (!saveDisabled) void onSave();
                }
              }}
            />
          </label>
          <button className="visual-theme-save-button" type="button" disabled={saveDisabled} onClick={() => void onSave()}>
            {saving ? <LoaderCircle className="animate-spin" size={14} /> : <Save size={14} />}
            {saving ? '保存中' : active.savedId ? '更新主题' : '保存主题'}
          </button>
        </div>
        <div className="visual-theme-footer-meta">
          <span className={`visual-theme-save-status ${dirty ? 'is-dirty' : ''}`} role="status">
            {dirty ? <span className="visual-theme-status-dot" aria-hidden="true" /> : <Check size={12} aria-hidden="true" />}
            {dirty ? (active.savedId ? '有未保存的更改' : '未保存的主题') : '已保存'}
            <span className="visual-theme-save-count" title={`已保存 ${savedCount} 个主题，最多 ${MAX_SAVED_VISUAL_THEMES} 个`}>{savedCount}/{MAX_SAVED_VISUAL_THEMES}</span>
          </span>
          <div className="visual-theme-footer-tools">
            <button type="button" onClick={onReset} title="恢复当前模板的默认样式"><RotateCcw size={12} />重置</button>
            {onDelete ? (
              <button
                className={`visual-theme-delete-button ${deleteArmed ? 'is-armed' : ''}`} type="button"
                aria-label={deleteArmed ? '确认删除主题' : '删除主题'}
                title={deleteArmed ? '再次点击确认删除' : '删除主题'}
                onBlur={() => setDeleteArmed(false)}
                onClick={() => { if (deleteArmed) onDelete(); else setDeleteArmed(true); }}
              >
                <Trash2 size={12} />{deleteArmed ? '确认删除' : '删除'}
              </button>
            ) : null}
          </div>
        </div>
      </footer>
    </section>
  );
}

function ControlSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="visual-theme-section">
      <div className="visual-theme-section-heading"><h4>{title}</h4>{description ? <p>{description}</p> : null}</div>
      {children}
    </section>
  );
}

function ToolButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick}>{icon}</button>;
}

function ColorControl({ label, description, onChange, value }: {
  label: string; description: string; onChange: (value: string) => void; value: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="visual-theme-color-control">
      <div className="visual-theme-color-label"><strong>{label}</strong><small>{description}</small></div>
      <div className="visual-theme-color-field">
        <label className="visual-theme-color-picker" title={`选择${label}`}>
          <span style={{ backgroundColor: value }} />
          <input type="color" value={value} aria-label={`选择${label}`} onChange={(event) => onChange(event.target.value)} />
        </label>
        <input
          className="visual-theme-color-text" value={draft} maxLength={7} spellCheck={false} autoComplete="off"
          aria-label={`${label}十六进制颜色`}
          onBlur={() => setDraft(value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
              setDraft(value);
              event.currentTarget.blur();
            }
          }}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase());
          }}
        />
      </div>
    </div>
  );
}

function RangeControl({ label, max, min, onChange, step, unit, value }: {
  label: string; max: number; min: number; onChange: (value: number) => void; step: number; unit: string; value: number;
}) {
  const id = useId();
  return (
    <div className="visual-theme-control visual-theme-range-control">
      <div className="visual-theme-control-label">
        <label htmlFor={id}>{label}</label><output htmlFor={id}>{value}<span>{unit}</span></output>
      </div>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={`${value} ${unit}`}
        style={{ '--range-progress': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="visual-theme-range-limits" aria-hidden="true"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}

function StructureControl({ kind, value, onChange }: {
  kind: 'heading' | 'quote'; value: VisualThemeStructure; onChange: (value: VisualThemeStructure) => void;
}) {
  return (
    <div className="visual-theme-structure-grid" role="group" aria-label={kind === 'heading' ? '标题样式' : '引用样式'}>
      {([{ value: 'default', label: '经典' }, { value: 'grace', label: '强调' }, { value: 'simple', label: '柔和' }] as const).map((option) => (
        <button key={option.value} type="button" className={`visual-theme-structure-card ${value === option.value ? 'is-active' : ''}`} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          <span className={`visual-theme-structure-sample is-${kind} is-${option.value}`} aria-hidden="true">
            {kind === 'heading' ? <strong>章节标题</strong> : <span className="visual-theme-sample-lines"><i /><i /></span>}
          </span>
          <span className="visual-theme-structure-caption">{option.label}<span className="visual-theme-selection-mark" aria-hidden="true">{value === option.value ? <Check size={10} strokeWidth={3} /> : null}</span></span>
        </button>
      ))}
    </div>
  );
}

function SegmentedControl<Value extends string>({ label, onChange, options, value }: {
  label: string; onChange: (value: Value) => void;
  options: Array<{ value: Value; label: string; icon?: ReactNode }>; value: Value;
}) {
  return (
    <div className="visual-theme-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} className={value === option.value ? 'is-active' : ''} onClick={() => onChange(option.value)}>
          {option.icon}{option.label}
        </button>
      ))}
    </div>
  );
}
