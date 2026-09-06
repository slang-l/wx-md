import { Buffer } from 'node:buffer';

import {
  Router,
  type CookieOptions,
  type Request,
  type RequestHandler,
} from 'express';
import { z } from 'zod';

import type { AppConfig } from '../config.js';
import { AppError } from '../errors.js';
import type { AuthService, SessionMetadata } from '../services/auth.service.js';

export const REFRESH_COOKIE_NAME = 'wxmd_refresh_token';

const emailSchema = z
  .string()
  .trim()
  .max(254)
  .email()
  .transform((email) => email.toLowerCase());

const passwordBytesSchema = z
  .string()
  .max(128)
  .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
    message: 'Password must not exceed 72 UTF-8 bytes',
  });

// 新用户仍须使用至少 8 位密码；登录只验证输入是否可供 bcrypt 比较，
// 以兼容开发管理员等已经存在的账号。
const registrationPasswordSchema = passwordBytesSchema.min(8);
const loginPasswordSchema = passwordBytesSchema.min(1);

const registerSchema = z
  .object({
    email: emailSchema,
    password: registrationPasswordSchema,
    verificationCode: z.string().trim().regex(/^\d{6}$/),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

const registrationVerificationSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

const loginSchema = z
  .object({
    email: emailSchema,
    password: loginPasswordSchema,
  })
  .strict();

export interface CreateAuthRouterOptions {
  config: AppConfig;
  authService: AuthService;
  requireAuth: RequestHandler;
}

/**
 * CORS 只决定浏览器能否读取响应，不能阻止服务端执行请求。认证接口会写入或
 * 使用 Cookie，因此还要主动拒绝来自非白名单网页的写请求。没有浏览器来源头
 * 的 CLI/服务间调用仍被允许；浏览器明确标记为 cross-site 时则直接拒绝。
 */
export function createVerifyRequestOrigin(config: AppConfig): RequestHandler {
  const allowedOrigins = new Set(config.corsOrigins);

  return (request, _response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      next();
      return;
    }

    const origin = request.get('origin');
    const fetchSite = request.get('sec-fetch-site')?.toLowerCase();

    if (
      (origin !== undefined && !allowedOrigins.has(origin)) ||
      (origin === undefined && fetchSite === 'cross-site')
    ) {
      next(new AppError(403, 'UNTRUSTED_ORIGIN', 'Request origin is not allowed'));
      return;
    }

    next();
  };
}

function parseRequestBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError(400, 'INVALID_REQUEST', 'Invalid request body');
  }

  return result.data;
}

function getSessionMetadata(request: Request): SessionMetadata {
  return {
    ip: request.ip || request.socket.remoteAddress || null,
    userAgent: request.get('user-agent')?.slice(0, 1_000) ?? null,
  };
}

function getRefreshToken(request: Request): string | null {
  const value = request.cookies?.[REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function refreshCookieOptions(config: AppConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  };
}

export function createAuthRouter({
  config,
  authService,
  requireAuth,
}: CreateAuthRouterOptions): Router {
  const router = Router();
  const cookieOptions = refreshCookieOptions(config);

  router.use((_request, response, next) => {
    response.setHeader('cache-control', 'no-store');
    response.setHeader('pragma', 'no-cache');
    next();
  });
  router.use(createVerifyRequestOrigin(config));

  router.post('/register/verification-code', async (request, response) => {
    const input = parseRequestBody(registrationVerificationSchema, request.body);
    const result = await authService.requestRegistrationVerificationCode(input.email);

    response.status(201).json(result);
  });

  router.post('/register', async (request, response) => {
    const input = parseRequestBody(registerSchema, request.body);
    const result = await authService.register(input, getSessionMetadata(request));

    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...cookieOptions,
      expires: result.refreshExpiresAt,
    });
    response.status(201).json({ accessToken: result.accessToken, user: result.user });
  });

  router.post('/login', async (request, response) => {
    const input = parseRequestBody(loginSchema, request.body);
    const result = await authService.login(input, getSessionMetadata(request));

    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...cookieOptions,
      expires: result.refreshExpiresAt,
    });
    response.json({ accessToken: result.accessToken, user: result.user });
  });

  router.post('/refresh', async (request, response) => {
    const refreshToken = getRefreshToken(request);

    if (!refreshToken) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }

    const result = await authService.refresh(refreshToken, getSessionMetadata(request));

    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...cookieOptions,
      expires: result.refreshExpiresAt,
    });
    response.json({ accessToken: result.accessToken, user: result.user });
  });

  router.post('/logout', async (request, response) => {
    const refreshToken = getRefreshToken(request);
    response.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    await authService.logout(refreshToken);
    response.status(204).end();
  });

  router.get('/me', requireAuth, (request, response) => {
    if (!request.auth) {
      throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required');
    }

    response.json({ user: request.auth.user });
  });

  return router;
}
