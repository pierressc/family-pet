import { useState } from 'react';
import { DEMO_ACCOUNTS } from '../data/catalog';

export default function AuthModal({ onClose, onAuthenticate }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Informe e-mail e senha para continuar.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Informe seu nome ou nome do estabelecimento.');
        return;
      }
      if (!lgpdAccepted) {
        setError('É necessário concordar com o termo de consentimento (LGPD).');
        return;
      }
    }

    onAuthenticate({
      name: name.trim() || (role === 'business' ? 'Estabelecimento Parceiro' : email.split('@')[0]),
      email: email.trim().toLowerCase(),
      role,
      placeId: role === 'business' ? 'local-1' : undefined,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-card modal-narrow">
        <div className="modal-header">
          <h2 id="auth-modal-title">
            {mode === 'login' ? 'Entrar no Family Place' : 'Criar conta (LGPD)'}
          </h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar janela">
            ✕
          </button>
        </div>

        <div className="demo-shortcuts">
          <p className="demo-label">Acesso rápido para demonstração na apresentação:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onAuthenticate(DEMO_ACCOUNTS.client);
                onClose();
              }}
            >
              Entrar como Cliente Demo
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onAuthenticate(DEMO_ACCOUNTS.business);
                onClose();
              }}
            >
              Entrar como Estabelecimento Demo
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
          <div className="form-field">
            <label htmlFor="auth-role">Perfil da conta</label>
            <select id="auth-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Cliente (Família / Tutor / Idoso / PCD)</option>
              <option value="business">Estabelecimento (Comércio Local)</option>
            </select>
          </div>

          {mode === 'register' && (
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
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com"
            />
          </div>

          <div className="form-field">
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
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
                Concordo com a coleta mínima de dados apenas para identificação de avaliações e listas
                neste protótipo (LGPD - RD001).
              </span>
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary btn-full">
            {mode === 'login' ? 'Entrar' : 'Concluir cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}
