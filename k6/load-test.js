import http from 'k6/http';
import { check } from 'k6';

const servers = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

export const options = {
  scenarios: {
    deductStockScenario: {
      executor: 'per-vu-iterations',
      vus: 350, // 가상 333명
      iterations: 1, // 각자 1회씩
      maxDuration: '30s', // 최대 실행시간
    },
  },
};

export default function () {
  const requests = servers.map((baseUrl) => ({
    method: 'POST',
    url: `${baseUrl}/product/4/deduct`,
    body: JSON.stringify({ quantity: 1 }),
    params: {
      headers: { 'Content-Type': 'application/json' },
    },
  }));

  // http.batch()로 요청 동시에 보낼 수 있음
  const responses = http.batch(requests);

  responses.forEach((res) => {
    check(res, {
      'is status 201': (r) => r.status === 201,
    });
  });
}
