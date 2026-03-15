import { NavLink, Outlet } from 'react-router-dom';
import { useViewerContext } from '../viewer-context';

export const AppLayout = () => {
  const { bundle } = useViewerContext();
  const primaryView = bundle.graph.views[0];

  return (
    <main className="page-shell">
      <header className="site-header">
        <NavLink className="brand-mark" to="/">
          <span className="brand-chip">Ledra</span>
          <div>
            <strong>Registry Viewer</strong>
            <span>Static-first navigation for operational data.</span>
          </div>
        </NavLink>

        <nav className="site-nav" aria-label="Primary">
          <NavLink className="nav-link" to="/entities">
            Browse entities
          </NavLink>
          {primaryView ? (
            <NavLink className="nav-link" to={`/views/${primaryView.id}`}>
              Explore views
            </NavLink>
          ) : null}
        </nav>

        <div className="header-stats" aria-label="Registry totals">
          <div>
            <span>Entities</span>
            <strong>{bundle.diagnostics.counts.entities}</strong>
          </div>
          <div>
            <span>Views</span>
            <strong>{bundle.diagnostics.counts.views}</strong>
          </div>
        </div>
      </header>

      <Outlet />
    </main>
  );
};
