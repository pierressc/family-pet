import { useEffect, useState } from 'react';
import { CATEGORIES, TAG_GROUPS } from '../data/constants';
import { apiFetch } from '../utils/api';

export default function BusinessDashboardModal({
  places,
  token,
  onClose,
  onPlaceSaved,
}) {
  const [tab, setTab] = useState('places');
  const [selectedId, setSelectedId] = useState(places[0]?.id || '__new__');
  const [isCreating, setIsCreating] = useState(false);

  const current = places.find((p) => p.id === selectedId) || places[0];
  const [form, setForm] = useState({
    name: current?.name || '',
    category: current?.category || 'Café & Padaria',
    neighborhood: current?.neighborhood || '',
    address: current?.address || '',
    hours: current?.hours || '',
    whatsapp: current?.whatsapp || '',
    website: current?.website || '',
    description: current?.description || '',
    tags: current?.tags || [],
    showcase: current?.showcase || [],
  });

  const [newItemName, setNewItemName] = useState('');
  const [newItemNote, setNewItemNote] = useState('');
  const [contacts, setContacts] = useState([]);
  const [reports, setReports] = useState([]);
  const [savedNotice, setSavedNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/business/contacts', { token }).then((r) => setContacts(r.contacts || [])).catch(() => {});
    apiFetch('/api/business/reports', { token }).then((r) => setReports(r.reports || [])).catch(() => {});
  }, [token]);

  const handleSelectPlace = (id) => {
    setSavedNotice('');
    setError('');
    if (id === '__new__') {
      setIsCreating(true);
      setSelectedId('__new__');
      setForm({
        name: '',
        category: 'Café & Padaria',
        neighborhood: '',
        address: '',
        hours: 'Seg a Sáb · 09h às 20h',
        whatsapp: '5511999990000',
        website: 'https://exemplo.org',
        description: '',
        tags: [],
        showcase: [],
      });
      return;
    }
    const next = places.find((p) => p.id === id);
    if (!next) return;
    setIsCreating(false);
    setSelectedId(id);
    setForm({
      name: next.name,
      category: next.category,
      neighborhood: next.neighborhood,
      address: next.address,
      hours: next.hours,
      whatsapp: next.whatsapp,
      website: next.website,
      description: next.description,
      tags: next.tags,
      showcase: next.showcase,
    });
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const toggleShowcaseFav = (index) => {
    setForm((prev) => ({
      ...prev,
      showcase: prev.showcase.map((item, idx) =>
        idx === index ? { ...item, favorite: !item.favorite } : item
      ),
    }));
  };

  const addShowcaseItem = () => {
    if (!newItemName.trim()) return;
    setForm((prev) => ({
      ...prev,
      showcase: [
        ...prev.showcase,
        {
          id: `tmp-${Date.now()}`,
          name: newItemName.trim(),
          note: newItemNote.trim() || 'Item informativo sem checkout',
          favorite: true,
        },
      ],
    }));
    setNewItemName('');
    setNewItemNote('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setSavedNotice('');
    try {
      if (isCreating) {
        const res = await apiFetch('/api/places', {
          method: 'POST',
          token,
          body: form,
        });
        setIsCreating(false);
        setSelectedId(res.place.id);
        onPlaceSaved(res.place, true);
        setSavedNotice('Novo estabelecimento salvo no banco SQLite!');
      } else {
        const res = await apiFetch(`/api/places/${selectedId}`, {
          method: 'PUT',
          token,
          body: form,
        });
        onPlaceSaved(res.place, false);
        setSavedNotice('Alterações salvas no banco SQLite (RF007)!');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolveReport = async (id) => {
    await apiFetch(`/api/reports/${id}`, { method: 'PATCH', token });
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Verificado e atualizado' } : r))
    );
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="biz-title">
      <div className="modal-card modal-wide">
        <div className="modal-header">
          <div>
            <h2 id="biz-title">Painel do Estabelecimento (SQLite)</h2>
            <p className="place-meta">
              Gerencie locais, tags, contatos recebidos e sinalizações comunitárias.
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar painel">
            ✕
          </button>
        </div>

        <div className="tab-row tab-row-3">
          <button
            type="button"
            className={`tab-btn ${tab === 'places' ? 'active' : ''}`}
            onClick={() => setTab('places')}
          >
            Cadastro e Tags (RF007)
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'contacts' ? 'active' : ''}`}
            onClick={() => setTab('contacts')}
          >
            Contatos Recebidos ({contacts.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'reports' ? 'active' : ''}`}
            onClick={() => setTab('reports')}
          >
            Sinalizações ({reports.length})
          </button>
        </div>

        {tab === 'places' && (
          <form onSubmit={handleSave} className="stack-form">
            <div className="form-field">
              <label htmlFor="biz-select">Estabelecimento</label>
              <select
                id="biz-select"
                value={selectedId}
                onChange={(e) => handleSelectPlace(e.target.value)}
              >
                <option value="__new__">+ Cadastrar novo estabelecimento...</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.neighborhood})
                  </option>
                ))}
              </select>
            </div>

            <div className="two-col-form">
              <div className="form-field">
                <label htmlFor="biz-name">Nome</label>
                <input
                  id="biz-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="biz-cat">Categoria</label>
                <select
                  id="biz-cat"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="biz-bairro">Bairro</label>
                <input
                  id="biz-bairro"
                  value={form.neighborhood}
                  onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="biz-hours">Horário</label>
                <input
                  id="biz-hours"
                  value={form.hours}
                  onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label htmlFor="biz-wa">WhatsApp</label>
                <input
                  id="biz-wa"
                  value={form.whatsapp}
                  onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label htmlFor="biz-site">Site oficial</label>
                <input
                  id="biz-site"
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="biz-desc">Descrição</label>
              <textarea
                id="biz-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <fieldset className="tags-fieldset">
              <legend>Checklist de Comodidades (Tags)</legend>
              <div className="tag-groups-grid">
                {TAG_GROUPS.map((group) => (
                  <div key={group.pillar} className="tag-group-box">
                    <strong>{group.title}</strong>
                    {group.tags.map((tag) => (
                      <label key={tag} className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={form.tags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset className="tags-fieldset">
              <legend>Vitrine Informativa &amp; "Favoritos da Casa"</legend>
              <ul className="showcase-list">
                {form.showcase.map((item, idx) => (
                  <li key={item.id || idx} className="showcase-edit-row">
                    <span>
                      <strong>{item.name}</strong> — {item.note}
                    </span>
                    <button
                      type="button"
                      className={item.favorite ? 'btn-save is-saved' : 'btn-secondary'}
                      onClick={() => toggleShowcaseFav(idx)}
                    >
                      {item.favorite ? '★ Favorito da Casa' : 'Marcar Favorito'}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="add-showcase-row">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Novo item da vitrine..."
                />
                <input
                  type="text"
                  value={newItemNote}
                  onChange={(e) => setNewItemNote(e.target.value)}
                  placeholder="Observação rápida..."
                />
                <button type="button" className="btn-secondary" onClick={addShowcaseItem}>
                  + Adicionar Item
                </button>
              </div>
            </fieldset>

            {error && <p className="form-error">{error}</p>}
            {savedNotice && <p className="form-success">{savedNotice}</p>}

            <button type="submit" className="btn-primary">
              {isCreating ? 'Cadastrar Estabelecimento' : 'Salvar Alterações'}
            </button>
          </form>
        )}

        {tab === 'contacts' && (
          <div className="reviews-list">
            {contacts.length === 0 ? (
              <p className="place-meta">Nenhuma solicitação de contato enviada até o momento.</p>
            ) : (
              contacts.map((c) => (
                <article key={c.id} className="review-card">
                  <div className="review-card-top">
                    <strong>{c.place_name}</strong>
                    <span className="review-date">{c.created_at}</span>
                  </div>
                  <p className="place-meta">
                    De: {c.sender_name} ({c.sender_contact})
                  </p>
                  <p className="review-text">{c.message}</p>
                </article>
              ))
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="reviews-list">
            {reports.length === 0 ? (
              <p className="place-meta">Nenhuma sinalização de divergência registrada.</p>
            ) : (
              reports.map((r) => (
                <article key={r.id} className="review-card">
                  <div className="review-card-top">
                    <strong>
                      {r.place_name} — {r.reason}
                    </strong>
                    <span className="badge-category">{r.status}</span>
                  </div>
                  <p className="place-meta">
                    Enviado por: {r.reporter_name} em {r.created_at}
                  </p>
                  {r.details && <p className="review-text">{r.details}</p>}
                  {r.status === 'Em verificação' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleResolveReport(r.id)}
                    >
                      Marcar como Verificado
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
