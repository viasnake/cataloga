import { useEffect, useState } from 'react';
import type { LedraBundle } from '@ledra/types';
import { Route, Routes } from 'react-router-dom';
import { loadBundleFromUrl, DEFAULT_BUNDLE_PATH } from './index';
import { AppLayout } from './components/AppLayout';
import { EntityDetailPage } from './routes/EntityDetailPage';
import { EntityListPage } from './routes/EntityListPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { OverviewPage } from './routes/OverviewPage';
import { ViewerProvider } from './viewer-context';
import './styles.css';

type AppState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; bundlePath: string; bundle: LedraBundle };

const LoadingScreen = () => (
  <main className="page-shell standalone-shell">
    <section className="panel-surface status-panel">
      <p className="section-kicker">Ledra Viewer</p>
      <h1>Loading the published registry bundle.</h1>
      <p>The interface is preparing the static dataset and route map.</p>
    </section>
  </main>
);

const ErrorScreen = ({ message }: { message: string }) => (
  <main className="page-shell standalone-shell">
    <section className="panel-surface status-panel error-panel">
      <p className="section-kicker">Bundle load failed</p>
      <h1>The viewer could not open `/bundle.json`.</h1>
      <p>{message}</p>
    </section>
  </main>
);

const App = () => {
  const [state, setState] = useState<AppState>({ status: 'loading' });

  useEffect(() => {
    void loadBundleFromUrl(DEFAULT_BUNDLE_PATH)
      .then((bundle) => {
        setState({ status: 'ready', bundle, bundlePath: DEFAULT_BUNDLE_PATH });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load registry bundle.';
        setState({ status: 'error', message });
      });
  }, []);

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (state.status === 'error') {
    return <ErrorScreen message={state.message} />;
  }

  return (
    <ViewerProvider value={{ bundle: state.bundle, bundlePath: state.bundlePath }}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="entities" element={<EntityListPage />} />
          <Route path="entities/:entityId" element={<EntityDetailPage />} />
          <Route path="views/:viewId" element={<EntityListPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ViewerProvider>
  );
};

export default App;
