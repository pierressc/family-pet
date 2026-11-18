import { useMemo, useState } from 'react';
import AuthModal from './components/AuthModal';
import BusinessDashboardModal from './components/BusinessDashboardModal';
import FavoritesModal from './components/FavoritesModal';
import PlaceCard from './components/PlaceCard';
import PlaceDetailModal from './components/PlaceDetailModal';
import {
  CATEGORIES,
  INITIAL_LISTS,
  INITIAL_PLACES,
  TAG_GROUPS,
} from './data/catalog';
import { calculatePillarAverages, loadStoredJson, saveStoredJson } from './utils/ratings';

const STORAGE_KEYS = {
  places: 'fp_mvp_places_v1',
  lists: 'fp_mvp_lists_v1',
  user: 'fp_mvp_user_v1',
};

export default function App() {
  const [places, setPlaces] = useState(() => loadStoredJson(STORAGE_KEYS.places, INITIAL_PLACES));
  const [lists, setLists] = useState(() => loadStoredJson(STORAGE_KEYS.lists, INITIAL_LISTS));
  const [user, setUser] = useState(() => loadStoredJson(STORAGE_KEYS.user, null));

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');

  const [detailPlaceId, setDetailPlaceId] = useState(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoritesTargetPlace, setFavoritesTargetPlace] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);

  const updatePlaces = (updater) => {
    setPlaces((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStoredJson(STORAGE_KEYS.places, next);
      return next;
    });
  };

  const updateLists = (updater) => {
    setLists((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStoredJson(STORAGE_KEYS.lists, next);
      return next;
    });
  };

  const handleAuthenticate = (account) => {
    setUser(account);
    saveStoredJson(STORAGE_KEYS.user, account);
  };

  const handleLogout = () => {
    setUser(null);
    saveStoredJson(STORAGE_KEYS.user, null);
    setBusinessOpen(false);
  };

  const toggleFilterTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const applyQuickCombo = (comboTags) => {
    setSelectedCategory('Todas');
    setSelectedTags(comboTags);
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('Todas');
    setSelectedTags([]);
    setSortBy('relevance');
  };

  const handleResetDemoData = () => {
    updatePlaces(INITIAL_PLACES);
    updateLists(INITIAL_LISTS);
    resetFilters();
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
      if (
        selectedTags.length > 0 &&
        !selectedTags.every((tag) => place.tags.includes(tag))
      ) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${place.name} ${place.neighborhood} ${place.category} ${place.description}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    if (sortBy === 'relevance') return matched;

    return [...matched].sort((a, b) => {
      const avgA = calculatePillarAverages(a.reviews);
      const avgB = calculatePillarAverages(b.reviews);
      return (avgB[sortBy] || 0) - (avgA[sortBy] || 0);
    });
  }, [places, query, selectedCategory, selectedTags, sortBy]);

  const handleSubmitReview = (placeId, payload) => {
    const today = new Date().toISOString().slice(0, 10);
    updatePlaces((prev) =>
      prev.map((place) => {
        if (place.id !== placeId) return place;
        const idx = place.reviews.findIndex((r) => r.authorEmail === payload.authorEmail);
        const nextReview = {
          id: idx >= 0 ? place.reviews[idx].id : `rev-${Date.now()}`,
          authorName: payload.authorName,
          authorEmail: payload.authorEmail,
          createdAt: today,
          scores: payload.scores,
          comment: payload.comment,
        };
        const nextReviews =
          idx >= 0
            ? place.reviews.map((r, i) => (i === idx ? nextReview : r))
            : [nextReview, ...place.reviews];
        return { ...place, reviews: nextReviews };
      })
    );
  };

  const handleCreateList = (name, criterion, initialPlaceId) => {
    const newList = {
      id: `list-${Date.now()}`,
      name,
      criterion,
      placeIds: initialPlaceId ? [initialPlaceId] : [],
    };
    updateLists((prev) => [newList, ...prev]);
  };

  const handleTogglePlaceInList = (listId, placeId) => {
    updateLists((prev) =>
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

  const handleSaveBusinessPlace = (placeId, updatedFields) => {
    updatePlaces((prev) =>
      prev.map((place) => (place.id === placeId ? { ...place, ...updatedFields } : place))
    );
  };

  const handleCreateBusinessPlace = (newPlaceFields) => {
    const newId = `local-${Date.now()}`;
    const newPlace = {
      id: newId,
      ...newPlaceFields,
      reviews: [],
    };
    updatePlaces((prev) => [newPlace, ...prev]);
    return newId;
  };

  const activeDetailPlace = places.find((p) => p.id === detailPlaceId) || null;

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="container header-inner">
          <div className="brand-block">
            <span className="brand-badge">MVP · Histórias Must</span>
            <h1 className="brand-title">Family Place</h1>
            <p className="brand-subtitle">
              Guia comunitário para famílias com crianças, pets, idosos e PCDs
            </p>
          </div>

          <nav className="header-nav" aria-label="Ações da conta e favoritos">
            <button
              type="button"
              className="btn-header"
              onClick={() => {
                setFavoritesTargetPlace(null);
                setFavoritesOpen(true);
              }}
            >
              ★ Favoritos ({lists.length} listas)
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
      </header>

      <main className="container main-content">
        {/* Hero / Quick Scenarios */}
        <section className="hero-panel" aria-labelledby="hero-heading">
          <div className="hero-text">
            <h2 id="hero-heading">
              Combine necessidades reais antes de sair de casa
            </h2>
            <p>
              Filtre por estrutura infantil, acessibilidade, receptividade pet e consulte notas
              separadas nos <strong>4 pilares</strong>. Sem pagamento interno: contato direto no
              WhatsApp ou site do comércio local.
            </p>
          </div>

          <div className="quick-scenarios" aria-label="Combinações rápidas de busca">
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
            <button type="button" className="btn-chip btn-chip-clear" onClick={resetFilters}>
              Ver todos ({places.length})
            </button>
          </div>
        </section>

        {/* Search & Combined Filters (RF001) */}
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

        {/* Results Bar */}
        <div className="results-bar">
          <p className="results-summary">
            Mostrando <strong>{filteredPlaces.length}</strong> de{' '}
            <strong>{places.length}</strong> estabelecimentos inclusivos
            {selectedTags.length > 0 && ` · Filtros ativos: ${selectedTags.join(' + ')}`}
          </p>
          <div className="results-actions">
            {selectedTags.length > 0 || query || selectedCategory !== 'Todas' ? (
              <button type="button" className="btn-link" onClick={resetFilters}>
                Limpar filtros
              </button>
            ) : null}
            <button type="button" className="btn-link" onClick={handleResetDemoData}>
              Restaurar dados iniciais
            </button>
          </div>
        </div>

        {/* Listing Grid */}
        {filteredPlaces.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum estabelecimento combina todos esses filtros no momento</h3>
            <p>
              Tente remover uma das tags combinadas ou limpar o campo de busca para ver mais opções
              da comunidade.
            </p>
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
                onOpenDetail={(id) => setDetailPlaceId(id)}
                onOpenSaveList={(target) => {
                  setFavoritesTargetPlace(target);
                  setFavoritesOpen(true);
                }}
              />
            ))}
          </section>
        )}
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <p>
            <strong>Family Place MVP</strong> · Cobre os requisitos Essenciais (Must): Busca
            Combinada (<code>RF001</code>), Perfil &amp; 4 Pilares (<code>RF002–RF004</code>,{' '}
            <code>RF009</code>), Favoritos por Critério (<code>RF005</code>), Contas e Painel (
            <code>RF006–RF007</code>) e Contato Direto sem Checkout (<code>RF008</code>,{' '}
            <code>RD002</code>).
          </p>
        </div>
      </footer>

      {activeDetailPlace && (
        <PlaceDetailModal
          place={activeDetailPlace}
          user={user}
          onClose={() => setDetailPlaceId(null)}
          onSubmitReview={handleSubmitReview}
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
          targetPlace={favoritesTargetPlace}
          onClose={() => setFavoritesOpen(false)}
          onCreateList={handleCreateList}
          onTogglePlaceInList={handleTogglePlaceInList}
          onOpenPlaceDetail={(id) => setDetailPlaceId(id)}
        />
      )}

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuthenticate={handleAuthenticate}
        />
      )}

      {businessOpen && user?.role === 'business' && (
        <BusinessDashboardModal
          places={places}
          user={user}
          onClose={() => setBusinessOpen(false)}
          onSavePlace={handleSaveBusinessPlace}
          onCreatePlace={handleCreateBusinessPlace}
        />
      )}
    </div>
  );
}
