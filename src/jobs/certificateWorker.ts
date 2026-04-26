// src/jobs/certificateWorker.ts
// Phase 3 — Bull queue worker: processes certificate generation after attendance

import { certificateQueue } from '../config/queues';
import { issueCertificate, CertificateJobPayload } from '../services/certificateService';

certificateQueue.process('generate-certificate', 5, async (job) => {
  const payload = job.data as CertificateJobPayload;
  console.log(`[certificateWorker] Generating certificate for user ${payload.userId}, event ${payload.eventId}`);

  try {
    await issueCertificate(payload);
    console.log(`[certificateWorker] Certificate issued: user=${payload.userId} event=${payload.eventId}`);
  } catch (err) {
    console.error(`[certificateWorker] Failed:`, err);
    throw err; // Bull will retry according to queue config
  }
});

certificateQueue.on('failed', (job, err) => {
  console.error(`[certificateWorker] Job ${job.id} failed after all retries:`, err.message);
});

export default certificateQueue;
