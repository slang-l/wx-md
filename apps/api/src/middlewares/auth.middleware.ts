import type { RequestHandler } from 'express';

import { AppError } from '../errors.js';
import { toPublicUser, type AuthRepository } from '../repositories/auth.repository.js';
import type { TokenService } from '../services/token.service.js';

/** 验证 Authorization: Bearer <JWT>，并把当前用户写入 request.auth。 */
export function createRequireAuth(
  tokenService: TokenService,
  repository: AuthRepository,
): RequestHandler {
  return async (request, _response, next) => {
    const authorization = request.get('authorization');
    const match = /^Bearer\s+([^\s]+)$/i.exec(authorization ?? '');

    if (!match) {
      next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required'));
      return;
    }

    let claims;
    try {
      claims = tokenService.verifyAccessToken(match[1]);
    } catch {
      next(new AppError(401, 'INVALID_ACCESS_TOKEN', 'Invalid or expired access token'));
      return;
    }

    try {
      const user = await repository.findUserById(claims.sub);

      // JWT 未过期也不能绕过最新的用户禁用状态。
      if (!user || user.status !== 'active') {
        next(new AppError(401, 'INVALID_ACCESS_TOKEN', 'Invalid or expired access token'));
        return;
      }

      request.auth = {
        user: toPublicUser(user),
        tokenId: claims.jti,
      };
      next();
    } catch (error) {
      // Repository failures are operational errors and must remain 5xx.
      next(error);
    }
  };
}
