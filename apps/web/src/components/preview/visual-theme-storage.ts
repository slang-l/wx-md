import {
  createDefaultVisualThemeSettings,
  parseVisualThemeSettings,
  type VisualThemeSettings,
} from '../../renderers/visual-theme';
import {
  defaultWechatThemeId,
  isWechatThemeId,
  type WechatThemeId,
} from '../../renderers/wechat-themes';

const LEGACY_THEME_STORAGE_KEY = 'block-notes-wechat-theme-v4';
const THEME_WORKSPACE_STORAGE_PREFIX = 'block-notes-visual-themes-v1';
export const MAX_SAVED_VISUAL_THEMES = 12;

export interface SavedVisualTheme {
  id: string;
  name: string;
  baseThemeId: WechatThemeId;
  settings: VisualThemeSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveVisualTheme {
  baseThemeId: WechatThemeId;
  name: string;
  savedId?: string;
  settings: VisualThemeSettings;
}

export interface VisualThemeWorkspace {
  themeId: WechatThemeId;
  active: ActiveVisualTheme | null;
  savedThemes: SavedVisualTheme[];
}

interface StoredVisualThemeWorkspace {
  version: 1;
  themeId: WechatThemeId;
  active: ActiveVisualTheme | null;
  savedThemes: SavedVisualTheme[];
}

interface PortableVisualTheme {
  format: 'automatic-visual-theme';
  version: 1;
  name: string;
  baseThemeId: WechatThemeId;
  settings: VisualThemeSettings;
}

export function loadVisualThemeWorkspace(userId: string): VisualThemeWorkspace {
  const fallbackThemeId = readLegacyThemeId();
  const fallback: VisualThemeWorkspace = {
    themeId: fallbackThemeId,
    active: null,
    savedThemes: [],
  };

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1) return fallback;

    const themeId = isWechatThemeId(asString(parsed.themeId))
      ? (asString(parsed.themeId) as WechatThemeId)
      : fallbackThemeId;
    const savedThemes = Array.isArray(parsed.savedThemes)
      ? parsed.savedThemes
          .map(parseSavedTheme)
          .filter((theme): theme is SavedVisualTheme => theme !== null)
          .slice(0, MAX_SAVED_VISUAL_THEMES)
      : [];
    const active = parseActiveTheme(parsed.active, savedThemes);

    return { themeId, active, savedThemes };
  } catch {
    return fallback;
  }
}

export function saveVisualThemeWorkspace(userId: string, workspace: VisualThemeWorkspace): void {
  const payload: StoredVisualThemeWorkspace = {
    version: 1,
    themeId: workspace.themeId,
    active: workspace.active,
    savedThemes: workspace.savedThemes.slice(0, MAX_SAVED_VISUAL_THEMES),
  };
  window.localStorage.setItem(storageKey(userId), JSON.stringify(payload));
}

export function serializeVisualTheme(theme: ActiveVisualTheme): string {
  const payload: PortableVisualTheme = {
    format: 'automatic-visual-theme',
    version: 1,
    name: normalizeName(theme.name, '自定义主题'),
    baseThemeId: theme.baseThemeId,
    settings: theme.settings,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseImportedVisualTheme(
  source: string,
): Omit<SavedVisualTheme, 'id' | 'createdAt' | 'updatedAt'> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('主题文件不是有效的 JSON');
  }

  if (!isRecord(parsed) || parsed.format !== 'automatic-visual-theme' || parsed.version !== 1) {
    throw new Error('无法识别这个主题文件');
  }

  const name = typeof parsed.name === 'string' ? normalizeName(parsed.name, '') : '';
  const baseThemeId = asString(parsed.baseThemeId);
  const settings = parseVisualThemeSettings(parsed.settings);
  if (!name || !isWechatThemeId(baseThemeId) || !settings) {
    throw new Error('主题文件缺少必要配置');
  }

  return { name, baseThemeId, settings };
}

export function createInitialActiveTheme(baseThemeId: WechatThemeId): ActiveVisualTheme {
  return {
    baseThemeId,
    name: '我的主题',
    settings: createDefaultVisualThemeSettings(baseThemeId),
  };
}

function parseSavedTheme(value: unknown): SavedVisualTheme | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = typeof value.name === 'string' ? normalizeName(value.name, '') : '';
  const baseThemeId = asString(value.baseThemeId);
  const settings = parseVisualThemeSettings(value.settings);
  const createdAt = validDateString(value.createdAt);
  const updatedAt = validDateString(value.updatedAt);

  if (!id || !name || !isWechatThemeId(baseThemeId) || !settings || !createdAt || !updatedAt) {
    return null;
  }
  return { id, name, baseThemeId, settings, createdAt, updatedAt };
}

function parseActiveTheme(
  value: unknown,
  savedThemes: SavedVisualTheme[],
): ActiveVisualTheme | null {
  if (!isRecord(value)) return null;
  const baseThemeId = asString(value.baseThemeId);
  const settings = parseVisualThemeSettings(value.settings);
  if (!isWechatThemeId(baseThemeId) || !settings) return null;

  const savedId = asString(value.savedId) || undefined;
  const savedTheme = savedId ? savedThemes.find((theme) => theme.id === savedId) : undefined;
  return {
    baseThemeId,
    name:
      typeof value.name === 'string'
        ? normalizeName(value.name, savedTheme?.name ?? '我的主题')
        : (savedTheme?.name ?? '我的主题'),
    ...(savedId ? { savedId } : {}),
    settings,
  };
}

function readLegacyThemeId(): WechatThemeId {
  const legacyThemeId = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  return isWechatThemeId(legacyThemeId) ? legacyThemeId : defaultWechatThemeId;
}

function storageKey(userId: string) {
  return `${THEME_WORKSPACE_STORAGE_PREFIX}:${userId}`;
}

function normalizeName(value: string, fallback: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 40) || fallback;
}

function validDateString(value: unknown) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return null;
  return value;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
