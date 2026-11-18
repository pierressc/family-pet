import http from 'node:http';
import { getBearerUser, hashPassword, signToken, verifyPassword } from './auth.js';
import { listPlacesFull, openDatabase } from './db.js';

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

function buildUserResponse(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

function recommendPlacesFromQuery(places, message) {
  const text = String(message || '').toLowerCase();
  const intentRules = [
    {
      keywords: ['criança', 'crianca', 'filho', 'filha', 'bebê', 'bebe', 'kids', 'trocador', 'brinquedo', 'recreação'],
      tags: ['Espaço Kids', 'Trocador', 'Cadeirão', 'Monitoria'],
      pillar: 'kids',
      reason: 'Estrutura Infantil (Kids)',
    },
    {
      keywords: ['cachorro', 'cão', 'cao', 'pet', 'gato', 'animal', 'bicho', 'porte grande', 'porte médio'],
      tags: ['Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio', 'Aceita Porte Grande'],
      pillar: 'pet',
      reason: 'Receptividade Pet',
    },
    {
      keywords: ['idoso', 'idosa', 'avô', 'avo', 'avó', 'silencioso', 'calmo', 'ruído', 'ruido', 'cadeirante', 'pcd', 'rampa', 'acessível', 'acessivel', 'banheiro'],
      tags: ['Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Cardápio Acessível'],
      pillar: 'accessibility',
      reason: 'Acessibilidade e Conforto (PCD/Idosos)',
    },
    {
      keywords: ['café', 'cafe', 'brunch', 'lanche', 'padaria'],
      category: 'Café & Padaria',
      reason: 'Categoria Café & Padaria',
    },
    {
      keywords: ['almoço', 'almoco', 'jantar', 'restaurante', 'pizza', 'massa', 'comer'],
      categories: ['Restaurante', 'Bistrô'],
      reason: 'Restaurante / Bistrô',
    },
    {
      keywords: ['parque', 'ar livre', 'piquenique', 'lazer'],
      category: 'Parque & Lazer',
      reason: 'Parque & Lazer',
    },
    {
      keywords: ['sorvete', 'gelato', 'doce', 'sobremesa'],
      category: 'Sorveteria',
      reason: 'Sorveteria',
    },
  ];

  const matchedIntents = intentRules.filter((rule) =>
    rule.keywords.some((kw) => text.includes(kw))
  );

  const scored = places.map((place) => {
    let score = 0;
    const matchedReasons = [];

    for (const rule of matchedIntents) {
      if (rule.tags) {
        const tagHits = rule.tags.filter((t) => place.tags.includes(t));
        if (tagHits.length > 0) {
          score += tagHits.length * 3 + (place.averages?.[rule.pillar] || 0);
          matchedReasons.push(`${rule.reason}: ${tagHits.slice(0, 2).join(', ')}`);
        }
      }
      if (rule.category && place.category === rule.category) {
        score += 4;
        matchedReasons.push(rule.reason);
      }
      if (rule.categories && rule.categories.includes(place.category)) {
        score += 4;
        matchedReasons.push(rule.reason);
      }
    }

    if (matchedIntents.length === 0) {
      const avgSum =
        (place.averages.kids + place.averages.accessibility + place.averages.pet + place.averages.service) / 4;
      score = avgSum;
      matchedReasons.push('Bem avaliado nos 4 pilares da comunidade');
    }

    return {
      place,
      score,
      matchedReasons: [...new Set(matchedReasons)],
    };
  });

  const top = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    reply:
      matchedIntents.length > 0
        ? `Encontrei ${top.length} opções alinhadas ao que você descreveu:`
        : 'Não identifiquei critérios específicos na frase; aqui estão os 5 locais mais bem avaliados no geral:',
    recommendations: top.map((item) => ({
      id: item.place.id,
      name: item.place.name,
      category: item.place.category,
      neighborhood: item.place.neighborhood,
      averages: item.place.averages,
      reasons: item.matchedReasons,
    })),
  };
}

