import Bull from 'bull';
import { archiveEventRoom } from '../services/chatService';

// Separate queue just for event chat archiving (not mixed with emailQueue)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const eventChatQueue = new Bull('eventChatQueue', redisUrl);

/**
 * Call this when an event ends to schedule chat room archival 48hr later.
 */
export const scheduleEventChatArchive = async (eventId: string, eventEndTime: Date) => {
  const delay = eventEndTime.getTime() + 48 * 60 * 60 * 1000 - Date.now();

  if (delay <= 0) {
    // Event already ended more than 48hr ago — archive immediately
    await archiveEventRoom(eventId);
    return;
  }

  await eventChatQueue.add({ eventId }, { delay, removeOnComplete: true });
};

eventChatQueue.process(async (job) => {
  const { eventId } = job.data;
  await archiveEventRoom(eventId);
  console.log(`[EventChatWorker] ✅ Chat room archived for event ${eventId}`);
});

eventChatQueue.on('failed', (job, err) => {
  console.error(`[EventChatWorker] Job ${job.id} FAILED:`, err.message);
});

console.log('[EventChatWorker] Worker started');