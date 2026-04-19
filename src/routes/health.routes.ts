// src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { getRedis } from '../config/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const startTime = Date.now();

  // DB check
  let dbStatus = 'ok';
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = 'error';
  }

  // Redis check
  let redisStatus = 'ok';
  let redisLatency = 0;
  try {
    const redisStart = Date.now();
    await getRedis().ping();
    redisLatency = Date.now() - redisStart;
  } catch {
    redisStatus = 'error';
  }

  const uptime = process.uptime();
  const totalLatency = Date.now() - startTime;
  const isHealthy = dbStatus === 'ok';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(uptime),
      latency_ms: totalLatency,
      services: {
        database: { status: dbStatus, latency_ms: dbLatency },
        redis: { status: redisStatus, latency_ms: redisLatency },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
