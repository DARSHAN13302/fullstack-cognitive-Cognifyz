// Run with k6: k6 run tests/k6_load_benchmark.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 10, duration: '15s', thresholds: { http_req_duration: ['p(95)<250'] } };

export default function () {
  const res = http.get('http://localhost:3008/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.5);
}
