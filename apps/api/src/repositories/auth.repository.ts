import type { PublicUser, RefreshSession, User, UserRole } from '../type/auth.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role?: UserRole;
}

export interface CreateRefreshSessionInput {
  tokenHash: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
  ip: string | null;
  userAgent: string | null;
}

export type CreateInitialRefreshSessionInput = Omit<CreateRefreshSessionInput, 'userId'>;

/**
 * A rotated session inherits its user, family and absolute expiry from the
 * current session. Keeping those fields out of this input prevents callers
 * from accidentally moving a token between users/families or extending it.
 */
export type RotateRefreshSessionInput = Pick<
  CreateRefreshSessionInput,
  'tokenHash' | 'ip' | 'userAgent'
>;

/** The persistence contract used by the authentication service. */
export interface AuthRepository {
  /**
   * 创建或校正由系统启动流程管理的账号。该方法不创建登录会话，主要用于
   * development 环境的固定管理员；普通用户注册仍走事务化方法。
   */
  upsertSystemUser(input: CreateUserInput): Promise<User>;
  createUserWithRefreshSession(
    userInput: CreateUserInput,
    sessionInput: CreateInitialRefreshSessionInput,
  ): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
  createRefreshSession(input: CreateRefreshSessionInput): Promise<RefreshSession>;
  findRefreshSessionByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  revokeRefreshSession(tokenHash: string, replacedByHash?: string | null): Promise<void>;
  /** Revokes the complete session family containing the supplied token. */
  revokeRefreshFamilyByTokenHash(tokenHash: string): Promise<void>;
  revokeRefreshFamily(familyId: string): Promise<void>;

  /**
   * Atomically consumes an active, unexpired refresh session and inserts its
   * replacement. Returns false when the current token can no longer be used.
   */
  rotateRefreshSession(currentHash: string, nextInput: RotateRefreshSessionInput): Promise<boolean>;
}

/** Explicitly selects fields that are safe to expose to API consumers. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}
