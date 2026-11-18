import { PILLARS } from '../data/catalog';

export function calculatePillarAverages(reviews = []) {
  if (!reviews.length) {
    return {
      kids: 0,
      accessibility: 0,
      pet: 0,
      service: 0,
      count: 0,
    };
  }

  const totals = { kids: 0, accessibility: 0, pet: 0, service: 0 };
  for (const rev of reviews) {
    for (const { key } of PILLARS) {
      totals[key] += Number(rev.scores?.[key] || 0);
    }
  }

  return {
    kids: Number((totals.kids / reviews.length).toFixed(1)),
    accessibility: Number((totals.accessibility / reviews.length).toFixed(1)),
    pet: Number((totals.pet / reviews.length).toFixed(1)),
    service: Number((totals.service / reviews.length).toFixed(1)),
    count: reviews.length,
  };
}

export function buildWhatsAppUrl(phone, placeName) {
  const digits = String(phone || '').replace(/\D/g, '');
  const text = encodeURIComponent(
    `Olá! Encontrei o estabelecimento "${placeName}" no Family Place e gostaria de tirar uma dúvida / fazer uma reserva.`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export function buildMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function loadStoredJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}
