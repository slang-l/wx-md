import { createHash, randomBytes, randomUUID } from 'node:crypto';

import jwt, { type JwtPayload } from 'jsonwebtoken';

import type { AppConfig } from '../config.js';
import type { User, UserRole } from '../type/auth.js';

export interface AccessTokenClaims extends JwtPayload {
  type: 'access';
  sub: string;
  role: UserRole;
  jti: string;
}

export interface TokenService {
  signAccessToken(user: User): string;
  verifyAccessToken(token: string): AccessTokenClaims;
}

const USER_ROLES: readonly UserRole[] = ['user', 'admin'];

/**
 * Access Token 是短效 JWT。签发和验证放在同一个服务中，确保算法、签发者、
 * 接收方等约束始终一致，路由层不直接操作 jsonwebtoken。
 */
export function createTokenService(config: AppConfig): TokenService {
  return {
    signAccessToken(user) {
      return jwt.sign(
        {
          type: 'access',
          role: user.role,
        },
        config.jwtAccessSecret,
        {
          // 固定算法，避免验证端接受意料之外的算法。
          algorithm: 'HS256',
          subject: user.id,
          issuer: config.jwtIssuer,
          audience: config.jwtAudience,
          expiresIn: config.accessTokenTtl,
          jwtid: randomUUID(),
        },
      );
    },

    verifyAccessToken(token) {
      const payload = jwt.verify(token, config.jwtAccessSecret, {
        algorithms: ['HS256'],
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      });

      if (
        typeof payload === 'string' ||
        payload.type !== 'access' ||
        typeof payload.sub !== 'string' ||
        typeof payload.jti !== 'string' ||
        !USER_ROLES.includes(payload.role as UserRole)
      ) {
        throw new Error('INVALID_ACCESS_TOKEN');
      }

      return payload as AccessTokenClaims;
    },
  };
}

/** 生成 256 bit 随机 Refresh Token；它本身不是 JWT，也不携带用户信息。 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

/** 数据层只保存哈希值，数据库泄漏时原始 Refresh Token 仍不可直接使用。 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