export function createApiServer(db) {
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      });
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    const authUser = getBearerUser(req);

    try {
      // Health
      if (req.method === 'GET' && pathname === '/api/health') {
        const count = db.prepare('SELECT COUNT(*) AS places FROM places').get().places;
        return sendJson(res, 200, { ok: true, database: 'sqlite', places: count });
      }

      // Auth: Register
      if (req.method === 'POST' && pathname === '/api/auth/register') {
        const body = await readBody(req);
        if (!body) return sendJson(res, 400, { error: 'JSON inválido.' });
        const { name, email, password, role = 'client', lgpdAccepted } = body;
        if (!name?.trim() || !email?.trim() || !password || String(password).length < 6) {
          return sendJson(res, 400, { error: 'Informe nome, e-mail válido e senha com no mínimo 6 caracteres.' });
        }
        if (!lgpdAccepted) {
          return sendJson(res, 400, { error: 'Aceite o termo de consentimento LGPD para prosseguir (RD001).' });
        }
        if (!['client', 'business'].includes(role)) {
          return sendJson(res, 400, { error: 'Perfil inválido.' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
        if (existing) {
          return sendJson(res, 409, { error: 'Já existe uma conta cadastrada com este e-mail.' });
        }
        const hashed = hashPassword(password);
        const result = db
          .prepare('INSERT INTO users (name, email, password_hash, role, lgpd_accepted) VALUES (?, ?, ?, ?, 1)')
          .run(name.trim(), normalizedEmail, hashed, role);
        const userRow = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);
        return sendJson(res, 201, {
          user: buildUserResponse(userRow),
          token: signToken(buildUserResponse(userRow)),
        });
      }

      // Auth: Login
      if (req.method === 'POST' && pathname === '/api/auth/login') {
        const body = await readBody(req);
        if (!body) return sendJson(res, 400, { error: 'JSON inválido.' });
        const normalizedEmail = String(body.email || '').trim().toLowerCase();
        const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
        if (!userRow || !verifyPassword(body.password || '', userRow.password_hash)) {
          return sendJson(res, 401, { error: 'E-mail ou senha incorretos.' });
        }
        const user = buildUserResponse(userRow);
        return sendJson(res, 200, { user, token: signToken(user) });
      }

      // Auth: Demo Quick Login
      if (req.method === 'POST' && pathname === '/api/auth/demo') {
        const body = await readBody(req);
        const targetEmail = body?.role === 'business' ? 'varanda@familyplace.local' : 'camila@demo.local';
        const userRow = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(targetEmail);
        if (!userRow) return sendJson(res, 404, { error: 'Conta demo não encontrada.' });
        const user = buildUserResponse(userRow);
        return sendJson(res, 200, { user, token: signToken(user) });
      }

      // Auth: Me
      if (req.method === 'GET' && pathname === '/api/auth/me') {
        if (!authUser) return sendJson(res, 401, { error: 'Não autenticado.' });
        return sendJson(res, 200, { user: authUser });
      }

      // Places: List with combined filters
      if (req.method === 'GET' && pathname === '/api/places') {
        const q = url.searchParams.get('q') || '';
        const category = url.searchParams.get('category') || 'Todas';
        const tagsParam = url.searchParams.get('tags') || '';
        const sort = url.searchParams.get('sort') || 'relevance';
        const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : [];
        const places = listPlacesFull(db, {
          currentUserId: authUser?.id || null,
          q,
          category,
          tags,
          sort,
        });
        return sendJson(res, 200, { places });
      }

      // Places: Create (Business only)
      if (req.method === 'POST' && pathname === '/api/places') {
        if (!authUser || authUser.role !== 'business') {
          return sendJson(res, 403, { error: 'Acesso restrito ao perfil Estabelecimento.' });
        }
        const body = await readBody(req);
        if (!body?.name?.trim() || !body?.category?.trim() || !body?.neighborhood?.trim()) {
          return sendJson(res, 400, { error: 'Nome, categoria e bairro são obrigatórios.' });
        }
        const id = `local-${Date.now()}`;
        db.prepare(
          'INSERT INTO places (id, owner_id, name, category, neighborhood, address, hours, whatsapp, website, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          id,
          authUser.id,
          body.name.trim(),
          body.category.trim(),
          body.neighborhood.trim(),
          body.address?.trim() || `${body.neighborhood.trim()}`,
          body.hours?.trim() || 'Seg a Sáb · 09h às 20h',
          body.whatsapp?.trim() || '5511999990000',
          body.website?.trim() || 'https://exemplo.org',
          body.description?.trim() || ''
        );
        const insTag = db.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag) VALUES (?, ?)');
        for (const tag of body.tags || []) insTag.run(id, tag);
        const insShow = db.prepare('INSERT INTO showcase_items (place_id, name, note, is_favorite) VALUES (?, ?, ?, ?)');
        for (const item of body.showcase || []) {
          insShow.run(id, item.name, item.note || '', item.favorite ? 1 : 0);
        }
        const created = listPlacesFull(db, { currentUserId: authUser.id }).find((p) => p.id === id);
        return sendJson(res, 201, { place: created });
      }

      // Places: Update (Business only)
      const placeMatch = pathname.match(/^\/api\/places\/([^/]+)$/);
      if (req.method === 'PUT' && placeMatch) {
        if (!authUser || authUser.role !== 'business') {
          return sendJson(res, 403, { error: 'Acesso restrito ao perfil Estabelecimento.' });
        }
        const placeId = decodeURIComponent(placeMatch[1]);
        const existing = db.prepare('SELECT * FROM places WHERE id = ?').get(placeId);
        if (!existing) return sendJson(res, 404, { error: 'Estabelecimento não encontrado.' });

        const body = await readBody(req);
        db.prepare(
          'UPDATE places SET name = ?, category = ?, neighborhood = ?, address = ?, hours = ?, whatsapp = ?, website = ?, description = ? WHERE id = ?'
        ).run(
          body.name?.trim() || existing.name,
          body.category?.trim() || existing.category,
          body.neighborhood?.trim() || existing.neighborhood,
          body.address?.trim() || existing.address,
          body.hours?.trim() || existing.hours,
          body.whatsapp?.trim() || existing.whatsapp,
          body.website?.trim() || existing.website,
          body.description?.trim() ?? existing.description,
          placeId
        );

        if (Array.isArray(body.tags)) {
          db.prepare('DELETE FROM place_tags WHERE place_id = ?').run(placeId);
          const insTag = db.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag) VALUES (?, ?)');
          for (const tag of body.tags) insTag.run(placeId, tag);
        }

        if (Array.isArray(body.showcase)) {
          db.prepare('DELETE FROM showcase_items WHERE place_id = ?').run(placeId);
          const insShow = db.prepare('INSERT INTO showcase_items (place_id, name, note, is_favorite) VALUES (?, ?, ?, ?)');
          for (const item of body.showcase) {
            insShow.run(placeId, item.name, item.note || '', item.favorite ? 1 : 0);
          }
        }

        const updated = listPlacesFull(db, { currentUserId: authUser.id }).find((p) => p.id === placeId);
        return sendJson(res, 200, { place: updated });
      }

      // Reviews: Publish / Update (RF004 + RD003)
      const reviewMatch = pathname.match(/^\/api\/places\/([^/]+)\/reviews$/);
      if (req.method === 'POST' && reviewMatch) {
        if (!authUser || authUser.role !== 'client') {
          return sendJson(res, 403, { error: 'Entre com uma conta de Cliente para avaliar.' });
        }
        const placeId = decodeURIComponent(reviewMatch[1]);
        const placeExists = db.prepare('SELECT id FROM places WHERE id = ?').get(placeId);
        if (!placeExists) return sendJson(res, 404, { error: 'Estabelecimento não encontrado.' });

        const body = await readBody(req);
        const s = body?.scores || {};
        const vals = [s.kids, s.accessibility, s.pet, s.service].map(Number);
        if (vals.some((v) => !Number.isInteger(v) || v < 1 || v > 5)) {
          return sendJson(res, 400, { error: 'Todas as 4 notas (1 a 5 estrelas) são obrigatórias.' });
        }

        db.prepare(`
          INSERT INTO reviews (place_id, user_id, kids_score, accessibility_score, pet_score, service_score, comment, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, date('now'))
          ON CONFLICT(place_id, user_id) DO UPDATE SET
            kids_score = excluded.kids_score,
            accessibility_score = excluded.accessibility_score,
            pet_score = excluded.pet_score,
            service_score = excluded.service_score,
            comment = excluded.comment,
            created_at = date('now')
        `).run(placeId, authUser.id, vals[0], vals[1], vals[2], vals[3], String(body.comment || '').trim());

        const updated = listPlacesFull(db, { currentUserId: authUser.id }).find((p) => p.id === placeId);
        return sendJson(res, 200, { place: updated });
      }

      // Follow toggle (RF010)
      const followMatch = pathname.match(/^\/api\/places\/([^/]+)\/follow$/);
      if (req.method === 'POST' && followMatch) {
        if (!authUser || authUser.role !== 'client') {
          return sendJson(res, 403, { error: 'Entre com uma conta de Cliente para seguir estabelecimentos.' });
        }
        const placeId = decodeURIComponent(followMatch[1]);
        const exists = db.prepare('SELECT 1 FROM follows WHERE user_id = ? AND place_id = ?').get(authUser.id, placeId);
        if (exists) {
          db.prepare('DELETE FROM follows WHERE user_id = ? AND place_id = ?').run(authUser.id, placeId);
        } else {
          db.prepare('INSERT INTO follows (user_id, place_id) VALUES (?, ?)').run(authUser.id, placeId);
        }
        const count = db.prepare('SELECT COUNT(*) AS cnt FROM follows WHERE place_id = ?').get(placeId).cnt;
        return sendJson(res, 200, { isFollowing: !exists, followersCount: count });
      }

      // Contact request (RF008)
      const contactMatch = pathname.match(/^\/api\/places\/([^/]+)\/contact$/);
      if (req.method === 'POST' && contactMatch) {
        const placeId = decodeURIComponent(contactMatch[1]);
        const body = await readBody(req);
        if (!body?.message?.trim()) {
          return sendJson(res, 400, { error: 'Escreva uma mensagem para enviar ao estabelecimento.' });
        }
        db.prepare(
          'INSERT INTO contact_requests (place_id, sender_name, sender_contact, message) VALUES (?, ?, ?, ?)'
        ).run(
          placeId,
          body.senderName?.trim() || authUser?.name || 'Visitante',
          body.senderContact?.trim() || authUser?.email || 'Não informado',
          body.message.trim()
        );
        return sendJson(res, 201, { ok: true });
      }

      if (req.method === 'GET' && pathname === '/api/business/contacts') {
        if (!authUser || authUser.role !== 'business') {
          return sendJson(res, 403, { error: 'Acesso restrito a estabelecimentos.' });
        }
        const contacts = db.prepare(`
          SELECT c.*, p.name AS place_name
          FROM contact_requests c
          JOIN places p ON p.id = c.place_id
          ORDER BY c.id DESC
        `).all();
        return sendJson(res, 200, { contacts });
      }

      // Structure Reports (RF014)
      const reportMatch = pathname.match(/^\/api\/places\/([^/]+)\/reports$/);
      if (req.method === 'POST' && reportMatch) {
        if (!authUser) {
          return sendJson(res, 401, { error: 'Faça login para sinalizar divergências.' });
        }
        const placeId = decodeURIComponent(reportMatch[1]);
        const body = await readBody(req);
        if (!body?.reason?.trim()) {
          return sendJson(res, 400, { error: 'Selecione o motivo da sinalização.' });
        }
        const result = db.prepare(
          'INSERT INTO structure_reports (place_id, user_id, reason, details) VALUES (?, ?, ?, ?)'
        ).run(placeId, authUser.id, body.reason.trim(), String(body.details || '').trim());
        const report = db.prepare('SELECT * FROM structure_reports WHERE id = ?').get(result.lastInsertRowid);
        return sendJson(res, 201, { report });
      }

      if (req.method === 'GET' && pathname === '/api/business/reports') {
        if (!authUser || authUser.role !== 'business') {
          return sendJson(res, 403, { error: 'Acesso restrito a estabelecimentos.' });
        }
        const reports = db.prepare(`
          SELECT r.*, p.name AS place_name, u.name AS reporter_name
          FROM structure_reports r
          JOIN places p ON p.id = r.place_id
          JOIN users u ON u.id = r.user_id
          ORDER BY r.id DESC
        `).all();
        return sendJson(res, 200, { reports });
      }

      const reportPatch = pathname.match(/^\/api\/reports\/(\d+)$/);
      if (req.method === 'PATCH' && reportPatch) {
        if (!authUser || authUser.role !== 'business') {
          return sendJson(res, 403, { error: 'Acesso restrito a estabelecimentos.' });
        }
        const id = Number(reportPatch[1]);
        db.prepare("UPDATE structure_reports SET status = 'Verificado e atualizado' WHERE id = ?").run(id);
        return sendJson(res, 200, { ok: true });
      }

      // Favorite Lists (RF005)
      if (req.method === 'GET' && pathname === '/api/favorites') {
        if (!authUser) return sendJson(res, 200, { lists: [] });
        const lists = db.prepare('SELECT * FROM favorite_lists WHERE user_id = ? ORDER BY id DESC').all(authUser.id);
        const placesStmt = db.prepare('SELECT place_id FROM favorite_list_places WHERE list_id = ?');
        return sendJson(res, 200, {
          lists: lists.map((l) => ({
            id: l.id,
            name: l.name,
            criterion: l.criterion,
            placeIds: placesStmt.all(l.id).map((r) => r.place_id),
          })),
        });
      }

      if (req.method === 'POST' && pathname === '/api/favorites') {
        if (!authUser) return sendJson(res, 401, { error: 'Faça login para criar listas de favoritos.' });
        const body = await readBody(req);
        if (!body?.name?.trim()) return sendJson(res, 400, { error: 'Informe o nome da lista.' });
        const result = db
          .prepare('INSERT INTO favorite_lists (user_id, name, criterion) VALUES (?, ?, ?)')
          .run(authUser.id, body.name.trim(), body.criterion?.trim() || 'Personalizada');
        const listId = result.lastInsertRowid;
        if (body.initialPlaceId) {
          db.prepare('INSERT OR IGNORE INTO favorite_list_places (list_id, place_id) VALUES (?, ?)').run(
            listId,
            body.initialPlaceId
          );
        }
        return sendJson(res, 201, {
          list: {
            id: listId,
            name: body.name.trim(),
            criterion: body.criterion?.trim() || 'Personalizada',
            placeIds: body.initialPlaceId ? [body.initialPlaceId] : [],
          },
        });
      }

      const favToggleMatch = pathname.match(/^\/api\/favorites\/(\d+)\/toggle$/);
      if (req.method === 'POST' && favToggleMatch) {
        if (!authUser) return sendJson(res, 401, { error: 'Faça login para editar listas.' });
        const listId = Number(favToggleMatch[1]);
        const list = db.prepare('SELECT * FROM favorite_lists WHERE id = ? AND user_id = ?').get(listId, authUser.id);
        if (!list) return sendJson(res, 404, { error: 'Lista não encontrada.' });
        const body = await readBody(req);
        const placeId = body?.placeId;
        if (!placeId) return sendJson(res, 400, { error: 'Estabelecimento obrigatório.' });
        const exists = db
          .prepare('SELECT 1 FROM favorite_list_places WHERE list_id = ? AND place_id = ?')
          .get(listId, placeId);
        if (exists) {
          db.prepare('DELETE FROM favorite_list_places WHERE list_id = ? AND place_id = ?').run(listId, placeId);
        } else {
          db.prepare('INSERT INTO favorite_list_places (list_id, place_id) VALUES (?, ?)').run(listId, placeId);
        }
        return sendJson(res, 200, { saved: !exists });
      }

      // Timeline (RF011 + RD004)
      if (req.method === 'GET' && pathname === '/api/timeline') {
        const onlyFollowed = url.searchParams.get('following') === 'true';
        let posts;
        if (onlyFollowed && authUser) {
          posts = db.prepare(`
            SELECT t.*, p.name AS place_name, p.neighborhood AS place_neighborhood
            FROM timeline_posts t
            JOIN places p ON p.id = t.place_id
            JOIN follows f ON f.place_id = t.place_id AND f.user_id = ?
            ORDER BY t.id DESC
          `).all(authUser.id);
        } else {
          posts = db.prepare(`
            SELECT t.*, p.name AS place_name, p.neighborhood AS place_neighborhood
            FROM timeline_posts t
            JOIN places p ON p.id = t.place_id
            ORDER BY t.id DESC
          `).all();
        }
        return sendJson(res, 200, { posts });
      }

      if (req.method === 'POST' && pathname === '/api/timeline') {
        if (!authUser || authUser.role !== 'business') {
          return sendJson(res, 403, { error: 'Somente estabelecimentos podem publicar na Timeline.' });
        }
        const body = await readBody(req);
        const content = String(body?.content || '').trim();
        const category = body?.category;
        const placeId = body?.placeId;
        const imageUrl = String(body?.imageUrl || '').trim();

        if (!placeId || !content || !imageUrl) {
          return sendJson(res, 400, { error: 'Informe estabelecimento, texto e imagem da publicação.' });
        }
        if (content.length > 280) {
          return sendJson(res, 400, { error: 'O texto da publicação deve ter no máximo 280 caracteres (RD004).' });
        }
        if (!['Evento', 'Promoção', 'Novidade'].includes(category)) {
          return sendJson(res, 400, { error: 'Categoria deve ser Evento, Promoção ou Novidade.' });
        }

        const result = db
          .prepare('INSERT INTO timeline_posts (place_id, author_id, content, image_url, category) VALUES (?, ?, ?, ?, ?)')
          .run(placeId, authUser.id, content, imageUrl, category);
        const created = db.prepare(`
          SELECT t.*, p.name AS place_name, p.neighborhood AS place_neighborhood
          FROM timeline_posts t
          JOIN places p ON p.id = t.place_id
          WHERE t.id = ?
        `).get(result.lastInsertRowid);
        return sendJson(res, 201, { post: created });
      }

      // Coupons (RF012 + RD004)
      if (req.method === 'GET' && pathname === '/api/coupons') {
        const coupons = db.prepare(`
          SELECT c.*, p.name AS place_name, p.neighborhood AS place_neighborhood
          FROM coupons c
          JOIN places p ON p.id = c.place_id
          ORDER BY c.expires_at DESC, c.id DESC
        `).all();
        const redeemedSet = new Set();
        if (authUser) {
          const rows = db.prepare('SELECT coupon_id FROM coupon_redemptions WHERE user_id = ?').all(authUser.id);
          for (const r of rows) redeemedSet.add(r.coupon_id);
        }
        const today = new Date().toISOString().slice(0, 10);
        return sendJson(res, 200, {
          coupons: coupons.map((c) => ({
            ...c,
            expired: c.expires_at < today,
            redeemed: redeemedSet.has(c.id),
          })),
        });
      }

      if (req.method === 'POST' && pathname === '/api/coupons') {
        if (!authUser || authUser.role !== 'business') {
          return sendJson(res, 403, { error: 'Somente estabelecimentos podem criar cupons.' });
        }
        const body = await readBody(req);
        if (!body?.placeId || !body?.title?.trim() || !body?.code?.trim() || !body?.expiresAt) {
          return sendJson(res, 400, { error: 'Preencha estabelecimento, título, código e validade do cupom.' });
        }
        const result = db
          .prepare('INSERT INTO coupons (place_id, title, description, code, expires_at) VALUES (?, ?, ?, ?, ?)')
          .run(
            body.placeId,
            body.title.trim(),
            String(body.description || '').trim(),
            body.code.trim().toUpperCase(),
            body.expiresAt
          );
        const created = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid);
        return sendJson(res, 201, { coupon: created });
      }

      const redeemMatch = pathname.match(/^\/api\/coupons\/(\d+)\/redeem$/);
      if (req.method === 'POST' && redeemMatch) {
        if (!authUser || authUser.role !== 'client') {
          return sendJson(res, 403, { error: 'Entre com uma conta de Cliente para resgatar cupons.' });
        }
        const couponId = Number(redeemMatch[1]);
        const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId);
        if (!coupon) return sendJson(res, 404, { error: 'Cupom não encontrado.' });
        const today = new Date().toISOString().slice(0, 10);
        if (coupon.expires_at < today) {
          return sendJson(res, 400, { error: 'Cupom expirado não pode ser resgatado (RD004).' });
        }
        db.prepare('INSERT OR IGNORE INTO coupon_redemptions (coupon_id, user_id) VALUES (?, ?)').run(
          couponId,
          authUser.id
        );
        return sendJson(res, 200, { ok: true, code: coupon.code });
      }

      // Assistant / Chatbot (RF013)
      if (req.method === 'POST' && pathname === '/api/assistant/recommend') {
        const body = await readBody(req);
        const places = listPlacesFull(db, { currentUserId: authUser?.id || null });
        const result = recommendPlacesFromQuery(places, body?.message || '');
        return sendJson(res, 200, result);
      }

      return sendJson(res, 404, { error: 'Rota não encontrada.' });
    } catch (err) {
      console.error('Erro na API:', err);
      return sendJson(res, 500, { error: 'Erro interno do servidor SQLite.' });
    }
  });
}

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const port = Number(process.env.PORT || 3001);
  const db = openDatabase();
  const server = createApiServer(db);
  server.listen(port, () => {
    console.log(`Family Place API + SQLite rodando em http://localhost:${port}`);
  });
}
