import { Router } from 'express';

export interface HealthResponse {
  status: 'ok';
  service: 'wx-md-api';
  timestamp: string;
  uptime: number;
}

export const healthRouter = Router();

healthRouter.get('/health', (_request, response) => {
  const body: HealthResponse = {
    status: 'ok',
    service: 'wx-md-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  response.json(body);
});
