// Load test for the main API (k6, https://k6.io). Read-only: it never creates or changes data.
//
// Run it against a STAGING copy only — never production and never the shared dev database.
// See loadtest/README.md. Example:
//   k6 run -e BASE_URL=http://localhost:5001 -e JOB_ID=<open job id> \
//          -e CANDIDATE_TOKEN=<jwt> -e RECRUITER_TOKEN=<jwt> loadtest/k6-api.js
//
// Each scenario runs only when its inputs are given (JOB_ID, CANDIDATE_TOKEN, RECRUITER_TOKEN).
// VUS (default 50) and HOLD (default 3m) set the load; the test ramps up for 1 minute first.

import http from 'k6/http';
import { check, fail, sleep } from 'k6';

const BASE_URL = String(__ENV.BASE_URL || '').replace(/\/+$/, '');
const VUS = parseInt(__ENV.VUS || '50', 10);
const HOLD = __ENV.HOLD || '3m';
// Hosts this script refuses to load-test (production and the shared dev API).
const REFUSED_HOSTS = ['backend.aligngrad.com', 'devapi.aligngrad.com', 'adminbackend.aligngrad.com'];

const stages = [
  { duration: '1m', target: VUS },
  { duration: HOLD, target: VUS },
  { duration: '30s', target: 0 }
];
const scenario = (exec) => ({ executor: 'ramping-vus', startVUs: 0, stages, exec });

const scenarios = { health: scenario('health') };
if (__ENV.JOB_ID) scenarios.publicJob = scenario('publicJob');
if (__ENV.CANDIDATE_TOKEN) scenarios.candidateJobs = scenario('candidateJobs');
if (__ENV.RECRUITER_TOKEN) scenarios.recruiterCount = scenario('recruiterCount');

export const options = {
  scenarios,
  // Targets from all_mds/systemdesign.md §4.8.
  thresholds: {
    http_req_failed: ['rate<0.005'],
    'http_req_duration{kind:read}': ['p(95)<300']
  }
};

export function setup() {
  if (!BASE_URL) fail('Set BASE_URL to the staging API, e.g. -e BASE_URL=http://localhost:5001');
  const host = BASE_URL.replace(/^https?:\/\//, '').split(/[/:]/)[0].toLowerCase();
  if (REFUSED_HOSTS.includes(host)) fail(`Refusing to load-test ${host}: use a staging copy.`);
}

const read = { tags: { kind: 'read' } };
const withToken = (token) => ({ ...read, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });

export function health() {
  const res = http.get(`${BASE_URL}/health`, read);
  check(res, { 'health 200': (r) => r.status === 200 });
  sleep(1);
}

export function publicJob() {
  const res = http.get(`${BASE_URL}/api/student/jobs/${__ENV.JOB_ID}/public`, read);
  check(res, { 'public job 200': (r) => r.status === 200 });
  sleep(1);
}

export function candidateJobs() {
  const res = http.get(`${BASE_URL}/api/student/jobs`, withToken(__ENV.CANDIDATE_TOKEN));
  check(res, { 'job list 200': (r) => r.status === 200 });
  sleep(2);
}

export function recruiterCount() {
  const body = JSON.stringify({ requirements: [{ skillName: 'Python', minRating: 5 }, { skillName: 'SQL', minRating: 4 }] });
  const res = http.post(`${BASE_URL}/api/recruiter/jobs/eligible-count`, body, withToken(__ENV.RECRUITER_TOKEN));
  check(res, { 'candidate count 200': (r) => r.status === 200 });
  sleep(2);
}
