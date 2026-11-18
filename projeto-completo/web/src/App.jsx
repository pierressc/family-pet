import { useCallback, useEffect, useMemo, useState } from 'react';
import AssistantModal from './components/AssistantModal';
import AuthModal from './components/AuthModal';
import BusinessDashboardModal from './components/BusinessDashboardModal';
import CouponsView from './components/CouponsView';
import FavoritesModal from './components/FavoritesModal';
import PlaceCard from './components/PlaceCard';
import PlaceDetailModal from './components/PlaceDetailModal';
import TimelineView from './components/TimelineView';
import { CATEGORIES, TAG_GROUPS } from './data/constants';
import { apiFetch } from './utils/api';

const SESSION_KEY = 'fp_full_session_v2';

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : { user: null, token: null };
    } catch {
      return { user: null, token: null };
    }
  });

  const { user, token } = session;

  const [activeTab, setActiveTab] = useState('explore');
  const [places, setPlaces] = useState([]);
  const [lists, setLists] = useState([]);
  const [posts, setPosts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [onlyFollowingTimeline, setOnlyFollowingTimeline] = useState(false);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');

  const [detailPlaceId, setDetailPlaceId] = useState(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoritesTargetPlace, setFavoritesTargetPlace] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const persistSession = (nextUser, nextToken) => {
    const next = { user: nextUser, token: nextToken };
    setSession(next);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage error
    }
  };

  const loadAllData = useCallback(async () => {
    setApiError('');
    try {
      const [placesRes, favRes, timelineRes, couponsRes] = await Promise.all([
        apiFetch('/api/places', { token }),
        apiFetch('/api/favorites', { token }),
        apiFetch(`/api/timeline?following=${onlyFollowingTimeline}`, { token }),
        apiFetch('/api/coupons', { token }),
      ]);
      setPlaces(placesRes.places || []);
      setLists(favRes.lists || []);
      setPosts(timelineRes.posts || []);
      setCoupons(couponsRes.coupons || []);
    } catch (err) {
      setApiError(
        `Não foi possível conectar ao servidor SQLite: ${err.message}. Verifique se a API está rodando na porta 3001.`
      );
    } finally {
      setLoading(false);
    }
  }, [token, onlyFollowingTimeline]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleLogout = () => {
    persistSession(null, null);
    setBusinessOpen(false);
    setOnlyFollowingTimeline(false);
  };

  const toggleFilterTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const applyQuickCombo = (comboTags) => {
    setActiveTab('explore');
    setSelectedCategory('Todas');
    setSelectedTags(comboTags);
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('Todas');
    setSelectedTags([]);
    setSortBy('relevance');
  };

  const savedPlaceIds = useMemo(() => {
    const ids = new Set();
    for (const l of lists) {
      for (const id of l.placeIds) ids.add(id);
    }
    return ids;
  }, [lists]);

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matched = places.filter((place) => {
      if (selectedCategory !== 'Todas' && place.category !== selectedCategory) {
        return false;
      }
      if (selectedTags.length > 0 && !selectedTags.every((tag) => place.tags.includes(tag))) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${place.name} ${place.neighborhood} ${place.category} ${place.description}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });

    if (sortBy === 'relevance') return matched;
    return [...matched].sort(
      (a, b) => (b.averages?.[sortBy] || 0) - (a.averages?.[sortBy] || 0)
    );
  }, [places, query, selectedCategory, selectedTags, sortBy]);

  const handleToggleFollow = async (placeId) => {
    if (!user || user.role !== 'client') {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await apiFetch(`/api/places/${placeId}/follow`, {
        method: 'POST',
        token,
      });
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId
            ? { ...p, isFollowing: res.isFollowing, followersCount: res.followersCount }
            : p
        )
      );
      if (onlyFollowingTimeline) {
        loadAllData();
      }
    } catch (err) {
      setApiError(err.message);
    }
  };

  const handleCreateList = async (name, criterion, initialPlaceId) => {
    const res = await apiFetch('/api/favorites', {
      method: 'POST',
      token,
      body: { name, criterion, initialPlaceId },
    });
    setLists((prev) => [res.list, ...prev]);
  };

  const handleTogglePlaceInList = async (listId, placeId) => {
    await apiFetch(`/api/favorites/${listId}/toggle`, {
      method: 'POST',
      token,
      body: { placeId },
    });
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        const exists = list.placeIds.includes(placeId);
        return {
          ...list,
          placeIds: exists
            ? list.placeIds.filter((id) => id !== placeId)
            : [...list.placeIds, placeId],
        };
      })
    );
  };

  const handlePlaceUpdated = (updatedPlace, isNew = false) => {
    setPlaces((prev) =>
      isNew
        ? [updatedPlace, ...prev]
        : prev.map((p) => (p.id === updatedPlace.id ? updatedPlace : p))
    );
  };

  const activeDetailPlace = places.find((p) => p.id === detailPlaceId) || null;

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="container header-inner">
          <div className="brand-block">
            <span className="brand-badge">Projeto Completo · React + SQLite</span>
            <h1 className="brand-title">Family Place</h1>
            <p className="brand-subtitle">
              Plataforma comunitária inclusiva para famílias, crianças, pets, idosos e PCDs
            </p>
          </div>

          <nav className="header-nav" aria-label="Ações principais">
            <button
              type="button"
              className="btn-header"
              onClick={() => setAssistantOpen(true)}
            >
              💬 Assistente IA
            </button>

            <button
              type="button"
              className="btn-header"
              onClick={() => {
                setFavoritesTargetPlace(null);
                setFavoritesOpen(true);
              }}
            >
              ★ Favoritos ({lists.length})
            </button>

            {user?.role === 'business' && (
              <button
                type="button"
                className="btn-header btn-header-accent"
                onClick={() => setBusinessOpen(true)}
              >
                ⚙ Painel do Estabelecimento
              </button>
            )}

            {user ? (
              <div className="user-pill">
                <span>
                  {user.name} ({user.role === 'business' ? 'Estabelecimento' : 'Cliente'})
                </span>
                <button type="button" className="btn-logout" onClick={handleLogout}>
                  Sair
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-header btn-header-solid"
                onClick={() => setAuthOpen(true)}
              >
                Entrar / Cadastrar
              </button>
            )}
          </nav>
        </div>

        <div className="container nav-tabs-bar" role="tablist" aria-label="Módulos do sistema">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'explore'}
            className={`nav-tab-btn ${activeTab === 'explore' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            🔍 Explorar Locais ({places.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timeline'}
            className={`nav-tab-btn ${activeTab === 'timeline' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            📰 Timeline Comunitária ({posts.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'coupons'}
            className={`nav-tab-btn ${activeTab === 'coupons' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            🎟️ Clube de Cupons ({coupons.filter((c) => !c.expired).length} ativos)
          </button>
        </div>
      </header>

      <main className="container main-content">
        {apiError && <div className="api-error-banner">{apiError}</div>}

        {loading ? (
          <div className="empty-state">
            <h2>Carregando dados do SQLite...</h2>
          </div>
        ) : activeTab === 'timeline' ? (
          <TimelineView
            posts={posts}
            places={places}
            user={user}
            token={token}
            onlyFollowing={onlyFollowingTimeline}
            onToggleFollowingFilter={setOnlyFollowingTimeline}
            onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
            onOpenPlaceDetail={(id) => setDetailPlaceId(id)}
          />
        ) : activeTab === 'coupons' ? (
          <CouponsView
            coupons={coupons}
            places={places}
            user={user}
            token={token}
            onCouponChange={loadAllData}
            onRequireAuth={() => setAuthOpen(true)}
          />
        ) : (
          <>
            <section className="hero-panel" aria-labelledby="hero-heading">
              <div className="hero-text">
                <h2 id="hero-heading">Combine critérios inclusivos com persistência real em SQLite</h2>
                <p>
                  Busque estabelecimentos por estrutura infantil, acessibilidade, pet friendly,
                  avalie nos <strong>4 pilares</strong>, siga seus locais favoritos na Timeline e
                  resgate cupons gratuitos.
                </p>
              </div>

              <div className="quick-scenarios" aria-label="Combinações rápidas">
                <span className="quick-label">Cenários rápidos:</span>
                <button
                  type="button"
                  className="btn-chip"
                  onClick={() => applyQuickCombo(['Espaço Kids', 'Área Pet Coberta'])}
                >
                  Criança + Pet Coberto
                </button>
                <button
                  type="button"
                  className="btn-chip"
                  onClick={() => applyQuickCombo(['Rampa de Acesso', 'Banheiro Adaptado', 'Baixo Ruído'])}
                >
                  Idoso / PCD + Baixo Ruído
                </button>
                <button
                  type="button"
                  className="btn-chip"
                  onClick={() => applyQuickCombo(['Trocador', 'Rampa de Acesso', 'Aceita Porte Grande'])}
                >
                  Família Completa (Porte G)
                </button>
                <button
                  type="button"
                  className="btn-chip btn-chip-clear"
                  onClick={resetFilters}
                >
                  Ver todos ({places.length})
                </button>
              </div>
            </section>

            <section className="filter-panel" aria-label="Busca e filtros combinados">
              <div className="search-bar-row">
                <div className="search-input-wrap">
                  <label htmlFor="search-query" className="sr-only">
                    Buscar por nome, bairro ou categoria
                  </label>
                  <input
                    id="search-query"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nome, bairro ou tipo de local..."
                  />
                </div>

                <div className="select-wrap">
                  <label htmlFor="category-select">Categoria:</label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-wrap">
                  <label htmlFor="sort-select">Ordenar por pilar:</label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Padrão</option>
                    <option value="kids">Melhor Estrutura Kids</option>
                    <option value="accessibility">Melhor Acessibilidade (PCD/Idosos)</option>
                    <option value="pet">Melhor Pet Friendly</option>
                    <option value="service">Melhor Atendimento / Custo</option>
                  </select>
                </div>
              </div>

              <div className="tag-groups-filter">
                {TAG_GROUPS.map((group) => (
                  <div key={group.pillar} className="filter-group">
                    <span className="filter-group-title">{group.title}</span>
                    <div className="filter-chips">
                      {group.tags.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={active}
                            className={`filter-chip ${active ? 'is-active' : ''}`}
                            onClick={() => toggleFilterTag(tag)}
                          >
                            {active ? `✓ ${tag}` : tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="results-bar">
              <p className="results-summary">
                Mostrando <strong>{filteredPlaces.length}</strong> de{' '}
                <strong>{places.length}</strong> estabelecimentos (SQLite)
                {selectedTags.length > 0 && ` · Filtros ativos: ${selectedTags.join(' + ')}`}
              </p>
              <div className="results-actions">
                {(selectedTags.length > 0 || query || selectedCategory !== 'Todas') && (
                  <button type="button" className="btn-link" onClick={resetFilters}>
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum estabelecimento combina todos esses filtros</h3>
                <p>Experimente remover alguma tag ou consultar o Assistente IA no topo.</p>
                <button type="button" className="btn-primary" onClick={resetFilters}>
                  Mostrar todos os locais
                </button>
              </div>
            ) : (
              <section className="places-grid" aria-label="Estabelecimentos encontrados">
                {filteredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isSavedAnywhere={savedPlaceIds.has(place.id)}
                    onToggleFollow={handleToggleFollow}
                    onOpenDetail={(id) => setDetailPlaceId(id)}
                    onOpenSaveList={(target) => {
                      setFavoritesTargetPlace(target);
                      setFavoritesOpen(true);
                    }}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <p>
            <strong>Family Place — Projeto Completo (React + Node.js + SQLite)</strong> · Requisitos
            ativos implementados: <code>RF001–RF014</code>, <code>NF001–NF005</code> e{' '}
            <code>RD001–RD004</code> (sem pagamentos internos).
          </p>
        </div>
      </footer>

      {activeDetailPlace && (
        <PlaceDetailModal
          place={activeDetailPlace}
          user={user}
          token={token}
          onClose={() => setDetailPlaceId(null)}
          onPlaceUpdated={(updated) => handlePlaceUpdated(updated, false)}
          onToggleFollow={handleToggleFollow}
          onOpenSaveList={(target) => {
            setFavoritesTargetPlace(target);
            setFavoritesOpen(true);
          }}
          onRequireAuth={() => setAuthOpen(true)}
        />
      )}

      {favoritesOpen && (
        <FavoritesModal
          lists={lists}
          places={places}
          user={user}
          targetPlace={favoritesTargetPlace}
          onClose={() => setFavoritesOpen(false)}
          onCreateList={handleCreateList}
          onTogglePlaceInList={handleTogglePlaceInList}
          onOpenPlaceDetail={(id) => setDetailPlaceId(id)}
          onRequireAuth={() => setAuthOpen(true)}
        />
      )}

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuthenticated={(u, t) => persistSession(u, t)}
        />
      )}

      {businessOpen && user?.role === 'business' && (
        <BusinessDashboardModal
          places={places}
          token={token}
          onClose={() => setBusinessOpen(false)}
          onPlaceSaved={handlePlaceUpdated}
        />
      )}

      {assistantOpen && (
        <AssistantModal
          token={token}
          onClose={() => setAssistantOpen(false)}
          onOpenPlaceDetail={(id) => setDetailPlaceId(id)}
        />
      )}
    </div>
  );
}
