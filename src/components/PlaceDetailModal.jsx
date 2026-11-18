import { useState } from 'react';
import { PILLARS } from '../data/catalog';
import { buildMapsUrl, buildWhatsAppUrl, calculatePillarAverages } from '../utils/ratings';

export default function PlaceDetailModal({
  place,
  user,
  onClose,
  onSubmitReview,
  onOpenSaveList,
  onRequireAuth,
}) {
  const [selectedPillarFilter, setSelectedPillarFilter] = useState('all');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const existingUserReview = user
    ? place.reviews.find((r) => r.authorEmail === user.email)
    : null;

  const [scores, setScores] = useState(
    existingUserReview?.scores || { kids: 5, accessibility: 5, pet: 5, service: 5 }
  );
  const [comment, setComment] = useState(existingUserReview?.comment || '');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const averages = calculatePillarAverages(place.reviews);

  const sortedReviews = [...place.reviews].sort((a, b) => {
    if (selectedPillarFilter === 'all') {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return (b.scores?.[selectedPillarFilter] || 0) - (a.scores?.[selectedPillarFilter] || 0);
  });

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    if (!user || user.role !== 'client') {
      onRequireAuth();
      return;
    }
    onSubmitReview(place.id, {
      authorName: user.name,
      authorEmail: user.email,
      scores,
      comment: comment.trim(),
    });
    setReviewFeedback(
      existingUserReview
        ? 'Sua avaliação foi atualizada com sucesso (RD003).'
        : 'Avaliação nos 4 pilares publicada com sucesso!'
    );
  };

  const handleContactSubmit = (event) => {
    event.preventDefault();
    if (!contactMsg.trim()) return;
    setContactSent(true);
    setContactMsg('');
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="modal-card modal-wide">
        <div className="modal-header">
          <div>
            <span className="badge-category">{place.category}</span>
            <h2 id="detail-title">{place.name}</h2>
            <p className="place-meta">
              {place.address} · {place.hours}
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onOpenSaveList(place)}
            >
              ☆ Salvar em Lista
            </button>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar detalhes">
              ✕
            </button>
          </div>
        </div>

        <p className="detail-description">{place.description}</p>

        {/* 4 Pilares Clicáveis (RF003 + RF009) */}
        <section className="detail-section" aria-labelledby="pilares-heading">
          <div className="section-title-row">
            <h3 id="pilares-heading">Avaliação Multicritério (4 Pilares)</h3>
            <span className="hint-text">Clique em um pilar para filtrar/ordenar os relatos</span>
          </div>
          <div className="pillar-detail-grid">
            {PILLARS.map((pillar) => {
              const active = selectedPillarFilter === pillar.key;
              return (
                <button
                  key={pillar.key}
                  type="button"
                  className={`pillar-card-btn ${active ? 'is-active' : ''}`}
                  onClick={() =>
                    setSelectedPillarFilter(active ? 'all' : pillar.key)
                  }
                >
                  <span className="pillar-card-title">{pillar.label}</span>
                  <strong className="pillar-card-score">
                    {averages.count > 0 ? `${averages[pillar.key].toFixed(1)} ★` : 'Sem notas'}
                  </strong>
                  <span className="pillar-card-desc">{pillar.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tags e Vitrine Informativa */}
        <div className="two-col-detail">
          <section className="detail-section">
            <h3>Comodidades Confirmadas</h3>
            <div className="tag-list">
              {place.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  ✓ {tag}
                </span>
              ))}
            </div>
            <p className="maps-link-wrap">
              <a
                href={buildMapsUrl(place.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="link-inline"
              >
                Abrir endereço no Google Maps ↗
              </a>
            </p>
          </section>

          <section className="detail-section">
            <h3>Vitrine Informativa</h3>
            <p className="scope-notice">
              Sem checkout ou pagamento no sistema (RD002): negocie diretamente com o local.
            </p>
            <ul className="showcase-list">
              {place.showcase.map((item) => (
                <li key={item.id} className="showcase-item">
                  <div>
                    <strong>{item.name}</strong>
                    {item.favorite && <span className="badge-fav">Favorito da Casa</span>}
                    {item.note && <p className="showcase-note">{item.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Contato Direto (RF008) */}
        <section className="detail-section contact-box">
          <h3>Contato Direto com o Estabelecimento</h3>
          <div className="contact-actions">
            <a
              href={buildWhatsAppUrl(place.whatsapp, place.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              Chamar no WhatsApp ↗
            </a>
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Site Oficial ↗
            </a>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setContactOpen((prev) => !prev);
                setContactSent(false);
              }}
            >
              Solicitar Contato por Formulário
            </button>
          </div>

          {contactOpen && (
            <form onSubmit={handleContactSubmit} className="contact-inline-form">
              <label htmlFor="contact-message">Mensagem rápida (reserva, dúvida de acesso ou evento)</label>
              <textarea
                id="contact-message"
                rows={2}
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="Ex.: Gostaria de confirmar disponibilidade de mesa próxima ao espaço kids para sábado às 12h."
                required
              />
              <button type="submit" className="btn-primary">
                Enviar solicitação
              </button>
              {contactSent && (
                <p className="form-success">
                  Solicitação registrada! O estabelecimento retornará pelo canal informado.
                </p>
              )}
            </form>
          )}
        </section>

        {/* Formulário de Avaliação 4 Pilares (RF004) */}
        <section className="detail-section">
          <h3>
            {existingUserReview
              ? 'Atualizar sua avaliação nos 4 pilares'
              : 'Publicar avaliação nos 4 pilares'}
          </h3>
          {!user || user.role !== 'client' ? (
            <div className="auth-prompt-box">
              <p>Entre com uma conta de Cliente para avaliar este local nos 4 pilares.</p>
              <button type="button" className="btn-primary" onClick={onRequireAuth}>
                Entrar / Usar Cliente Demo
              </button>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="review-sliders">
                {PILLARS.map((pillar) => (
                  <div key={pillar.key} className="rating-row">
                    <label htmlFor={`score-${pillar.key}`}>{pillar.label}</label>
                    <select
                      id={`score-${pillar.key}`}
                      value={scores[pillar.key]}
                      onChange={(e) =>
                        setScores((prev) => ({ ...prev, [pillar.key]: Number(e.target.value) }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'estrela' : 'estrelas'} ({'★'.repeat(n)})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="form-field">
                <label htmlFor="review-comment">Relato para outras famílias (opcional)</label>
                <textarea
                  id="review-comment"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como foi a estrutura infantil, acessibilidade para idosos/PCD ou espaço pet..."
                />
              </div>
              {reviewFeedback && <p className="form-success">{reviewFeedback}</p>}
              <button type="submit" className="btn-primary">
                {existingUserReview ? 'Atualizar avaliação' : 'Publicar avaliação'}
              </button>
            </form>
          )}
        </section>

        {/* Lista de Avaliações Filtrada (RF009) */}
        <section className="detail-section">
          <div className="section-title-row">
            <h3>
              Relatos da Comunidade ({sortedReviews.length})
            </h3>
            {selectedPillarFilter !== 'all' && (
              <button
                type="button"
                className="btn-link"
                onClick={() => setSelectedPillarFilter('all')}
              >
                Limpar filtro de pilar
              </button>
            )}
          </div>
          <div className="reviews-list">
            {sortedReviews.map((rev) => (
              <article key={rev.id} className="review-card">
                <div className="review-card-top">
                  <strong>{rev.authorName}</strong>
                  <span className="review-date">{rev.createdAt}</span>
                </div>
                <div className="review-mini-scores">
                  {PILLARS.map((pillar) => (
                    <span
                      key={pillar.key}
                      className={`mini-score ${selectedPillarFilter === pillar.key ? 'highlighted' : ''}`}
                    >
                      {pillar.shortLabel}: {rev.scores[pillar.key]}★
                    </span>
                  ))}
                </div>
                {rev.comment && <p className="review-text">{rev.comment}</p>}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
