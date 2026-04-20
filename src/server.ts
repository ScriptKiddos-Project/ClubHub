// server/src/server.ts
// Entry point — starts the HTTP server.

import "dotenv/config";
import app from "./app";
import prisma from "./config/database";

const PORT = Number(process.env.PORT ?? 4000);

async function bootstrap() {
  try {
    // Test DB connection before accepting traffic
    await prisma.$connect();
    console.log("✅ Database connected");

    const server = app.listen(PORT, () => {
      console.log(`🚀 ClubHub API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV ?? "development"}`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("✅ DB disconnected. Process exiting.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // ── Unhandled rejections ──────────────────────────────────────────────────
    process.on("unhandledRejection", (reason) => {
      console.error("💥 Unhandled Rejection:", reason);
      // Don't exit in production — let health check detect and Railway restart
      if (process.env.NODE_ENV !== "production") process.exit(1);
    });
  } catch (err) {
    console.error("💥 Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
