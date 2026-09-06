export interface WechatAccount {
  userId: string;
  appId: string;
  encryptedAppSecret: string;
  defaultAuthor: string;
  defaultDigest: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertWechatAccountInput {
  userId: string;
  appId: string;
  encryptedAppSecret: string;
  defaultAuthor: string;
  defaultDigest: string;
}

export type WechatPublishState = 'publishing' | 'published' | 'failed';
