import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EntityCard } from '../components/EntityCard';
import { filterEntitiesForViewer, getSelectedView } from '../index';
import { useViewerContext } from '../viewer-context';

export const EntityListPage = () => {
  const { bundle } = useViewerContext();
  const navigate = useNavigate();
  const { viewId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = searchParams.get('q') ?? '';
  const filteredView = useMemo(
    () => filterEntitiesForViewer(bundle, searchText, viewId),
    [bundle, searchText, viewId]
  );
  const selectedView = viewId ? getSelectedView(bundle.graph, viewId) : undefined;

  const availableViews = bundle.graph.views;
  const highlightedEntities = filteredView.entities.slice(0, 12);

  if (viewId && !selectedView) {
    return (
      <section className="panel-surface content-panel empty-panel">
        <p className="section-kicker">View not found</p>
        <h1>That curated view does not exist.</h1>
        <p>Choose another starting point and continue from the entity catalog.</p>
        <Link className="primary-action" to="/entities">
          Open all entities
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="panel-surface section-hero compact-hero">
        <div>
          <p className="section-kicker">{selectedView ? 'Curated view' : 'Entity explorer'}</p>
          <h1>{selectedView ? selectedView.title : 'Browse the registry as a proper index'}</h1>
          <p className="section-lede">
            {selectedView?.summary ??
              'Search across typed records, then open each entity in a dedicated detail page.'}
          </p>
        </div>

        <div className="hero-meta-grid">
          <div>
            <span>Results</span>
            <strong>{filteredView.entities.length}</strong>
          </div>
          <div>
            <span>Scope</span>
            <strong>
              {selectedView ? selectedView.entityTypes.join(', ') : 'All entity types'}
            </strong>
          </div>
        </div>
      </section>

      <section className="toolbar-panel panel-surface">
        <label className="field-block" htmlFor="entity-search">
          <span>Search</span>
          <input
            id="entity-search"
            placeholder="Search titles, ids, tags, or attributes"
            value={searchText}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              if (event.target.value) {
                next.set('q', event.target.value);
              } else {
                next.delete('q');
              }

              setSearchParams(next, { replace: true });
            }}
          />
        </label>

        <label className="field-block" htmlFor="view-select">
          <span>View</span>
          <select
            id="view-select"
            value={viewId ?? ''}
            onChange={(event) => {
              const nextViewId = event.target.value;
              const nextQuery = searchText ? `?q=${encodeURIComponent(searchText)}` : '';
              navigate(nextViewId ? `/views/${nextViewId}${nextQuery}` : `/entities${nextQuery}`);
            }}
          >
            <option value="">All entities</option>
            {availableViews.map((view) => (
              <option key={view.id} value={view.id}>
                {view.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="content-grid list-page-grid">
        <div className="panel-surface content-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Entity results</p>
              <h2>
                {filteredView.entities.length === 0 ? 'No matching entities' : 'Open an entity'}
              </h2>
            </div>
            <span className="pill-note">{filteredView.entities.length} visible</span>
          </div>

          {filteredView.entities.length === 0 ? (
            <div className="empty-state-block">
              <p>No entity matches the current search and view filters.</p>
              <button
                className="ghost-action"
                onClick={() => setSearchParams(new URLSearchParams())}
                type="button"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="entity-grid" aria-live="polite">
              {filteredView.entities.map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  searchText={searchText}
                  viewId={selectedView?.id}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="list-sidebar">
          <section className="panel-surface support-panel sticky-panel">
            <div className="panel-heading compact">
              <div>
                <p className="section-kicker">Available views</p>
                <h2>Jump by investigation</h2>
              </div>
            </div>

            <div className="view-stack">
              {availableViews.map((view) => (
                <Link
                  key={view.id}
                  className={view.id === selectedView?.id ? 'view-row current' : 'view-row'}
                  to={`/views/${view.id}`}
                >
                  <strong>{view.title}</strong>
                  <span>{view.summary ?? 'Scoped records for a specific browsing task.'}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel-surface support-panel">
            <div className="panel-heading compact">
              <div>
                <p className="section-kicker">Quick preview</p>
                <h2>What is in the current slice</h2>
              </div>
            </div>
            <ul className="stacked-entity-list">
              {highlightedEntities.map((entity) => (
                <li key={entity.id}>
                  <strong>{entity.title}</strong>
                  <span>{entity.type}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </>
  );
};
