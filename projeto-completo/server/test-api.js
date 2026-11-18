import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from './db.js';
import { createApiServer } from './index.js';

const tmpDbPath = path.join(os.tmpdir(), `family-place-test-${Date.now()}.db`);
const db = openDatabase(tmpDbPath);
const server = createApiServer(db);

await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();
const baseUrl = `http://localhost:${port}`;

async function api(route, options = {}) {
  const res = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

try {
  // 1. Health & Seeded places
  const health = await api('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.database, 'sqlite');
  assert.equal(health.data.places, 15);

  // 2. Demo login & Register with scrypt + LGPD
  const demoClient = await api('/api/auth/demo', {
    method: 'POST',
    body: JSON.stringify({ role: 'client' }),
  });
  assert.equal(demoClient.status, 200);
  const clientToken = demoClient.data.token;

  const demoBiz = await api('/api/auth/demo', {
    method: 'POST',
    body: JSON.stringify({ role: 'business' }),
  });
  assert.equal(demoBiz.status, 200);
  const bizToken = demoBiz.data.token;

  // 3. Combined filter search (RF001)
  const filtered = await api('/api/places?tags=Espaço+Kids,Área+Pet+Coberta');
  assert.equal(filtered.status, 200);
  assert.ok(filtered.data.places.length > 0);
  assert.ok(filtered.data.places.every((p) => p.tags.includes('Espaço Kids') && p.tags.includes('Área Pet Coberta')));

  // 4. Review upsert / uniqueness RD003
  const rev1 = await api('/api/places/local-2/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({
      scores: { kids: 5, accessibility: 4, pet: 5, service: 5 },
      comment: 'Primeira avaliação SQLite',
    }),
  });
  assert.equal(rev1.status, 200);
  const countAfterFirst = rev1.data.place.reviews.length;

  const rev2 = await api('/api/places/local-2/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({
      scores: { kids: 4, accessibility: 4, pet: 5, service: 4 },
      comment: 'Avaliação atualizada sem duplicar',
    }),
  });
  assert.equal(rev2.status, 200);
  assert.equal(rev2.data.place.reviews.length, countAfterFirst);

  // 5. Follow toggle (RF010)
  const fol = await api('/api/places/local-3/follow', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.equal(fol.status, 200);
  assert.equal(fol.data.isFollowing, true);

  // 6. Timeline validation 280 chars (RF011 + RD004)
  const badPost = await api('/api/timeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: JSON.stringify({
      placeId: 'local-1',
      content: 'a'.repeat(281),
      imageUrl: 'data:image/svg+xml;utf8,<svg/>',
      category: 'Evento',
    }),
  });
  assert.equal(badPost.status, 400);

  const okPost = await api('/api/timeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: JSON.stringify({
      placeId: 'local-1',
      content: 'Oficina infantil inclusiva amanhã às 10h!',
      imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"/>',
      category: 'Evento',
    }),
  });
  assert.equal(okPost.status, 201);

  // 7. Coupons: redeem valid and block expired (RF012 + RD004)
  const coupons = await api('/api/coupons', {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const activeCoupon = coupons.data.coupons.find((c) => !c.expired);
  const expiredCoupon = coupons.data.coupons.find((c) => c.expired);
  assert.ok(activeCoupon && expiredCoupon);

  const redeemOk = await api(`/api/coupons/${activeCoupon.id}/redeem`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.equal(redeemOk.status, 200);

  const redeemExpired = await api(`/api/coupons/${expiredCoupon.id}/redeem`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert.equal(redeemExpired.status, 400);

  // 8. Assistant recommendation (RF013) & Structure report (RF014)
  const assist = await api('/api/assistant/recommend', {
    method: 'POST',
    body: JSON.stringify({ message: 'Onde almoçar hoje com criança pequena e cachorro?' }),
  });
  assert.equal(assist.status, 200);
  assert.ok(assist.data.recommendations.length > 0);

  const report = await api('/api/places/local-1/reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ reason: 'Horário alterado', details: 'Fecha às 20h aos domingos.' }),
  });
  assert.equal(report.status, 201);
  assert.equal(report.data.report.status, 'Em verificação');

  console.log('ALL SQLITE API INTEGRATION TESTS PASSED!');
} finally {
  server.close();
  db.close();
  if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
}
