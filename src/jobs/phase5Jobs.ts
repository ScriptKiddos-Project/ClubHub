import cron from 'node-cron';
import {
  progressAcademicYear,
  refreshAnalyticsMaterializedViews,
} from '../services/analyticsService';

/**
 * Phase 5 Cron Jobs
 * Import this file once in app.ts after all routes are mounted:
 *   import './jobs/phase5Jobs';
 */

// Refresh materialized views every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  try {
    await refreshAnalyticsMaterializedViews();
  } catch (err) {
    console.error('[CRON] Materialized view refresh failed:', err);
  }
});

// Academic year auto-progression: June 1st at midnight
cron.schedule('0 0 1 6 *', async () => {
  try {
    await progressAcademicYear();
  } catch (err) {
    console.error('[CRON] Academic year progression failed:', err);
  }
});

console.log('[Phase 5] Cron jobs registered: materialized view refresh (15min), academic year progression (June 1)');