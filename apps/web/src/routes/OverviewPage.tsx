import { Link } from 'react-router-dom';
import { useViewerContext } from '../viewer-context';
import { viewerMode } from '../index';

export const OverviewPage = () => {
  const { bundle, bundlePath } = useViewerContext();
  const featuredViews = bundle.graph.views.slice(0, 4);
  const primaryView = featuredViews[0];

  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="section-kicker">Static registry browsing</p>
          <h1>Move from wall-of-panels to a focused path: scan, open, inspect, share.</h1>
          <p className="hero-lede">
            Ledra keeps Git as the source of truth and publishes a modern read-only browser for
            infrastructure records, relations, and curated views.
          </p>

          <div className="hero-actions">
            <Link className="primary-action" to="/entities">
              Browse entities
            </Link>
            {primaryView ? (
              <Link className="secondary-action" to={`/views/${primaryView.id}`}>
                Open {primaryView.title}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="hero-aside panel-surface">
          <p className="section-kicker">Delivery model</p>
          <ul className="fact-list">
            <li>
              <strong>Mode</strong>
              <span>{viewerMode}</span>
            </li>
            <li>
              <strong>Bundle</strong>
              <span>{bundlePath}</span>
            </li>
            <li>
              <strong>Policies</strong>
              <span>{bundle.diagnostics.counts.policies} active checks</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="stats-grid" aria-label="Registry totals">
        <article className="stat-card panel-surface">
          <span>Entities</span>
          <strong>{bundle.diagnostics.counts.entities}</strong>
          <p>Searchable operational records with typed attributes and summaries.</p>
        </article>
        <article className="stat-card panel-surface">
          <span>Relations</span>
          <strong>{bundle.diagnostics.counts.relations}</strong>
          <p>Linked infrastructure objects with source and target references.</p>
        </article>
        <article className="stat-card panel-surface">
          <span>Views</span>
          <strong>{bundle.diagnostics.counts.views}</strong>
          <p>Opinionated entry points for production, staging, DNS, and IPAM review.</p>
        </article>
      </section>

      <section className="content-grid overview-grid">
        <article className="panel-surface emphasis-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Featured views</p>
              <h2>Start from intent, not from a crowded canvas</h2>
            </div>
          </div>

          <div className="view-grid">
            {featuredViews.map((view) => (
              <Link key={view.id} className="view-card" to={`/views/${view.id}`}>
                <span className="view-chip">{view.entityTypes.length} types</span>
                <strong>{view.title}</strong>
                <p>{view.summary ?? 'Open a scoped list tailored to this investigation.'}</p>
              </Link>
            ))}
          </div>
        </article>

        <aside className="panel-surface support-panel">
          <div className="panel-heading compact">
            <div>
              <p className="section-kicker">Why this UI changed</p>
              <h2>Separate exploration from reading</h2>
            </div>
          </div>

          <ul className="stacked-points">
            <li>Entity lists are now optimized for scanning and filtering.</li>
            <li>Entity detail is a shareable page with a stable URL.</li>
            <li>Diagnostics stay visible without stealing the main reading lane.</li>
          </ul>
        </aside>
      </section>
    </>
  );
};
