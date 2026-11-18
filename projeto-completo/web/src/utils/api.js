export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erro na requisição (${res.status})`);
  }
  return data;
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
