import { useState } from 'react';
import { apiFetch } from '../utils/api';

export default function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemo = async (demoRole) => {
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/demo', {
        method: 'POST',
        body: { role: demoRole },
      });
      onAuthenticated(res.user, res.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { name, email, password, role, lgpdAccepted };
      const res = await apiFetch(endpoint, { method: 'POST', body });
      onAuthenticated(res.user, res.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-card modal-narrow">
        <div className="modal-header">
          <h2 id="auth-modal-title">
            {mode === 'login' ? 'Entrar no Family Place' : 'Criar conta no Banco SQLite'}
          </h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar janela">
            ✕
          </button>
        </div>

        <div className="demo-shortcuts">
          <p className="demo-label">Acesso rápido (contas persistidas no SQLite):</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={() => handleDemo('client')}
            >
              Cliente Demo
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={() => handleDemo('business')}
            >
              Estabelecimento Demo
            </button>
          </div>
        </div>

        <div className="tab-row" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Criar nova conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack-form">
          {mode === 'register' && (
            <>
              <div className="form-field">
                <label htmlFor="auth-role">Perfil da conta</label>
                <select id="auth-role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="client">Cliente (Família / Tutor / Idoso / PCD)</option>
                  <option value="business">Estabelecimento (Comércio Local)</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="auth-name">
                  {role === 'business' ? 'Nome do responsável / comércio' : 'Seu nome'}
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Maria Oliveira"
                  required
                />
              </div>
            </>
          )}

          <div className="form-field">
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="auth-password">Senha (armazenada com hash scrypt)</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          {mode === 'register' && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={lgpdAccepted}
                onChange={(e) => setLgpdAccepted(e.target.checked)}
              />
              <span>
                Concordo com o tratamento mínimo de dados pessoais conforme a LGPD (RD001).
              </span>
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Concluir cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}
