// 系统支持的用户角色。角色会进入 Access Token，但最终权限仍由服务端判断。
export type UserRole = 'user' | 'admin';

// 定义用户状态
export type UserStatus = 'active' | 'disabled';

// 定义数据库的用户实体类

export interface User {
  id: string;
  email: string;
  // 用户名称。
  name: string;

  // 经过 bcrypt 加密后的密码。
  passwordHash: string;

  // 用户角色。
  role: UserRole;

  // 用户账号状态。
  status: UserStatus;

  // 用户创建时间。
  createdAt: Date;

  // 用户更新时间。
  updatedAt: Date;
}

// 定义返回给前端的用户信息。
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

// 定义 Refresh Token 会话。
export interface RefreshSession {
  // 当前会话记录的唯一 ID。
  id: string;

  // Refresh Token 的 SHA-256 哈希。
  tokenHash: string;

  // 当前会话所属用户 ID。
  userId: string;

  // 当前 Refresh Token 链的家族 ID。
  familyId: string;

  // 会话创建时间。
  createdAt: Date;

  // Refresh Token 过期时间。
  expiresAt: Date;

  // Refresh Token 被撤销的时间。
  revokedAt: Date | null;

  // 轮换后替代当前 Token 的新 Token 哈希。
  replacedByHash: string | null;

  // 创建会话时的客户端 IP。
  ip: string | null;

  // 创建会话时的浏览器 User-Agent。
  userAgent: string | null;
}

// 定义写入 Express Request 的认证上下文。
export interface AuthContext {
  // 当前已经认证的用户。
  user: PublicUser;

  // 当前 Access Token 的唯一标识。
  tokenId: string;
}
