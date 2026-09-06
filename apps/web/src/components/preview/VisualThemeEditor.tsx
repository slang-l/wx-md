import {
  Download,
  LayoutTemplate,
  LoaderCircle,
  Palette,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type {
  VisualThemeAlignment,
  VisualThemeFont,
  VisualThemeSettings,
  VisualThemeStructure,
} from '../../renderers/visual-theme';
import { wechatThemes, type WechatThemeId } from '../../renderers/wechat-themes';
import { MAX_SAVED_VISUAL_THEMES, type ActiveVisualTheme } from './visual-theme-storage';

type EditorTab = 'colors' | 'typography' | 'elements';

interface VisualThemeEditorProps {
  active: ActiveVisualTheme;
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

const accentPresets = ['#0f4c81', '#5367d8', '#19735b', '#b24a3b', '#9a5b13', '#6f4cac'];

export function VisualThemeEditor({
  active,
  savedCount,
  saving,
  onBaseChange,
  onChange,
  onClose,
  onDelete,
  onExport,
  onImport,
  onNameChange,
  onReset,
  onSave,
}: VisualThemeEditorProps) {
  const [tab, setTab] = useState<EditorTab>('colors');
  const [deleteArmed, setDeleteArmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setDeleteArmed(false), [active.savedId]);
  const update = <Key extends keyof VisualThemeSettings>(
    key: Key,
    value: VisualThemeSettings[Key],
  ) => onChange({ ...active.settings, [key]: value });

  return (
    <section id="visual-theme-editor" className="visual-theme-editor" aria-labelledby="visual-theme-editor-title">
      <header className="visual-theme-editor-header">
        <div>
          <span className="visual-theme-editor-icon" aria-hidden="true">
            <SlidersHorizontal size={15} />
          </span>
          <h3 id="visual-theme-editor-title">可视化主题编辑器</h3>
        </div>
        <div className="visual-theme-editor-tools">
          <ToolButton icon={<RotateCcw size={14} />} label="恢复当前模板" onClick={onReset} />
          <ToolButton icon={<Upload size={14} />} label="导入主题" onClick={() => fileInputRef.current?.click()} />
          <ToolButton icon={<Download size={14} />} label="导出主题" onClick={onExport} />
          {onDelete ? (
            <button
              className={`visual-theme-delete-button is-danger ${deleteArmed ? 'is-armed' : ''}`}
              type="button"
              aria-label={deleteArmed ? '确认删除主题' : '删除主题'}
              title={deleteArmed ? '再次点击确认删除' : '删除主题'}
              onBlur={() => setDeleteArmed(false)}
              onClick={() => {
                if (deleteArmed) onDelete();
                else setDeleteArmed(true);
              }}
            >
              <Trash2 size={14} />
              {deleteArmed ? <span>确认</span> : null}
            </button>
          ) : null}
          <ToolButton icon={<X size={15} />} label="关闭主题编辑器" onClick={onClose} />
          <input
            ref={fileInputRef}
            className="visual-theme-file-input"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImport(file);
              event.target.value = '';
            }}
          />
        </div>
      </header>

      <div className="visual-theme-savebar">
        <label>
          <span>主题名称</span>
          <input
            maxLength={40}
            value={active.name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void onSave();
              }
            }}
          />
        </label>
        <span className="visual-theme-save-count">{savedCount} / {MAX_SAVED_VISUAL_THEMES}</span>
        <button
          className="visual-theme-save-button"
          type="button"
          disabled={saving || !active.name.trim()}
          onClick={() => void onSave()}
        >
          {saving ? <LoaderCircle className="animate-spin" size={14} /> : <Save size={14} />}
          {active.savedId ? '更新' : '保存'}
        </button>
      </div>

      <div className="visual-theme-tabs" role="tablist" aria-label="主题设置">
        <EditorTabButton active={tab === 'colors'} icon={<Palette size={14} />} label="颜色" onClick={() => setTab('colors')} />
        <EditorTabButton active={tab === 'typography'} icon={<Type size={14} />} label="排版" onClick={() => setTab('typography')} />
        <EditorTabButton active={tab === 'elements'} icon={<LayoutTemplate size={14} />} label="元素" onClick={() => setTab('elements')} />
      </div>

      <div className="visual-theme-editor-body">
        {tab === 'colors' ? (
          <div className="visual-theme-control-grid visual-theme-colors-grid" role="tabpanel">
            <div className="visual-theme-control visual-theme-control-wide">
              <span className="visual-theme-control-label">基础模板</span>
              <SegmentedControl
                value={active.baseThemeId}
                options={wechatThemes.map((theme) => ({ value: theme.id, label: theme.label }))}
                onChange={onBaseChange}
              />
            </div>
            <ColorControl
              label="强调色"
              value={active.settings.accentColor}
              presets={accentPresets}
              onChange={(value) => update('accentColor', value)}
            />
            <ColorControl label="正文" value={active.settings.textColor} onChange={(value) => update('textColor', value)} />
            <ColorControl label="背景" value={active.settings.backgroundColor} onChange={(value) => update('backgroundColor', value)} />
          </div>
        ) : null}

        {tab === 'typography' ? (
          <div className="visual-theme-control-grid" role="tabpanel">
            <label className="visual-theme-control">
              <span className="visual-theme-control-label">字体</span>
              <select value={active.settings.font} onChange={(event) => update('font', event.target.value as VisualThemeFont)}>
                <option value="sans">系统黑体</option>
                <option value="serif">中文宋体</option>
                <option value="modern">现代无衬线</option>
              </select>
            </label>
            <RangeControl label="正文字号" min={13} max={22} step={1} unit="px" value={active.settings.fontSize} onChange={(value) => update('fontSize', value)} />
            <RangeControl label="行高" min={1.35} max={2.4} step={0.05} value={active.settings.lineHeight} onChange={(value) => update('lineHeight', value)} />
            <RangeControl label="段落间距" min={0.5} max={3} step={0.1} unit="em" value={active.settings.paragraphSpacing} onChange={(value) => update('paragraphSpacing', value)} />
            <RangeControl label="字距" min={0} max={0.2} step={0.01} unit="em" value={active.settings.letterSpacing} onChange={(value) => update('letterSpacing', value)} />
            <div className="visual-theme-control">
              <span className="visual-theme-control-label">对齐</span>
              <SegmentedControl<VisualThemeAlignment>
                value={active.settings.textAlign}
                options={[{ value: 'left', label: '左对齐' }, { value: 'justify', label: '两端' }]}
                onChange={(value) => update('textAlign', value)}
              />
            </div>
            <label className="visual-theme-toggle">
              <span>首行缩进</span>
              <input type="checkbox" checked={active.settings.firstLineIndent} onChange={(event) => update('firstLineIndent', event.target.checked)} />
              <span className="visual-theme-toggle-track" aria-hidden="true" />
            </label>
          </div>
        ) : null}

        {tab === 'elements' ? (
          <div className="visual-theme-control-grid" role="tabpanel">
            <div className="visual-theme-control visual-theme-control-wide">
              <span className="visual-theme-control-label">标题样式</span>
              <StructureControl value={active.settings.headingStyle} onChange={(value) => update('headingStyle', value)} />
            </div>
            <div className="visual-theme-control visual-theme-control-wide">
              <span className="visual-theme-control-label">引用样式</span>
              <StructureControl value={active.settings.quoteStyle} onChange={(value) => update('quoteStyle', value)} />
            </div>
            <RangeControl label="图片圆角" min={0} max={20} step={1} unit="px" value={active.settings.imageRadius} onChange={(value) => update('imageRadius', value)} />
            <RangeControl label="两侧留白" min={0} max={24} step={2} unit="px" value={active.settings.pagePadding} onChange={(value) => update('pagePadding', value)} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EditorTabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={active} className={active ? 'is-active' : ''} onClick={onClick}>
      {icon}{label}
    </button>
  );
}

