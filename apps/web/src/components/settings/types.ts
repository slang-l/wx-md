export type SettingsAccent = 'indigo' | 'purple' | 'green' | 'graphite';

export type SettingsScale = 'small' | 'default' | 'large';

/**
 * 设置模块只依赖这组最小用户信息，不耦合认证服务或应用内部的 User 类型。
 */
export interface SettingsUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface SettingsPreferences {
  version: 1;
  appearance: {
    accent: SettingsAccent;
    scale: SettingsScale;
    reduceMotion: boolean;
  };
  privacy: {
    /** 导出设置时是否附带宿主传入的只读账号资料。 */
    includeAccountInExport: boolean;
  };
}

export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SettingsUser;
  /** 退出能力由宿主注入；未传入时设置页不会伪造退出行为。 */
  onSignOut?: () => void | Promise<void>;
  appName?: string;
  appVersion?: string;
}
