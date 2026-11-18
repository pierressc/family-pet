import { useState } from 'react';
import { POST_IMAGE_PRESETS } from '../data/constants';
import { apiFetch } from '../utils/api';

export default function TimelineView({
  posts,
  places,
  user,
  token,
  onlyFollowing,
  onToggleFollowingFilter,
  onPostCreated,
  onOpenPlaceDetail,
}) {
  const [placeId, setPlaceId] = useState(places[0]?.id || 'local-1');
  const [category, setCategory] = useState('Evento');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState(POST_IMAGE_PRESETS[0].url);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePublish = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/timeline', {
        method: 'POST',
        token,
        body: { placeId, category, content, imageUrl },
      });
      onPostCreated(res.post);
      setContent('');
      setSuccess('Publicação registrada na Timeline comunitária (SQLite)!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="timeline-section" aria-labelledby="timeline-heading">
      <div className="section-header-bar">
        <div>
          <h2 id="timeline-heading">Timeline da Comunidade (RF011)</h2>
          <p className="place-meta">
            Novidades, eventos inclusivos e promoções publicadas pelos estabelecimentos (texto até 280 caracteres + 1 imagem + categoria).
          </p>
        </div>

        {user && (
          <div className="filter-toggle-group">
            <button
              type="button"
              className={`btn-chip ${!onlyFollowing ? 'btn-chip-selected' : ''}`}
              onClick={() => onToggleFollowingFilter(false)}
            >
              Todos os Locais
            </button>
            <button
              type="button"
              className={`btn-chip ${onlyFollowing ? 'btn-chip-selected' : ''}`}
              onClick={() => onToggleFollowingFilter(true)}
            >
              Apenas Seguindo (RF010)
            </button>
          </div>
        )}
      </div>

      {user?.role === 'business' && (
        <form onSubmit={handlePublish} className="publish-card stack-form">
          <h3>Publicar atualização na Timeline</h3>
          <div className="two-col-form">
            <div className="form-field">
              <label htmlFor="post-place">Estabelecimento</label>
              <select
                id="post-place"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
              >
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="post-cat">Categoria (RD004)</label>
              <select
                id="post-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Evento">Evento</option>
                <option value="Promoção">Promoção</option>
                <option value="Novidade">Novidade</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="post-content">
              Texto curto ({content.length}/280 caracteres)
            </label>
            <textarea
              id="post-content"
              rows={2}
              maxLength={280}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Divulgue um evento inclusivo, nova estrutura ou promoção especial..."
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="post-image-preset">Imagem da publicação (1 imagem)</label>
            <select
              id="post-image-preset"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            >
              {POST_IMAGE_PRESETS.map((preset) => (
                <option key={preset.label} value={preset.url}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <button type="submit" className="btn-primary">
            Publicar na Timeline
          </button>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma publicação encontrada neste filtro</h3>
          <p>Siga estabelecimentos na aba Explorar para acompanhar as novidades deles aqui.</p>
        </div>
      ) : (
        <div className="timeline-grid">
          {posts.map((post) => (
            <article key={post.id} className="timeline-card">
              <div className="timeline-card-top">
                <div>
                  <span className="badge-category">{post.category}</span>
                  <h3 className="timeline-place-name">{post.place_name}</h3>
                  <span className="place-meta">
                    {post.place_neighborhood} · {post.created_at}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onOpenPlaceDetail(post.place_id)}
                >
                  Ver Local
                </button>
              </div>

              <p className="timeline-content">{post.content}</p>
              <img
                src={post.image_url}
                alt={`Imagem da publicação de ${post.place_name}`}
                className="timeline-image"
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
