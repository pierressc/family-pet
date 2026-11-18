export const PILLARS = [
  {
    key: 'kids',
    label: 'Estrutura Infantil',
    shortLabel: 'Kids',
    description: 'Trocador, espaço kids, cadeirão, segurança e recreação',
  },
  {
    key: 'accessibility',
    label: 'Acessibilidade e Conforto',
    shortLabel: 'PCD / Idosos',
    description: 'Rampas, banheiro adaptado, baixo ruído e assentos confortáveis',
  },
  {
    key: 'pet',
    label: 'Receptividade Pet',
    shortLabel: 'Pet Friendly',
    description: 'Área coberta permitida, potes de água e suporte ao porte',
  },
  {
    key: 'service',
    label: 'Atendimento e Custo-Benefício',
    shortLabel: 'Atendimento',
    description: 'Cordialidade, preparo da equipe para acolhimento e preço justo',
  },
];

export const CATEGORIES = [
  'Todas',
  'Restaurante',
  'Café & Padaria',
  'Bistrô',
  'Parque & Lazer',
  'Sorveteria',
];

export const TAG_GROUPS = [
  {
    pillar: 'kids',
    title: 'Infantil (Kids)',
    tags: ['Espaço Kids', 'Trocador', 'Cadeirão', 'Monitoria'],
  },
  {
    pillar: 'accessibility',
    title: 'Acessibilidade (PCD e Idosos)',
    tags: ['Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído', 'Cardápio Acessível'],
  },
  {
    pillar: 'pet',
    title: 'Pet Friendly',
    tags: ['Área Pet Coberta', 'Pote de Água', 'Aceita Porte Médio', 'Aceita Porte Grande'],
  },
];

function svgBanner(title, subtitle, color) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 220" width="640" height="220"><rect width="640" height="220" fill="${color}"/><circle cx="560" cy="40" r="90" fill="rgba(255,255,255,0.08)"/><text x="32" y="96" fill="#ffffff" font-family="Segoe UI, Arial" font-size="26" font-weight="700">${title}</text><text x="32" y="136" fill="#f5e6e8" font-family="Segoe UI, Arial" font-size="17">${subtitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`;
}

export const POST_IMAGE_PRESETS = [
  {
    label: 'Banner Evento em Família',
    url: svgBanner('Evento Inclusivo Family Place', 'Programação especial para crianças, idosos e pets', '#7a1c24'),
  },
  {
    label: 'Banner Promoção Local',
    url: svgBanner('Promoção Especial da Semana', 'Condições especiais para a comunidade', '#145c3c'),
  },
  {
    label: 'Banner Novidade de Estrutura',
    url: svgBanner('Novidade de Acessibilidade & Pet', 'Melhorias de conforto no espaço físico', '#364156'),
  },
];
