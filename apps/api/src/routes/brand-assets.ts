import { Router, type Request, type RequestHandler } from 'express';
import { z } from 'zod';

import type { AppConfig } from '../config.js';
import { AppError } from '../errors.js';
import type { BrandAssetService } from '../services/brand-asset.service.js';
import { brandAssetCategories } from '../type/brand-asset.js';
import { createVerifyRequestOrigin } from './auth.js';

const assetIdSchema = z.string().uuid();
const tagsSchema = z.array(z.string().trim().min(1).max(20)).max(8)
  .transform((tags) => [...new Set(tags.map((tag) => tag.toLocaleLowerCase()))]);
const metadataSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(brandAssetCategories),
  tags: tagsSchema,
}).strict();
const createAssetSchema = metadataSchema.extend({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif']),
  data: z.string().min(4).max(2_100_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
}).strict();

interface CreateBrandAssetRouterOptions {
  config: AppConfig;
  requireAuth: RequestHandler;
  service: BrandAssetService;
}

export function createBrandAssetRouter({
  config,
  requireAuth,
  service,
}: CreateBrandAssetRouterOptions): Router {
  const router = Router();

  router.use((_request, response, next) => {
    response.setHeader('cache-control', 'no-store');
    response.setHeader('pragma', 'no-cache');
    next();
  });
  router.use(createVerifyRequestOrigin(config));
  router.use(requireAuth);

  router.get('/', async (request, response) => {
    response.json(await service.list(getAuthenticatedUserId(request)));
  });

  router.post('/', async (request, response) => {
    const input = parseRequestBody(createAssetSchema, request.body);
    response.status(201).json(await service.create(getAuthenticatedUserId(request), input));
  });

  router.put('/:assetId', async (request, response) => {
    const assetId = parseAssetId(request.params.assetId);
    const input = parseRequestBody(metadataSchema, request.body);
    response.json(await service.update(getAuthenticatedUserId(request), assetId, input));
  });

  router.delete('/:assetId', async (request, response) => {
    const assetId = parseAssetId(request.params.assetId);
    await service.delete(getAuthenticatedUserId(request), assetId);
    response.status(204).end();
  });

  return router;
}

function getAuthenticatedUserId(request: Request): string {
  if (!request.auth) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required');
  }
  return request.auth.user.id;
}

function parseAssetId(value: string): string {
  const result = assetIdSchema.safeParse(value);
  if (!result.success) throw new AppError(400, 'INVALID_REQUEST', 'Invalid brand asset ID');
  return result.data;
}

function parseRequestBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new AppError(400, 'INVALID_REQUEST', 'Invalid request body');
  return result.data;
}

