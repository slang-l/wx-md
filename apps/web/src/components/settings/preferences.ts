import { useCallback, useEffect, useState } from 'react';
import type { SettingsPreferences, SettingsUser } from './types';

const STORAGE_PREFIX = 'wx-md:settings:v1:';

export const DEFAULT_SETTINGS_PREFERENCES: Readonly<SettingsPreferences> = {
  version: 1,
  appearance: {
    accent: 'indigo',
    scale: 'default',
    reduceMotion: false,
  },
  privacy: {
    includeAccountInExport: false,
  },
};

function defaults(): SettingsPreferences {
  return {
    version: 1,
    appearance: { ...DEFAULT_SETTINGS_PREFERENCES.appearance },
    privacy: { ...DEFAULT_SETTINGS_PREFERENCES.privacy },
  };
}

export function getSettingsStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(userId)}`;
}

function normalizePreferences(value: unknown): SettingsPreferences {
  const fallback = defaults();
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as Partial<SettingsPreferences>;
  const appearance = candidate.appearance;
  const privacy = candidate.privacy;
  const accents = ['indigo', 'purple', 'green', 'graphite'] as const;
  const scales = ['small', 'default', 'large'] as const;

  return {
    version: 1,
    appearance: {
      accent: accents.includes(appearance?.accent as (typeof accents)[number])
        ? (appearance?.accent as SettingsPreferences['appearance']['accent'])
        : fallback.appearance.accent,
      scale: scales.includes(appearance?.scale as (typeof scales)[number])
        ? (appearance?.scale as SettingsPreferences['appearance']['scale'])
        : fallback.appearance.scale,
      reduceMotion:
        typeof appearance?.reduceMotion === 'boolean'
          ? appearance.reduceMotion
          : fallback.appearance.reduceMotion,
    },
    privacy: {
      includeAccountInExport:
        typeof privacy?.includeAccountInExport === 'boolean'
          ? privacy.includeAccountInExport
          : fallback.privacy.includeAccountInExport,
    },
  };
}

export function loadSettingsPreferences(userId: string): SettingsPreferences {
  if (typeof window === 'undefined') return defaults();

  try {
    const raw = window.localStorage.getItem(getSettingsStorageKey(userId));
    return raw ? normalizePreferences(JSON.parse(raw)) : defaults();
  } catch {
    // 隐私模式、空间不足或损坏 JSON 都不应阻止应用启动。
    return defaults();
  }
}

export function saveSettingsPreferences(userId: string, preferences: SettingsPreferences): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(getSettingsStorageKey(userId), JSON.stringify(normalizePreferences(preferences)));
    return true;
  } catch {
    return false;
  }
}

export function applySettingsPreferences(preferences: SettingsPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.uiAccent = preferences.appearance.accent;
  root.dataset.uiScale = preferences.appearance.scale;
  root.dataset.uiReduceMotion = String(preferences.appearance.reduceMotion);
}

/** 移除设置模块施加的全局外观，避免退出后把上一账号的偏好带到匿名页面。 */
export function clearAppliedSettingsPreferences(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  delete root.dataset.uiAccent;
  delete root.dataset.uiScale;
  delete root.dataset.uiReduceMotion;
}

export function resetSettingsPreferences(userId: string): SettingsPreferences {
  const next = defaults();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(getSettingsStorageKey(userId));
    } catch {
      // 即使浏览器禁止 localStorage，也仍可恢复当前页面的默认外观。
    }
  }
  applySettingsPreferences(next);
  return next;
}

export function downloadSettingsJson(user: SettingsUser, preferences: SettingsPreferences): void {
  if (typeof document === 'undefined') return;

  const payload = {
    format: 'wx-md-settings',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...(preferences.privacy.includeAccountInExport
      ? { account: { id: user.id, name: user.name, email: user.email } }
      : {}),
    preferences,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `wx-md-settings-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

type PreferenceUpdater =
  | SettingsPreferences
  | ((current: SettingsPreferences) => SettingsPreferences);

export function useSettingsPreferences(userId: string) {
  const [preferences, setPreferencesState] = useState<SettingsPreferences>(() =>
    loadSettingsPreferences(userId),
  );

  useEffect(() => {
    const next = loadSettingsPreferences(userId);
    setPreferencesState(next);
    applySettingsPreferences(next);
  }, [userId]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== getSettingsStorageKey(userId)) return;
      const next = loadSettingsPreferences(userId);
      setPreferencesState(next);
      applySettingsPreferences(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId]);

  const setPreferences = useCallback(
    (updater: PreferenceUpdater) => {
      setPreferencesState((current) => {
        const next = normalizePreferences(
          typeof updater === 'function' ? updater(current) : updater,
        );
        saveSettingsPreferences(userId, next);
        applySettingsPreferences(next);
        return next;
      });
    },
    [userId],
  );

  const reset = useCallback(() => {
    setPreferencesState(resetSettingsPreferences(userId));
  }, [userId]);

  return { preferences, setPreferences, reset } as const;
}
