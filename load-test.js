/**
 * Phase 5 — Load Test with k6
 * Target: 1,000 concurrent users, p95 API response < 200ms
 *
 * Run:
 *   k6 run load-test.js --env BASE_URL=https://your-railway-backend.up.railway.app
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '30s', target: 200 },    // Ramp up to 200 users
    { duration: '1m',  target: 1000 },   // Ramp up to 1,000 users
    { duration: '2m',  target: 1000 },   // Hold at 1,000 users
    { duration: '30s', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],     // 95th percentile < 200ms
    http_req_failed: ['rate<0.01'],       // Error rate < 1%
    checks: ['rate>0.99'],                // 99%+ checks must pass
  },
};

// ─── Custom Metrics ───────────────────────────────────────────────────────────

const recommendationDuration = new Trend('recommendation_duration');
const trendsDuration = new Trend('trends_duration');
const errorRate = new Rate('errors');

// ─── Shared State ─────────────────────────────────────────────────────────────

// Pre-generated tokens for load test users (generate these before the test)
// In a real setup, you would run a setup() step to register/login test users
const TEST_TOKENS: string[] = JSON.parse(open('./test-tokens.json') || '[]');

function getToken(): string {
  if (TEST_TOKENS.length === 0) return 'fake-token-for-structure-test';
  return TEST_TOKENS[Math.floor(Math.random() * TEST_TOKENS.length)];
}

// ─── Test Scenarios ───────────────────────────────────────────────────────────

export default function () {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1. Health check
  {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, { 'health: status 200': (r) => r.status === 200 });
    if (res.status !== 200) errorRate.add(1);
  }

  sleep(0.5);

  // 2. AI Recommendations
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v1/recommendations`, { headers });
    const duration = Date.now() - start;
    recommendationDuration.add(duration);

    check(res, {
      'recommendations: status 200': (r) => r.status === 200,
      'recommendations: has data': (r) => {
        try {
          const body = JSON.parse(r.body as string);
          return body.success === true && Array.isArray(body.data);
        } catch {
          return false;
        }
      },
    });
    if (res.status !== 200) errorRate.add(1);
  }

  sleep(0.3);

  // 3. Campus Trends
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v1/trends`, { headers });
    const duration = Date.now() - start;
    trendsDuration.add(duration);

    check(res, { 'trends: status 200': (r) => r.status === 200 });
    if (res.status !== 200) errorRate.add(1);
  }

  sleep(0.3);

  // 4. Events listing (cursor-based pagination)
  {
    const res = http.get(`${BASE_URL}/api/v1/events?limit=20`, { headers });
    check(res, { 'events: status 200': (r) => r.status === 200 });
    if (res.status !== 200) errorRate.add(1);
  }

  sleep(1);
}