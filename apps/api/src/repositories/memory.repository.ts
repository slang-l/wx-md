import { randomUUID } from 'node:crypto';

import type { RefreshSession, User } from '../type/auth.js';
import type {
  AuthRepository,
  CreateInitialRefreshSessionInput,
  CreateRefreshSessionInput,
  CreateUserInput,
} from './auth.repository.js';

export type {
  AuthRepository,
  CreateInitialRefreshSessionInput,
  CreateRefreshSessionInput,
  CreateUserInput,
  RotateRefreshSessionInput,
} from './auth.repository.js';

/**
 * Test adapter backed by isolated maps. Each buildApp call can receive a fresh
 * instance, so tests do not share users or sessions.
 */
export function createMemoryAuthRepository(): AuthRepository {
  const users = new Map<string, User>();
  const userIdByEmail = new Map<string, string>();
  // 只保存 Refresh Token 的 SHA-256 哈希，不保存可直接登录的原始 Token。
  const refreshSessions = new Map<string, RefreshSession>();

  function buildUser(input: CreateUserInput): User {
    const email = input.email.toLowerCase().trim();
    const now = new Date();

    return {
      id: randomUUID(),
      email,
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      role: input.role ?? 'user',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
  }

  function buildRefreshSession(
    input: CreateRefreshSessionInput | CreateInitialRefreshSessionInput,
    userId: string,
  ): RefreshSession {
    return {
      id: randomUUID(),
      tokenHash: input.tokenHash,
      userId,
      familyId: input.familyId,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedByHash: null,
      ip: input.ip,
      userAgent: input.userAgent,
    };
  }

  function assertRefreshTokenDoesNotExist(tokenHash: string): void {
    if (refreshSessions.has(tokenHash)) {
      throw new Error('REFRESH_TOKEN_ALREADY_EXISTS');
    }
  }

  return {
    async upsertSystemUser(input) {
      const email = input.email.toLowerCase().trim();
      const existingId = userIdByEmail.get(email);
      const existing = existingId ? users.get(existingId) : undefined;

      if (existing) {
        existing.name = input.name.trim();
        existing.passwordHash = input.passwordHash;
        existing.role = input.role ?? 'user';
        existing.status = 'active';
        existing.updatedAt = new Date();
        return existing;
      }

      const user = buildUser(input);
      users.set(user.id, user);
      userIdByEmail.set(user.email, user.id);
      return user;
    },

    async createUserWithRefreshSession(userInput, sessionInput) {
      const user = buildUser(userInput);

      if (userIdByEmail.has(user.email)) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      assertRefreshTokenDoesNotExist(sessionInput.tokenHash);
      const session = buildRefreshSession(sessionInput, user.id);

      users.set(user.id, user);
      userIdByEmail.set(user.email, user.id);
      refreshSessions.set(session.tokenHash, session);
      return user;
    },

    async findUserByEmail(email) {
      const userId = userIdByEmail.get(email.toLowerCase().trim());
      return userId ? users.get(userId) ?? null : null;
    },

    async findUserById(userId) {
      return users.get(userId) ?? null;
    },

    async createRefreshSession(input) {
      assertRefreshTokenDoesNotExist(input.tokenHash);
      const session = buildRefreshSession(input, input.userId);

      refreshSessions.set(input.tokenHash, session);
      return session;
    },

    async findRefreshSessionByTokenHash(tokenHash) {
      return refreshSessions.get(tokenHash) ?? null;
    },

    async revokeRefreshSession(tokenHash, replacedByHash = null) {
      const session = refreshSessions.get(tokenHash);

      if (!session || session.revokedAt) {
        return;
      }

      session.revokedAt = new Date();
      session.replacedByHash = replacedByHash;
    },

    async revokeRefreshFamilyByTokenHash(tokenHash) {
      const session = refreshSessions.get(tokenHash);
      if (!session) return;

      const revokedAt = new Date();
      for (const candidate of refreshSessions.values()) {
        if (candidate.familyId === session.familyId && !candidate.revokedAt) {
          candidate.revokedAt = revokedAt;
        }
      }
    },

    async revokeRefreshFamily(familyId) {
      const revokedAt = new Date();

      for (const session of refreshSessions.values()) {
        if (session.familyId === familyId && !session.revokedAt) {
          session.revokedAt = revokedAt;
        }
      }
    },

    async rotateRefreshSession(currentHash, nextInput) {
      const currentSession = refreshSessions.get(currentHash);

      if (
        !currentSession ||
        currentSession.revokedAt ||
        currentSession.expiresAt.getTime() <= Date.now()
      ) {
        return false;
      }

      assertRefreshTokenDoesNotExist(nextInput.tokenHash);
      const nextSession = buildRefreshSession(
        {
          tokenHash: nextInput.tokenHash,
          userId: currentSession.userId,
          familyId: currentSession.familyId,
          // A family has an absolute lifetime; rotation never extends it.
          expiresAt: currentSession.expiresAt,
          ip: nextInput.ip,
          userAgent: nextInput.userAgent,
        },
        currentSession.userId,
      );

      currentSession.revokedAt = new Date();
      currentSession.replacedByHash = nextInput.tokenHash;
      refreshSessions.set(nextSession.tokenHash, nextSession);
      return true;
    },
  };
}
