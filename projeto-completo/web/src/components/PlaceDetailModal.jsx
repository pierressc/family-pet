import { useState } from 'react';
import { PILLARS } from '../data/constants';
import { apiFetch, buildMapsUrl, buildWhatsAppUrl } from '../utils/api';

export default function PlaceDetailModal({
  place,
  user,
  token,
  onClose,
  onPlaceUpdated,
  onToggleFollow,
  onOpenSaveList,
  onRequireAuth,
}) {
  const [selectedPillarFilter, setSelectedPillarFilter] = useState('all');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactChannel, setContactChannel] = useState(user?.email || '');
  const [contactMsg, setContactMsg] = useState('');
  const [contactFeedback, setContactFeedback] = useState('');

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Acessibilidade alterada ou indisponível');
  const [reportDetails, setReportDetails] = useState('');
  const [reportFeedback, setReportFeedback] = useState('');

  const existingUserReview = user
    ? place.reviews.find((r) => r.authorEmail === user.email)
    : null;

  const [scores, setScores] = useState(
    existingUserReview?.scores || { kids: 5, accessibility: 5, pet: 5, service: 5 }
  );
  const [comment, setComment] = useState(existingUserReview?.comment || '');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const averages = place.averages || { kids: 0, accessibility: 0, pet: 0, service: 0, count: 0 };

  const sortedReviews = [...place.reviews].sort((a, b) => {
    if (selectedPillarFilter === 'all') {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return (b.scores?.[selectedPillarFilter] || 0) - (a.scores?.[selectedPillarFilter] || 0);
  });

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setReviewFeedback('');
    if (!user || user.role !== 'client') {
      onRequireAuth();
      return;
    }
    try {
      const res = await apiFetch(`/api/places/${place.id}/reviews`, {
        method: 'POST',
        token,
        body: { scores, comment },
      });
      onPlaceUpdated(res.place);
      setReviewFeedback(
        existingUserReview
          ? 'Avaliação atualizada no banco SQLite (RD003).'
          : 'Avaliação nos 4 pilares salva no SQLite!'
      );
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setContactFeedback('');
    try {
      await apiFetch(`/api/places/${place.id}/contact`, {
        method: 'POST',
        token,
        body: {
          senderName: contactName,
          senderContact: contactChannel,
          message: contactMsg,
        },
      });
      setContactMsg('');
      setContactFeedback('Solicitação salva no SQLite e visível no painel do estabelecimento!');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    setReportFeedback('');
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      await apiFetch(`/api/places/${place.id}/reports`, {
        method: 'POST',
        token,
        body: { reason: reportReason, details: reportDetails },
      });
      setReportDetails('');
      setReportFeedback('Sinalização registrada com status "Em verificação" (RF014).');
    } catch (err) {
      setErrorMsg(err.message);
    }
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
              className={`btn-save ${place.isFollowing ? 'is-following' : ''}`}
              onClick={() => onToggleFollow(place.id)}
            >
              {place.isFollowing ? '✓ Seguindo' : '+ Seguir'} ({place.followersCount || 0})
            </button>
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
        {errorMsg && <p className="form-error">{errorMsg}</p>}

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
                    {averages.count > 0 ? `${Number(averages[pillar.key]).toFixed(1)} ★` : 'Sem notas'}
                  </strong>
                  <span className="pillar-card-desc">{pillar.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tags e Vitrine */}
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
            <div className="maps-actions-row">
              <a
                href={buildMapsUrl(place.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="link-inline"
              >
                Abrir endereço no Google Maps ↗
              </a>
              <button
                type="button"
                className="btn-link"
                onClick={() => setReportOpen((prev) => !prev)}
              >
                ⚑ Sinalizar dado desatualizado (RF014)
              </button>
            </div>

            {reportOpen && (
              <form onSubmit={handleReportSubmit} className="contact-inline-form">
                <label htmlFor="report-reason">Motivo da sinalização</label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option>Acessibilidade alterada ou indisponível</option>
                  <option>Regras para pets mudaram</option>
                  <option>Espaço kids em manutenção / fechado</option>
                  <option>Horário ou endereço desatualizado</option>
                </select>
                <textarea
                  rows={2}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Descreva objetivamente o que mudou..."
                />
                <button type="submit" className="btn-secondary">
                  Enviar sinalização
                </button>
                {reportFeedback && <p className="form-success">{reportFeedback}</p>}
              </form>
            )}
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
              onClick={() => setContactOpen((prev) => !prev)}
            >
              Solicitar Contato por Formulário
            </button>
          </div>

          {contactOpen && (
            <form onSubmit={handleContactSubmit} className="contact-inline-form">
              <div className="two-col-form">
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Seu nome"
                />
                <input
                  type="text"
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value)}
                  placeholder="Seu WhatsApp ou e-mail"
                />
              </div>
              <textarea
                rows={2}
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="Mensagem rápida (reserva, dúvida de acesso ou evento)..."
                required
              />
              <button type="submit" className="btn-primary">
                Enviar solicitação ao estabelecimento
              </button>
              {contactFeedback && <p className="form-success">{contactFeedback}</p>}
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
            <h3>Relatos da Comunidade ({sortedReviews.length})</h3>
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
