// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import routes from './routes/index';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';
import prisma from './config/database';
import { connectRedis } from './config/redis';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ── Security Headers ───────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ── CORS ───────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Compression ────────────────────────────────────────────────────────────────
app.use(compression());

// ── Logging ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Global Rate Limiter ────────────────────────────────────────────────────────
app.use(generalRateLimiter);

// ── Trust Proxy (Railway/Vercel) ───────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/', routes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler ────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ──────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    await connectRedis();

    app.listen(PORT, () => {
      console.log(`\n🚀 ClubHub API running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// ── Graceful Shutdown ──────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();

export default app;
