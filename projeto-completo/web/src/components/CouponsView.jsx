import { useState } from 'react';
import { apiFetch } from '../utils/api';

export default function CouponsView({
  coupons,
  places,
  user,
  token,
  onCouponChange,
  onRequireAuth,
}) {
  const [filterMode, setFilterMode] = useState('all');
  const [placeId, setPlaceId] = useState(places[0]?.id || 'local-1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('2026-12-31');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleRedeem = async (couponId) => {
    setError('');
    setFeedback('');
    if (!user || user.role !== 'client') {
      onRequireAuth();
      return;
    }
    try {
      const res = await apiFetch(`/api/coupons/${couponId}/redeem`, {
        method: 'POST',
        token,
      });
      setFeedback(`Cupom ${res.code} resgatado! Apresente o código presencialmente no local.`);
      onCouponChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCoupon = async (event) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    try {
      await apiFetch('/api/coupons', {
        method: 'POST',
        token,
        body: { placeId, title, description, code, expiresAt },
      });
      setTitle('');
      setDescription('');
      setCode('');
      setFeedback('Cupom cadastrado no Clube de Fidelidade (SQLite)!');
      onCouponChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const visibleCoupons = coupons.filter((c) => {
    if (filterMode === 'mine') return c.redeemed;
    return true;
  });

  return (
    <section className="coupons-section" aria-labelledby="coupons-heading">
      <div className="section-header-bar">
        <div>
          <h2 id="coupons-heading">Clube de Fidelidade e Cupons (RF012)</h2>
          <p className="place-meta">
            Resgate benefícios gratuitos de estabelecimentos parceiros para apresentar no local.
          </p>
        </div>

        <div className="filter-toggle-group">
          <button
            type="button"
            className={`btn-chip ${filterMode === 'all' ? 'btn-chip-selected' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            Todos os Cupons ({coupons.length})
          </button>
          <button
            type="button"
            className={`btn-chip ${filterMode === 'mine' ? 'btn-chip-selected' : ''}`}
            onClick={() => setFilterMode('mine')}
          >
            Meus Cupons Resgatados ({coupons.filter((c) => c.redeemed).length})
          </button>
        </div>
      </div>

      {feedback && <p className="form-success banner-msg">{feedback}</p>}
      {error && <p className="form-error banner-msg">{error}</p>}

      {user?.role === 'business' && (
        <form onSubmit={handleCreateCoupon} className="publish-card stack-form">
          <h3>Cadastrar novo cupom promocional</h3>
          <div className="two-col-form">
            <div className="form-field">
              <label htmlFor="coupon-place">Estabelecimento</label>
              <select
                id="coupon-place"
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
              <label htmlFor="coupon-title">Título do benefício</label>
              <input
                id="coupon-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: 15% OFF no Almoço em Família"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="coupon-code">Código promocional</label>
              <input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: FAMILY15"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="coupon-exp">Válido até</label>
              <input
                id="coupon-exp"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="coupon-desc">Regras de uso presencial</label>
            <input
              id="coupon-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Válido de terça a sexta apresentando o código no caixa."
            />
          </div>
          <button type="submit" className="btn-primary">
            Publicar Cupom
          </button>
        </form>
      )}

      <div className="coupons-grid">
        {visibleCoupons.map((coupon) => (
          <article
            key={coupon.id}
            className={`coupon-card ${coupon.expired ? 'is-expired' : ''}`}
          >
            <div className="coupon-top">
              <span className="badge-category">{coupon.place_name}</span>
              <span className={`coupon-status ${coupon.expired ? 'status-exp' : 'status-ok'}`}>
                {coupon.expired ? 'Expirado (RD004)' : `Válido até ${coupon.expires_at}`}
              </span>
            </div>
            <h3>{coupon.title}</h3>
            <p className="place-description">{coupon.description}</p>

            <div className="coupon-footer">
              <code className="coupon-code">
                {coupon.redeemed ? coupon.code : 'RESGATE PARA VER CÓDIGO'}
              </code>
              {coupon.redeemed ? (
                <span className="badge-redeemed">✓ Resgatado</span>
              ) : (
                <button
                  type="button"
                  className={coupon.expired ? 'btn-secondary' : 'btn-primary'}
                  disabled={coupon.expired}
                  onClick={() => handleRedeem(coupon.id)}
                >
                  {coupon.expired ? 'Indisponível' : 'Resgatar Cupom'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
