// ─── 1. ADD to server/src/config/queues.ts (EmailJobType enum) ───────────────
// Add these new job type values to the existing EmailJobType enum:
//
// export enum EmailJobType {
//   REGISTRATION_CONFIRMATION = 'registration_confirmation',
//   EVENT_REMINDER            = 'event_reminder',
//   EVENT_CANCELLATION        = 'event_cancellation',
//   CERTIFICATE               = 'certificate',
//   // ── Phase 4 additions ──
//   APPLICATION_STATUS        = 'application_status',
//   INTERVIEW_SCHEDULED       = 'interview_scheduled',
//   INTERVIEW_RESULT          = 'interview_result',
//   DAILY_DIGEST              = 'daily_digest',
// }

// ─── 2. ADD to server/src/index.ts ───────────────────────────────────────────
// Replace:  app.listen(PORT, ...)
// With:

import http from 'http';
import { initSocket } from './config/socket';
import phase4Routes from './routes/phase4Routes';
import './jobs/notificationWorker'; // registers Phase 4 email processors on startup
import './jobs/eventChatWorker';    // registers event chat archive queue on startup

// After all existing middleware/route registrations:
app.use('/api/v1', phase4Routes);

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server + WebSocket listening on port ${PORT}`);
});

// ─── 3. Install new dependencies ──────────────────────────────────────────────
// Server:  npm install socket.io
// Client:  npm install socket.io-client react-window
//          npm install -D @types/react-window