import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <section className="panel-surface content-panel empty-panel">
      <p className="section-kicker">Route not found</p>
      <h1>This page is outside the published viewer routes.</h1>
      <p>Return to the overview or continue from the entity catalog.</p>
      <div className="hero-actions">
        <Link className="primary-action" to="/">
          Go to overview
        </Link>
        <Link className="secondary-action" to="/entities">
          Browse entities
        </Link>
      </div>
    </section>
  );
};
