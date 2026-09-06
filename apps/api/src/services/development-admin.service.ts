import bcrypt from 'bcryptjs';

import type { AppConfig } from '../config.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { PublicUser } from '../type/auth.js';
import { toPublicUser } from '../repositories/auth.repository.js';

export interface ProvisionDevelopmentAdminOptions {
  config: AppConfig;
  repository: AuthRepository;
  passwordHashRounds?: number;
}

/**
 * 幂等初始化本地管理员。production/test 配置没有 developmentAdmin，函数直接退出。
 * 已有同邮箱账号会被校正为 active/admin，并使用配置中的开发密码。
 */
export async function provisionDevelopmentAdmin({
  config,
  repository,
  passwordHashRounds = 12,
}: ProvisionDevelopmentAdminOptions): Promise<PublicUser | null> {
  const account = config.developmentAdmin;
  if (!account) return null;

  const existing = await repository.findUserByEmail(account.email);
  const passwordMatches = existing
    ? await bcrypt.compare(account.password, existing.passwordHash)
    : false;
  // bcrypt 每次生成不同 salt。密码本来就正确时复用旧哈希，避免每次启动都
  // 无意义地更新数据库和 updated_at。
  const passwordHash = passwordMatches
    ? existing!.passwordHash
    : await bcrypt.hash(account.password, passwordHashRounds);
  const user = await repository.upsertSystemUser({
    email: account.email,
    passwordHash,
    name: account.name,
    role: 'admin',
  });

  return toPublicUser(user);
}
