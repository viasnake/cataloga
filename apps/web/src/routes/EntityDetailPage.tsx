import { Link, createSearchParams, useParams, useSearchParams } from 'react-router-dom';
import { getEntityById, getEntityRelations, getSelectedView } from '../index';
import { useViewerContext } from '../viewer-context';

const formatValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
};

export const EntityDetailPage = () => {
  const { bundle } = useViewerContext();
  const { entityId } = useParams();
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get('view') ?? undefined;
  const searchText = searchParams.get('q') ?? undefined;
  const selectedView = getSelectedView(bundle.graph, viewId);
  const entity = getEntityById(bundle, entityId);

  const returnPath = selectedView ? `/views/${selectedView.id}` : '/entities';
  const returnSearch = createSearchParams({
    ...(searchText ? { q: searchText } : {})
  }).toString();
  const relatedRelations = entity ? getEntityRelations(bundle, entity.id) : [];

  if (!entity) {
    return (
      <section className="panel-surface content-panel empty-panel">
        <p className="section-kicker">Entity not found</p>
        <h1>The requested entity does not exist in this bundle.</h1>
        <p>Return to the catalog and continue from a known record.</p>
        <Link
          className="primary-action"
          to={`${returnPath}${returnSearch ? `?${returnSearch}` : ''}`}
        >
          Back to results
        </Link>
      </section>
    );
  }

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Overview</Link>
        <span>/</span>
        <Link to={`${returnPath}${returnSearch ? `?${returnSearch}` : ''}`}>
          {selectedView ? selectedView.title : 'Entities'}
        </Link>
        <span>/</span>
        <span>{entity.title}</span>
      </nav>

      <section className="detail-hero panel-surface">
        <div className="detail-hero-copy">
          <p className="section-kicker">{entity.type}</p>
          <h1>{entity.title}</h1>
          <p className="section-lede">{entity.summary ?? 'This record has no summary yet.'}</p>

          <div className="hero-actions">
            <Link
              className="primary-action"
              to={`${returnPath}${returnSearch ? `?${returnSearch}` : ''}`}
            >
              Back to results
            </Link>
            {selectedView ? (
              <Link className="secondary-action" to={`/views/${selectedView.id}`}>
                Open {selectedView.title}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="detail-hero-meta panel-surface inset-panel">
          <ul className="fact-list">
            <li>
              <strong>Entity ID</strong>
              <span>{entity.id}</span>
            </li>
            <li>
              <strong>Relations</strong>
              <span>{relatedRelations.length}</span>
            </li>
            <li>
              <strong>Source file</strong>
              <span>{entity.sourceFilePath}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="content-grid detail-page-grid">
        <article className="panel-surface content-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Attributes</p>
              <h2>Typed fields</h2>
            </div>
            <span className="pill-note">{Object.keys(entity.attributes).length} fields</span>
          </div>

          <dl className="attribute-grid">
            {Object.entries(entity.attributes).map(([key, value]) => (
              <div key={key} className="attribute-card">
                <dt>{key}</dt>
                <dd>{formatValue(value)}</dd>
              </div>
            ))}
          </dl>

          <div className="panel-divider" />

          <div className="panel-heading detail-section-heading">
            <div>
              <p className="section-kicker">Relations</p>
              <h2>Context around this record</h2>
            </div>
          </div>

          {relatedRelations.length === 0 ? (
            <p className="muted-copy">No relations reference this entity in the current bundle.</p>
          ) : (
            <ul className="relation-list">
              {relatedRelations.map(({ direction, relation, relatedEntity }) => {
                const relationSearch = createSearchParams({
                  ...(viewId ? { view: viewId } : {}),
                  ...(searchText ? { q: searchText } : {})
                }).toString();

                return (
                  <li key={`${direction}-${relation.id}`} className="relation-card">
                    <div>
                      <span className="relation-direction">
                        {direction === 'outgoing' ? 'Outgoing' : 'Incoming'} relation
                      </span>
                      <strong>{relation.type}</strong>
                    </div>
                    <div className="relation-target">
                      {relatedEntity ? (
                        <Link
                          to={`/entities/${relatedEntity.id}${relationSearch ? `?${relationSearch}` : ''}`}
                        >
                          {relatedEntity.title}
                        </Link>
                      ) : (
                        <span>
                          {direction === 'outgoing' ? relation.target.id : relation.source.id}
                        </span>
                      )}
                      <small>
                        {direction === 'outgoing' ? relation.target.id : relation.source.id}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <aside className="detail-sidebar">
          {entity.tags.length > 0 ? (
            <section className="panel-surface support-panel sticky-panel">
              <div className="panel-heading compact">
                <div>
                  <p className="section-kicker">Tags</p>
                  <h2>Classification</h2>
                </div>
              </div>
              <ul className="tag-list large">
                {entity.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="panel-surface support-panel">
            <div className="panel-heading compact">
              <div>
                <p className="section-kicker">Bundle context</p>
                <h2>About this dataset</h2>
              </div>
            </div>
            <ul className="stacked-points tight">
              <li>{bundle.diagnostics.counts.entities} entities are available in this snapshot.</li>
              <li>
                {bundle.diagnostics.counts.relations} relations connect records across the graph.
              </li>
              <li>All content is published as a static read-only bundle.</li>
            </ul>
          </section>
        </aside>
      </section>
    </>
  );
};
