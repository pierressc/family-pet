import { useState } from 'react';

export default function FavoritesModal({
  lists,
  places,
  targetPlace,
  onClose,
  onCreateList,
  onTogglePlaceInList,
  onOpenPlaceDetail,
}) {
  const [newListName, setNewListName] = useState('');
  const [newCriterion, setNewCriterion] = useState('');

  const handleCreate = (event) => {
    event.preventDefault();
    if (!newListName.trim()) return;
    onCreateList(newListName.trim(), newCriterion.trim() || 'Personalizada', targetPlace?.id);
    setNewListName('');
    setNewCriterion('');
  };

  const placeById = Object.fromEntries(places.map((p) => [p.id, p]));

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="fav-modal-title">
      <div className="modal-card modal-wide">
        <div className="modal-header">
          <div>
            <h2 id="fav-modal-title">
              {targetPlace
                ? `Salvar "${targetPlace.name}" em Listas por Critério`
                : 'Minhas Listas de Favoritos por Critério'}
            </h2>
            <p className="place-meta">
              Organize seus locais pela companhia ou necessidade (RF005).
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar favoritos">
            ✕
          </button>
        </div>

        <form onSubmit={handleCreate} className="create-list-form">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nome da nova lista (ex.: Almoço com Crianças e Pet)"
            aria-label="Nome da nova lista"
          />
          <input
            type="text"
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            placeholder="Critério principal (ex.: Kids + Pet)"
            aria-label="Critério da lista"
          />
          <button type="submit" className="btn-primary">
            + Criar Lista
          </button>
        </form>

        <div className="lists-grid">
          {lists.map((list) => {
            const isInList = targetPlace ? list.placeIds.includes(targetPlace.id) : false;
            return (
              <section key={list.id} className="fav-list-card">
                <div className="fav-list-header">
                  <div>
                    <h3>{list.name}</h3>
                    <span className="fav-criterion">{list.criterion}</span>
                  </div>
                  {targetPlace && (
                    <button
                      type="button"
                      className={isInList ? 'btn-save is-saved' : 'btn-secondary'}
                      onClick={() => onTogglePlaceInList(list.id, targetPlace.id)}
                    >
                      {isInList ? '✓ Na lista (Remover)' : '+ Adicionar aqui'}
                    </button>
                  )}
                </div>

                {list.placeIds.length === 0 ? (
                  <p className="empty-list-note">Nenhum local salvo nesta lista ainda.</p>
                ) : (
                  <ul className="fav-places-ul">
                    {list.placeIds.map((pid) => {
                      const p = placeById[pid];
                      if (!p) return null;
                      return (
                        <li key={pid} className="fav-place-row">
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => {
                              onClose();
                              onOpenPlaceDetail(p.id);
                            }}
                          >
                            {p.name} ({p.neighborhood})
                          </button>
                          <button
                            type="button"
                            className="btn-remove-small"
                            onClick={() => onTogglePlaceInList(list.id, pid)}
                            aria-label={`Remover ${p.name} de ${list.name}`}
                          >
                            Remover
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
