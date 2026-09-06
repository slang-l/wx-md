import type { UpsertWechatAccountInput, WechatAccount } from '../type/wechat.js';

export interface WechatRepository {
  findAccountByUserId(userId: string): Promise<WechatAccount | null>;
  upsertAccount(input: UpsertWechatAccountInput): Promise<WechatAccount>;
  deleteAccount(userId: string): Promise<void>;
}