function ToolButton({ danger = false, icon, label, onClick }: { danger?: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={danger ? 'is-danger' : ''} type="button" aria-label={label} title={label} onClick={onClick}>
      {icon}
    </button>
  );
}

function ColorControl({
  label,
  onChange,
  presets,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  presets?: string[];
  value: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className={`visual-theme-control ${presets ? 'visual-theme-control-wide' : ''}`}>
      <span className="visual-theme-control-label">{label}</span>
      <div className="visual-theme-color-row">
        <label className="visual-theme-color-picker" title={`选择${label}`}>
          <span style={{ backgroundColor: value }} />
          <input type="color" value={value} aria-label={`选择${label}`} onChange={(event) => onChange(event.target.value)} />
        </label>
        <input
          className="visual-theme-color-text"
          value={draft}
          maxLength={7}
          aria-label={`${label}十六进制颜色`}
          onBlur={() => setDraft(value)}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase());
          }}
        />
        {presets ? (
          <div className="visual-theme-swatches" aria-label="强调色预设">
            {presets.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`使用颜色 ${color}`}
                aria-pressed={value === color}
                title={color}
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step,
  unit = '',
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  unit?: string;
  value: number;
}) {
  return (
    <label className="visual-theme-control visual-theme-range-control">
      <span className="visual-theme-control-label">{label}<output>{value}{unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function StructureControl({ value, onChange }: { value: VisualThemeStructure; onChange: (value: VisualThemeStructure) => void }) {
  return (
    <SegmentedControl<VisualThemeStructure>
      value={value}
      options={[{ value: 'default', label: '经典' }, { value: 'grace', label: '强调' }, { value: 'simple', label: '柔和' }]}
      onChange={onChange}
    />
  );
}

function SegmentedControl<Value extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: Value) => void;
  options: Array<{ value: Value; label: string }> | readonly { value: Value; label: string }[];
  value: Value;
}) {
  return (
    <div className="visual-theme-segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          className={value === option.value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
