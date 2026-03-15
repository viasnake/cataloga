import { NavLink, Outlet, useParams, useSearchParams } from 'react-router-dom';
import { getSelectedView, viewerMode } from '../index';
import { useViewerContext } from '../viewer-context';
import { formatGeneratedAt, uiCopy } from '../copy';
import { cn } from '../lib/cn';

const navClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10'
      : 'text-slate-600 hover:bg-white hover:text-slate-950'
  );

export const AppLayout = () => {
  const { bundle, bundlePath } = useViewerContext();
  const { scopeId } = useParams();
  const [searchParams] = useSearchParams();
  const activeScopeId = scopeId ?? searchParams.get('scope') ?? undefined;
  const selectedScope = activeScopeId ? getSelectedView(bundle.graph, activeScopeId) : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <header className="topbar-blur sticky top-4 z-20 mb-6 overflow-hidden rounded-[30px] border border-white/70 bg-white/78 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        <div className="flex flex-col gap-5 px-5 py-5 lg:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <NavLink className="flex items-center gap-4" to="/">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black tracking-[0.2em] text-white">
                  L
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-950">
                    {uiCopy.brand.title}
                  </p>
                  <p className="text-sm text-slate-500">{uiCopy.brand.subtitle}</p>
                </div>
              </NavLink>

              <div className="hidden h-10 w-px bg-slate-200 lg:block" />

              <div className="flex flex-wrap items-center gap-2">
                <NavLink className={navClassName} end to="/">
                  {uiCopy.nav.workspace}
                </NavLink>
                <NavLink className={navClassName} to="/explore">
                  {uiCopy.nav.explore}
                </NavLink>
                {selectedScope ? (
                  <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
                    {uiCopy.labels.currentScope}: {selectedScope.title}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="data-chip">
                <span>{uiCopy.labels.generatedAt}</span>
                <strong>{formatGeneratedAt(bundle.generatedAt)}</strong>
              </div>
              <div className="data-chip">
                <span>{uiCopy.labels.mode}</span>
                <strong>{viewerMode}</strong>
              </div>
              <div className="data-chip">
                <span>{uiCopy.labels.entities}</span>
                <strong>{bundle.diagnostics.counts.entities}</strong>
              </div>
              <div className="data-chip">
                <span>{uiCopy.labels.relations}</span>
                <strong>{bundle.diagnostics.counts.relations}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              {uiCopy.labels.sourceBundle}
            </span>
            <code className="truncate font-mono text-xs text-slate-500">{bundlePath}</code>
          </div>
        </div>
      </header>

      <Outlet />
    </main>
  );
};
