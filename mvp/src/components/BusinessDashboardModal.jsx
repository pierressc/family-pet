import { useState } from 'react';
import { CATEGORIES, TAG_GROUPS } from '../data/catalog';

export default function BusinessDashboardModal({
  places,
  user,
  onClose,
  onSavePlace,
  onCreatePlace,
}) {
  const initialPlace =
    places.find((p) => p.id === user?.placeId) ||
    places.find((p) => p.ownerEmail === user?.email) ||
    places[0];

  const [selectedId, setSelectedId] = useState(initialPlace.id);
  const [isCreating, setIsCreating] = useState(false);
  const current = places.find((p) => p.id === selectedId) || initialPlace;

  const [form, setForm] = useState({
    name: current.name,
    category: current.category,
    neighborhood: current.neighborhood,
    address: current.address,
    hours: current.hours,
    whatsapp: current.whatsapp,
    website: current.website,
    description: current.description,
    tags: current.tags,
    showcase: current.showcase,
  });

  const [newItemName, setNewItemName] = useState('');
  const [newItemNote, setNewItemNote] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const handleSelectPlace = (id) => {
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
      setSavedNotice('');
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
    setSavedNotice('');
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const toggleShowcaseFav = (itemId) => {
    setForm((prev) => ({
      ...prev,
      showcase: prev.showcase.map((item) =>
        item.id === itemId ? { ...item, favorite: !item.favorite } : item
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
          id: `item-${Date.now()}`,
          name: newItemName.trim(),
          note: newItemNote.trim() || 'Destaque informativo sem checkout',
          favorite: true,
        },
      ],
    }));
    setNewItemName('');
    setNewItemNote('');
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (isCreating) {
      const createdId = onCreatePlace({
        ...form,
        ownerEmail: user?.email || 'parceiro@familyplace.local',
      });
      setIsCreating(false);
      setSelectedId(createdId);
      setSavedNotice('Novo estabelecimento cadastrado e publicado na busca (RF007)!');
      return;
    }
    onSavePlace(selectedId, form);
    setSavedNotice('Perfil, comodidades e vitrine atualizados imediatamente na busca pública (RF007)!');
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="biz-title">
      <div className="modal-card modal-wide">
        <div className="modal-header">
          <div>
            <h2 id="biz-title">Painel do Estabelecimento (RF007)</h2>
            <p className="place-meta">
              Cadastre ou edite tags inclusivas, canais diretos e destaques "Favoritos da Casa".
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar painel">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="stack-form">
          <div className="form-field">
            <label htmlFor="biz-select">Estabelecimento gerenciado</label>
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
              <label htmlFor="biz-name">Nome do estabelecimento</label>
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
              <label htmlFor="biz-wa">WhatsApp (somente dígitos com DDI)</label>
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
            <label htmlFor="biz-desc">Descrição inclusiva</label>
            <textarea
              id="biz-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <fieldset className="tags-fieldset">
            <legend>Checklist de Comodidades (Tags usadas nos filtros combinados)</legend>
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
              {form.showcase.map((item) => (
                <li key={item.id} className="showcase-edit-row">
                  <span>
                    <strong>{item.name}</strong> — {item.note}
                  </span>
                  <button
                    type="button"
                    className={item.favorite ? 'btn-save is-saved' : 'btn-secondary'}
                    onClick={() => toggleShowcaseFav(item.id)}
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

          {savedNotice && <p className="form-success">{savedNotice}</p>}

          <button type="submit" className="btn-primary">
            Salvar Alterações do Estabelecimento
          </button>
        </form>
      </div>
    </div>
  );
}
