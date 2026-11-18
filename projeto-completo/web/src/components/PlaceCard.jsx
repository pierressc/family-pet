import { PILLARS } from '../data/constants';

export default function PlaceCard({
  place,
  onOpenDetail,
  onOpenSaveList,
  onToggleFollow,
  isSavedAnywhere,
}) {
  const averages = place.averages || { kids: 0, accessibility: 0, pet: 0, service: 0, count: 0 };

  return (
    <article className="place-card" aria-labelledby={`place-title-${place.id}`}>
      <div className="place-card-header">
        <div>
          <span className="badge-category">{place.category}</span>
          <h3 id={`place-title-${place.id}`} className="place-title">
            {place.name}
          </h3>
          <p className="place-meta">
            {place.neighborhood} · {place.hours}
          </p>
        </div>
        <div className="card-top-actions">
          <button
            type="button"
            className={`btn-save ${place.isFollowing ? 'is-following' : ''}`}
            onClick={() => onToggleFollow(place.id)}
            title="Seguir estabelecimento (RF010)"
          >
            {place.isFollowing ? '✓ Seguindo' : '+ Seguir'} ({place.followersCount || 0})
          </button>
          <button
            type="button"
            className={`btn-save ${isSavedAnywhere ? 'is-saved' : ''}`}
            onClick={() => onOpenSaveList(place)}
            aria-label={`Salvar ${place.name} em lista de favoritos`}
          >
            {isSavedAnywhere ? '★ Salvo' : '☆ Favoritar'}
          </button>
        </div>
      </div>

      <p className="place-description">{place.description}</p>

      <div className="pillar-grid" aria-label="Notas por pilar">
        {PILLARS.map((pillar) => (
          <div key={pillar.key} className="pillar-chip">
            <span className="pillar-name">{pillar.shortLabel}</span>
            <span className="pillar-score">
              {averages.count > 0 ? `${Number(averages[pillar.key]).toFixed(1)} ★` : 'Novo'}
            </span>
          </div>
        ))}
      </div>

      <div className="tag-list" aria-label="Comodidades confirmadas">
        {place.tags.slice(0, 5).map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
          </span>
        ))}
        {place.tags.length > 5 && (
          <span className="tag-pill tag-more">+{place.tags.length - 5} itens</span>
        )}
      </div>

      <div className="place-card-footer">
        <span className="review-count">
          {averages.count} {averages.count === 1 ? 'avaliação' : 'avaliações'}
        </span>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onOpenDetail(place.id)}
        >
          Ver detalhes e contato
        </button>
      </div>
    </article>
  );
}
