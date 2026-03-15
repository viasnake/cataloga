import { Link } from 'react-router-dom';
import { uiCopy } from '../copy';

export const NotFoundPage = () => {
  return (
    <section className="status-panel">
      <p className="eyebrow">ページ未検出</p>
      <h1>{uiCopy.status.notFoundTitle}</h1>
      <p>{uiCopy.status.notFoundBody}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="primary-button" to="/">
          {uiCopy.actions.openWorkspace}
        </Link>
        <Link className="secondary-button" to="/explore">
          {uiCopy.actions.openExplore}
        </Link>
      </div>
    </section>
  );
};
