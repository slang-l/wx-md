import type { WechatAccount } from '../type/wechat.js';
import type { WechatRepository } from './wechat.repository.js';

export function createMemoryWechatRepository(): WechatRepository {
  const accounts = new Map<string, WechatAccount>();

  return {
    async findAccountByUserId(userId) {
      const account = accounts.get(userId);
      return account ? cloneAccount(account) : null;
    },

    async upsertAccount(input) {
      const existing = accounts.get(input.userId);
      const now = new Date();
      const account: WechatAccount = {
        ...input,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      accounts.set(input.userId, account);
      return cloneAccount(account);
    },

    async deleteAccount(userId) {
      accounts.delete(userId);
    },
  };
}

function cloneAccount(account: WechatAccount): WechatAccount {
  return {
    ...account,
    createdAt: new Date(account.createdAt),
    updatedAt: new Date(account.updatedAt),
  };
}
