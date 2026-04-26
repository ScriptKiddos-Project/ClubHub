import cron from 'node-cron';
import { runNightlyRankingJob } from '../services/rankingService';
import { AppError } from '../utils/AppError';

// ─────────────────────────────────────────────────────────────────────────────
// Nightly ranking cron — runs every day at 00:05 server time
// Add to main server startup: import './jobs/rankingCron';
// ─────────────────────────────────────────────────────────────────────────────

let isRunning = false;

export function startRankingCron(): void {
  // '5 0 * * *' = 00:05 every night
  cron.schedule('5 0 * * *', async () => {
    if (isRunning) {
      console.warn('[RankingCron] Previous job still running — skipping this cycle.');
      return;
    }
    isRunning = true;
    const start = Date.now();
    try {
      await runNightlyRankingJob();
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`[RankingCron] Completed in ${elapsed}s`);
    } catch (err) {
      console.error('[RankingCron] Job failed:', err);
    } finally {
      isRunning = false;
    }
  });

  console.log('[RankingCron] Scheduler registered — runs nightly at 00:05');
}

// ── Manual trigger endpoint (admin only) — add to admin router if needed ─────
// POST /api/v1/admin/run-ranking-job
export async function triggerRankingJobManually() {
  if (isRunning) throw new AppError('Ranking job already running', 409, 'RANKING_JOB_RUNNING');
  isRunning = true;
  try {
    await runNightlyRankingJob();
    return { success: true };
  } finally {
    isRunning = false;
  }
}
