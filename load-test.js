/**
 * Phase 5 — Load Test with k6
 * Run:
 *   k6 run load-test.js --env BASE_URL=https://your-railway-backend.up.railway.app
 */

/* global __ENV, open */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '30s', target: 200 },
    { duration: '1m',  target: 1000 },
    { duration: '2m',  target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const recommendationDuration = new Trend('recommendation_duration');
const trendsDuration = new Trend('trends_duration');
const errorRate = new Rate('errors');

const TEST_TOKENS = JSON.parse(open('./test-tokens.json') || '[]');

function getToken() {
  if (TEST_TOKENS.length === 0) return 'fake-token-for-structure-test';
  return TEST_TOKENS[Math.floor(Math.random() * TEST_TOKENS.length)];
}

export default function () {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, { 'health: status 200': (r) => r.status === 200 });
    if (res.status !== 200) errorRate.add(1);
  }

  sleep(0.5);

  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v1/recommendations`, { headers });
    recommendationDuration.add(Date.now() - start);
    check(res, {
      'recommendations: status 200': (r) => r.status === 200,
      'recommendations: has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && Array.isArray(body.data);
        } catch {
          return false;
        }
      },
    });
    if (res.status !== 200) errorRate.add(1);
  }

  sleep(0.3);

  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v1/trends`, { headers });
    trendsDuration.add(Date.now() - start);
    check(res, { 'trends: status 200': (r) => r.status === 200 });
    if (res.status !== 200) errorRate.add(1);
  }

  sleep(0.3);

  {
    const res = http.get(`${BASE_URL}/api/v1/events?limit=20`, { headers });
    check(res, { 'events: status 200': (r) => r.status === 200 });
    if (res.status !== 200) errorRate.add(1);
  }

  sleep(1);
}