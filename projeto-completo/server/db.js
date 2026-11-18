import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeBannerSvg(title, subtitle, bg = '#7a1c24') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 220" width="640" height="220"><rect width="640" height="220" fill="${bg}"/><circle cx="560" cy="40" r="90" fill="rgba(255,255,255,0.08)"/><text x="32" y="96" fill="#ffffff" font-family="Segoe UI, Arial" font-size="26" font-weight="700">${title}</text><text x="32" y="136" fill="#f5e6e8" font-family="Segoe UI, Arial" font-size="17">${subtitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function openDatabase(dbPath = path.join(__dirname, 'family-place.db')) {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'business')),
      lgpd_accepted INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      address TEXT NOT NULL,
      hours TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      website TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS place_tags (
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      PRIMARY KEY (place_id, tag)
    );

    CREATE TABLE IF NOT EXISTS showcase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      is_favorite INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kids_score INTEGER NOT NULL CHECK(kids_score BETWEEN 1 AND 5),
      accessibility_score INTEGER NOT NULL CHECK(accessibility_score BETWEEN 1 AND 5),
      pet_score INTEGER NOT NULL CHECK(pet_score BETWEEN 1 AND 5),
      service_score INTEGER NOT NULL CHECK(service_score BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (date('now')),
      UNIQUE (place_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS favorite_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      criterion TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS favorite_list_places (
      list_id INTEGER NOT NULL REFERENCES favorite_lists(id) ON DELETE CASCADE,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      PRIMARY KEY (list_id, place_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (date('now')),
      PRIMARY KEY (user_id, place_id)
    );

    CREATE TABLE IF NOT EXISTS timeline_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL CHECK(length(content) <= 280),
      image_url TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Evento', 'Promoção', 'Novidade')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (coupon_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS structure_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Em verificação',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      sender_name TEXT NOT NULL,
      sender_contact TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedIfEmpty(db);
  return db;
}

function seedIfEmpty(db) {
  const countRow = db.prepare('SELECT COUNT(*) AS total FROM places').get();
  if (countRow.total > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, lgpd_accepted) VALUES (?, ?, ?, ?, 1)'
  );
  const demoPass = hashPassword('demo123');
  const camilaId = insertUser.run('Camila Souza (Cliente Demo)', 'camila@demo.local', demoPass, 'client').lastInsertRowid;
  const larissaId = insertUser.run('Larissa Mendes', 'larissa@demo.local', demoPass, 'client').lastInsertRowid;
  const rafaelId = insertUser.run('Rafael Torres', 'rafael@demo.local', demoPass, 'client').lastInsertRowid;
  const bizOwnerId = insertUser.run('Café Varanda Inclusiva (Gestor Demo)', 'varanda@familyplace.local', demoPass, 'business').lastInsertRowid;

  const seedPlaces = [
    {
      id: 'local-1',
      ownerId: bizOwnerId,
      name: 'Café Varanda Inclusiva',
      category: 'Café & Padaria',
      neighborhood: 'Centro',
      address: 'Rua das Flores, 120 - Centro',
      hours: 'Ter a Dom · 08h às 21h',
      whatsapp: '5511999991001',
      website: 'https://exemplo.org/varanda-inclusiva',
      description: 'Café amplo em piso térreo com jardim coberto para pets, brinquedoteca cercada e salão interno silencioso ideal para idosos.',
      tags: ['Espaço Kids', 'Trocador', 'Cadeirão', 'Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Cardápio Acessível', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio'],
      showcase: [
        ['Combo Brunch Família (4 pessoas)', 'Opções sem açúcar e menu infantil', 1],
        ['Bolo Caseiro de Laranja da Vovó', 'Receita artesanal sem conservantes', 1],
        ['Biscoito Natural Pet (Aveia e Maçã)', 'Cortesia na primeira visita com pet', 0],
      ],
      reviews: [
        [camilaId, 5, 5, 5, 5, 'Trocador impecável, espaço kids visível das mesas e área pet coberta com água fresca.', '2026-11-10'],
        [larissaId, 4, 5, 4, 5, 'Levei meu avô de 72 anos: rampa suave, cardápio com letra ampliada e som ambiente agradável.', '2026-11-12'],
      ],
    },
    {
      id: 'local-2',
      ownerId: bizOwnerId,
      name: 'Bistrô Parque das Famílias',
      category: 'Bistrô',
      neighborhood: 'Jardim Botânico',
      address: 'Av. das Acácias, 450 - Jardim Botânico',
      hours: 'Qua a Dom · 11h30 às 22h30',
      whatsapp: '5511999991002',
      website: 'https://exemplo.org/bistro-parque',
      description: 'Bistrô arborizado integrado a uma alameda plana, com recreação infantil aos sábados e mesas externas espaçosas para cães de grande porte.',
      tags: ['Espaço Kids', 'Monitoria', 'Cadeirão', 'Rampa de Acesso', 'Banheiro Adaptado', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio', 'Aceita Porte Grande'],
      showcase: [
        ['Almoço Executivo & Prato Kids', 'Porções adaptadas sem pimenta', 1],
        ['Risoto de Cogumelos Frescos', 'Preparado na hora', 0],
      ],
      reviews: [
        [rafaelId, 5, 4, 5, 5, 'Nosso labrador ficou super confortável embaixo do pergolado coberto enquanto as crianças brincavam.', '2026-11-11'],
      ],
    },
    {
      id: 'local-3',
      ownerId: bizOwnerId,
      name: 'Cantina Aconchego & Massa',
      category: 'Restaurante',
      neighborhood: 'Vila Nova',
      address: 'Rua Dom Pedro II, 88 - Vila Nova',
      hours: 'Ter a Dom · 11h às 22h',
      whatsapp: '5511999991003',
      website: 'https://exemplo.org/cantina-aconchego',
      description: 'Restaurante tradicional focado em conforto acústico, corredores largos para cadeiras de rodas e cadeirões higienizados.',
      tags: ['Trocador', 'Cadeirão', 'Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Cardápio Acessível'],
      showcase: [['Lasanha da Casa em Porção Família', 'Serve até 4 adultos', 1]],
      reviews: [
        [larissaId, 4, 5, 2, 5, 'Melhor lugar para conversar sem barulho alto. Banheiro adaptado com barras firmes.', '2026-11-09'],
      ],
    },
    {
      id: 'local-4',
      ownerId: bizOwnerId,
      name: 'Pizzaria Recreio Seguro',
      category: 'Restaurante',
      neighborhood: 'Bela Vista',
      address: 'Rua Alvorada, 310 - Bela Vista',
      hours: 'Ter a Dom · 18h às 23h30',
      whatsapp: '5511999991004',
      website: 'https://exemplo.org/pizzaria-recreio',
      description: 'Pizzaria familiar com monitoria infantil em tempo integral, varanda pet e acesso sem degraus desde o estacionamento.',
      tags: ['Espaço Kids', 'Trocador', 'Cadeirão', 'Monitoria', 'Rampa de Acesso', 'Banheiro Adaptado', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio'],
      showcase: [['Rodízio Família com Mesa Kids', 'Inclui suco natural', 1]],
      reviews: [
        [camilaId, 5, 5, 4, 4, 'Monitoras atenciosas e fraldário bem equipado. Conseguimos jantar tranquilos.', '2026-11-14'],
      ],
    },
    {
      id: 'local-5',
      ownerId: bizOwnerId,
      name: 'Gelateria Pátio Aberto',
      category: 'Sorveteria',
      neighborhood: 'Centro',
      address: 'Praça da Matriz, 45 - Centro',
      hours: 'Seg a Dom · 12h às 21h',
      whatsapp: '5511999991005',
      website: 'https://exemplo.org/gelateria-patio',
      description: 'Sorveteria artesanal com pátio plano sombreado, opções zero açúcar e picolé especial seguro para cães.',
      tags: ['Trocador', 'Rampa de Acesso', 'Cardápio Acessível', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio', 'Aceita Porte Grande'],
      showcase: [['Picolé Pet de Melancia e Coco', 'Sem açúcar nem xilitol', 1]],
      reviews: [
        [rafaelId, 4, 4, 5, 5, 'Excelente parada de fim de tarde com cachorro grande e carrinho de bebê.', '2026-11-08'],
      ],
    },
    {
      id: 'local-6',
      ownerId: bizOwnerId,
      name: 'Espaço Cultural Quintal Verde',
      category: 'Parque & Lazer',
      neighborhood: 'Jardim Botânico',
      address: 'Rua dos Ipês, 600 - Jardim Botânico',
      hours: 'Ter a Dom · 07h às 19h',
      whatsapp: '5511999991006',
      website: 'https://exemplo.org/quintal-verde',
      description: 'Área de lazer comunitária com trilhas pavimentadas acessíveis, parquinho inclusivo e quiosque com bancos sombreados para idosos e pets.',
      tags: ['Espaço Kids', 'Trocador', 'Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio', 'Aceita Porte Grande'],
      showcase: [['Cesta de Piquenique Comunitária', 'Reserva antecipada via WhatsApp', 1]],
      reviews: [
        [larissaId, 5, 5, 5, 5, 'Caminhos planos sem buracos, ótimo para cadeira de rodas e passeio com cães na guia.', '2026-11-15'],
      ],
    },
    {
      id: 'local-7',
      ownerId: bizOwnerId,
      name: 'Padaria Pão & Carinho',
      category: 'Café & Padaria',
      neighborhood: 'Vila Nova',
      address: 'Av. Brasil, 910 - Vila Nova',
      hours: 'Seg a Sáb · 06h30 às 20h',
      whatsapp: '5511999991007',
      website: 'https://exemplo.org/pao-carinho',
      description: 'Padaria de bairro com deck coberto pet friendly, mesas largas para famílias e atendimento prioritário ágil.',
      tags: ['Cadeirão', 'Trocador', 'Rampa de Acesso', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio'],
      showcase: [['Café da Manhã Completo para 2', 'Inclui suco, pães e frutas', 1]],
      reviews: [
        [camilaId, 4, 4, 5, 5, 'Café da manhã gostoso e preço muito justo.', '2026-11-06'],
      ],
    },
    {
      id: 'local-8',
      ownerId: bizOwnerId,
      name: 'Restaurante Casa da Praça',
      category: 'Restaurante',
      neighborhood: 'Santa Clara',
      address: 'Praça Santa Clara, 19 - Santa Clara',
      hours: 'Ter a Dom · 11h às 16h',
      whatsapp: '5511999991008',
      website: 'https://exemplo.org/casa-da-praca',
      description: 'Comida caseira em ambiente tranquilo, com cadeiras ergonômicas de apoio para idosos e espaço lúdico para crianças.',
      tags: ['Espaço Kids', 'Cadeirão', 'Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Cardápio Acessível'],
      showcase: [['Buffet Caseiro de Domingo', 'Pratos leves e opções sem sal em excesso', 1]],
      reviews: [
        [larissaId, 4, 5, 2, 5, 'Almoço de domingo com meus pais idosos sem fila nem barulho excessivo.', '2026-11-05'],
      ],
    },
    {
      id: 'local-9',
      ownerId: bizOwnerId,
      name: 'Patas & Xícaras Pet Café',
      category: 'Café & Padaria',
      neighborhood: 'Bela Vista',
      address: 'Rua Bahia, 204 - Bela Vista',
      hours: 'Qua a Dom · 09h às 20h',
      whatsapp: '5511999991009',
      website: 'https://exemplo.org/patas-xicaras',
      description: 'Cafeteria pensada especialmente para tutores de pets de todos os portes, com piso antiderrapante e área kids integrada.',
      tags: ['Espaço Kids', 'Rampa de Acesso', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio', 'Aceita Porte Grande'],
      showcase: [['Cappuccino Cremoso + Muffin Pet', 'Combinação campeã da casa', 1]],
      reviews: [
        [rafaelId, 4, 4, 5, 5, 'Piso não escorrega para o cachorro e tem área cercada segura.', '2026-11-13'],
      ],
    },
    {
      id: 'local-10',
      ownerId: bizOwnerId,
      name: 'Bistrô Sabor do Campo',
      category: 'Bistrô',
      neighborhood: 'Santa Clara',
      address: 'Estrada da Colina, 75 - Santa Clara',
      hours: 'Sex a Dom · 11h às 18h',
      whatsapp: '5511999991010',
      website: 'https://exemplo.org/sabor-campo',
      description: 'Espaço amplo ao ar livre com varanda coberta, redário calmo para idosos e recreação supervisionada.',
      tags: ['Espaço Kids', 'Monitoria', 'Trocador', 'Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Grande'],
      showcase: [['Galinhada Caipira no Fogão a Lenha', 'Porção farta para família', 1]],
      reviews: [
        [camilaId, 5, 5, 5, 4, 'Experiência completa para ir com avós, netos e dois cachorros grandes.', '2026-11-04'],
      ],
    },
    {
      id: 'local-11',
      ownerId: bizOwnerId,
      name: 'Estação do Suco Natural',
      category: 'Café & Padaria',
      neighborhood: 'Centro',
      address: 'Av. Central, 512 - Centro',
      hours: 'Seg a Sáb · 08h às 19h',
      whatsapp: '5511999991011',
      website: 'https://exemplo.org/estacao-suco',
      description: 'Lanchonete acessível no térreo com cardápio em alto contraste, sucos naturais e área externa sombreada para pets.',
      tags: ['Cadeirão', 'Rampa de Acesso', 'Banheiro Adaptado', 'Cardápio Acessível', 'Pote de Água', 'Aceita Porte Médio'],
      showcase: [['Sanduíche Natural + Suco Verde', 'Preparo sem fritura', 1]],
      reviews: [
        [larissaId, 3, 5, 4, 5, 'Cardápio fácil de ler e entrada totalmente nivelada com a calçada.', '2026-11-07'],
      ],
    },
    {
      id: 'local-12',
      ownerId: bizOwnerId,
      name: 'Parque Municipal do Lago (Quiosque Sul)',
      category: 'Parque & Lazer',
      neighborhood: 'Jardim Botânico',
      address: 'Av. Beira Lago, s/n - Jardim Botânico',
      hours: 'Seg a Dom · 06h às 20h',
      whatsapp: '5511999991012',
      website: 'https://exemplo.org/parque-lago',
      description: 'Ponto de apoio no parque com fraldário público limpo, bebedouro adaptado para cadeirantes e bebedouro baixo para pets.',
      tags: ['Espaço Kids', 'Trocador', 'Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Pote de Água', 'Aceita Porte Médio', 'Aceita Porte Grande'],
      showcase: [['Água de Coco Gelada & Tapioca', 'Atendimento rápido no quiosque', 1]],
      reviews: [
        [rafaelId, 5, 5, 5, 4, 'Ótima referência para passeios gratuitos no fim de semana.', '2026-11-03'],
      ],
    },
    {
      id: 'local-13',
      ownerId: bizOwnerId,
      name: 'Trattoria Mesa Viva',
      category: 'Restaurante',
      neighborhood: 'Vila Nova',
      address: 'Rua Itália, 333 - Vila Nova',
      hours: 'Ter a Dom · 12h às 22h',
      whatsapp: '5511999991013',
      website: 'https://exemplo.org/mesa-viva',
      description: 'Restaurante acolhedor com espaço kids educativo sem telas e área externa coberta com aquecedores.',
      tags: ['Espaço Kids', 'Trocador', 'Cadeirão', 'Rampa de Acesso', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio'],
      showcase: [['Nhoque Artesanal ao Sugo', 'Favorito das crianças', 1]],
      reviews: [
        [camilaId, 5, 4, 4, 5, 'Brinquedos de madeira bem cuidados e equipe muito gentil.', '2026-11-02'],
      ],
    },
    {
      id: 'local-14',
      ownerId: bizOwnerId,
      name: 'Doceria Chás da Tarde',
      category: 'Sorveteria',
      neighborhood: 'Santa Clara',
      address: 'Rua das Hortênsias, 92 - Santa Clara',
      hours: 'Qua a Dom · 13h às 20h',
      whatsapp: '5511999991014',
      website: 'https://exemplo.org/chas-tarde',
      description: 'Casa de chás e sorvetes com ambiente silencioso, poltronas confortáveis e jardim acessível.',
      tags: ['Cadeirão', 'Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Cardápio Acessível', 'Pote de Água'],
      showcase: [['Torta de Maçã com Sorvete de Baunilha', 'Versão sem açúcar disponível', 1]],
      reviews: [
        [larissaId, 3, 5, 4, 5, 'Poltronas altas fáceis de levantar para pessoas idosas.', '2026-11-01'],
      ],
    },
    {
      id: 'local-15',
      ownerId: bizOwnerId,
      name: 'Quintal Família Gourmet',
      category: 'Restaurante',
      neighborhood: 'Bela Vista',
      address: 'Av. Independência, 780 - Bela Vista',
      hours: 'Qui a Dom · 17h às 23h',
      whatsapp: '5511999991015',
      website: 'https://exemplo.org/quintal-gourmet',
      description: 'Restaurante ao ar livre coberto por toldos retráteis, monitoria infantil e amplo espaço entre mesas.',
      tags: ['Espaço Kids', 'Monitoria', 'Trocador', 'Cadeirão', 'Rampa de Acesso', 'Banheiro Adaptado', 'Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio', 'Aceita Porte Grande'],
      showcase: [['Parrilla Família + Batata Rústica', 'Serve 4 pessoas', 1]],
      reviews: [
        [rafaelId, 5, 5, 5, 4, 'Espaço super completo para reunir gerações diferentes e os pets juntos.', '2026-11-16'],
      ],
    },
  ];

  const insPlace = db.prepare(
    'INSERT INTO places (id, owner_id, name, category, neighborhood, address, hours, whatsapp, website, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insTag = db.prepare('INSERT INTO place_tags (place_id, tag) VALUES (?, ?)');
  const insShowcase = db.prepare('INSERT INTO showcase_items (place_id, name, note, is_favorite) VALUES (?, ?, ?, ?)');
  const insReview = db.prepare(
    'INSERT INTO reviews (place_id, user_id, kids_score, accessibility_score, pet_score, service_score, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  for (const p of seedPlaces) {
    insPlace.run(p.id, p.ownerId, p.name, p.category, p.neighborhood, p.address, p.hours, p.whatsapp, p.website, p.description);
    for (const tag of p.tags) insTag.run(p.id, tag);
    for (const [sName, sNote, sFav] of p.showcase) insShowcase.run(p.id, sName, sNote, sFav);
    for (const [uId, k, a, pet, s, c, dt] of p.reviews) insReview.run(p.id, uId, k, a, pet, s, c, dt);
  }

  // Favorite lists for Camila Demo
  const insList = db.prepare('INSERT INTO favorite_lists (user_id, name, criterion) VALUES (?, ?, ?)');
  const insListPlace = db.prepare('INSERT INTO favorite_list_places (list_id, place_id) VALUES (?, ?)');
  const l1 = insList.run(camilaId, 'Melhores para ir com meu Avô', 'Acessibilidade e Baixo Ruído').lastInsertRowid;
  for (const pid of ['local-1', 'local-3', 'local-8']) insListPlace.run(l1, pid);
  const l2 = insList.run(camilaId, 'Melhores para levar o Cachorro', 'Pet Friendly Coberto').lastInsertRowid;
  for (const pid of ['local-2', 'local-5', 'local-9']) insListPlace.run(l2, pid);
  const l3 = insList.run(camilaId, 'Melhores Espaços Kids', 'Estrutura Infantil e Segurança').lastInsertRowid;
  for (const pid of ['local-1', 'local-4', 'local-15']) insListPlace.run(l3, pid);

  // Follows (RF010)
  const insFollow = db.prepare('INSERT INTO follows (user_id, place_id) VALUES (?, ?)');
  for (const pid of ['local-1', 'local-2', 'local-6']) insFollow.run(camilaId, pid);
  insFollow.run(larissaId, 'local-1');
  insFollow.run(rafaelId, 'local-2');

  // Timeline posts (RF011)
  const insPost = db.prepare(
    'INSERT INTO timeline_posts (place_id, author_id, content, image_url, category) VALUES (?, ?, ?, ?, ?)'
  );
  insPost.run(
    'local-1',
    bizOwnerId,
    'Neste sábado teremos manhã de recreação infantil tranquila e biscoito pet natural de cortesia na área coberta das 9h às 13h!',
    makeBannerSvg('Sábado em Família na Varanda', 'Recreação infantil + Área Pet Coberta (09h–13h)', '#7a1c24'),
    'Evento'
  );
  insPost.run(
    'local-2',
    bizOwnerId,
    'Novo pergolado sombreado inaugurado para cães de grande porte, com bebedouros baixos e piso antiderrapante.',
    makeBannerSvg('Novo Pergolado Pet Friendly', 'Mais conforto para cães de porte médio e grande', '#145c3c'),
    'Novidade'
  );
  insPost.run(
    'local-4',
    bizOwnerId,
    'Quinta-feira das Famílias: monitoria infantil gratuita no salão térreo acessível e cardápio em fonte ampliada.',
    makeBannerSvg('Quinta das Famílias no Recreio', 'Monitoria infantil inclusa + acesso sem degraus', '#5c141a'),
    'Promoção'
  );

  // Loyalty Coupons (RF012 + RD004: active + 1 expired for validation testing)
  const insCoupon = db.prepare(
    'INSERT INTO coupons (place_id, title, description, code, expires_at) VALUES (?, ?, ?, ?, ?)'
  );
  insCoupon.run(
    'local-1',
    '10% OFF no Brunch Família',
    'Apresente o código presencialmente de terça a sexta para ganhar 10% no Combo Brunch Família.',
    'FAMILIA10',
    '2026-12-31'
  );
  insCoupon.run(
    'local-5',
    '1 Picolé Pet Cortesia',
    'Na compra de 2 gelatos tradicionais, seu pet ganha 1 picolé natural de melancia e coco.',
    'PETGELATO',
    '2026-12-20'
  );
  insCoupon.run(
    'local-3',
    'Sobremesa Cortesia para 60+',
    'Clientes acima de 60 anos ganham pudim ou fruta da estação no almoço de terça a quinta.',
    'ACONCHEGO60',
    '2026-12-15'
  );
  insCoupon.run(
    'local-2',
    'Campanha Primavera Encerrada',
    'Cupom expirado mantido para validação automática da regra RD004.',
    'EXPIRADO2025',
    '2025-10-01'
  );
}

export function listPlacesFull(db, { currentUserId = null, q = '', category = 'Todas', tags = [], sort = 'relevance' } = {}) {
  const places = db.prepare('SELECT * FROM places ORDER BY rowid ASC').all();
  const tagsStmt = db.prepare('SELECT tag FROM place_tags WHERE place_id = ?');
  const showcaseStmt = db.prepare('SELECT id, name, note, is_favorite FROM showcase_items WHERE place_id = ?');
  const reviewsStmt = db.prepare(`
    SELECT r.id, r.place_id, r.user_id, u.name AS authorName, u.email AS authorEmail,
           r.kids_score, r.accessibility_score, r.pet_score, r.service_score, r.comment, r.created_at
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.place_id = ?
    ORDER BY r.id DESC
  `);
  const followersCountStmt = db.prepare('SELECT COUNT(*) AS cnt FROM follows WHERE place_id = ?');
  const isFollowingStmt = db.prepare('SELECT 1 FROM follows WHERE user_id = ? AND place_id = ?');

  const normalizedQ = q.trim().toLowerCase();

  let hydrated = places.map((p) => {
    const placeTags = tagsStmt.all(p.id).map((r) => r.tag);
    const showcase = showcaseStmt.all(p.id).map((s) => ({
      id: s.id,
      name: s.name,
      note: s.note,
      favorite: Boolean(s.is_favorite),
    }));
    const reviews = reviewsStmt.all(p.id).map((r) => ({
      id: r.id,
      authorName: r.authorName,
      authorEmail: r.authorEmail,
      createdAt: r.created_at,
      comment: r.comment,
      scores: {
        kids: r.kids_score,
        accessibility: r.accessibility_score,
        pet: r.pet_score,
        service: r.service_score,
      },
    }));

    const count = reviews.length;
    const averages = count
      ? {
          kids: Number((reviews.reduce((acc, r) => acc + r.scores.kids, 0) / count).toFixed(1)),
          accessibility: Number((reviews.reduce((acc, r) => acc + r.scores.accessibility, 0) / count).toFixed(1)),
          pet: Number((reviews.reduce((acc, r) => acc + r.scores.pet, 0) / count).toFixed(1)),
          service: Number((reviews.reduce((acc, r) => acc + r.scores.service, 0) / count).toFixed(1)),
          count,
        }
      : { kids: 0, accessibility: 0, pet: 0, service: 0, count: 0 };

    const followersCount = followersCountStmt.get(p.id).cnt;
    const isFollowing = currentUserId ? Boolean(isFollowingStmt.get(currentUserId, p.id)) : false;

    return {
      id: p.id,
      ownerId: p.owner_id,
      name: p.name,
      category: p.category,
      neighborhood: p.neighborhood,
      address: p.address,
      hours: p.hours,
      whatsapp: p.whatsapp,
      website: p.website,
      description: p.description,
      tags: placeTags,
      showcase,
      reviews,
      averages,
      followersCount,
      isFollowing,
    };
  });

  if (category && category !== 'Todas') {
    hydrated = hydrated.filter((p) => p.category === category);
  }
  if (tags.length > 0) {
    hydrated = hydrated.filter((p) => tags.every((t) => p.tags.includes(t)));
  }
  if (normalizedQ) {
    hydrated = hydrated.filter((p) =>
      `${p.name} ${p.neighborhood} ${p.category} ${p.description}`.toLowerCase().includes(normalizedQ)
    );
  }

  if (['kids', 'accessibility', 'pet', 'service'].includes(sort)) {
    hydrated.sort((a, b) => (b.averages[sort] || 0) - (a.averages[sort] || 0));
  }

  return hydrated;
}
