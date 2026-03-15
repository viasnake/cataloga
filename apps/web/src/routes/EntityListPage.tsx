import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EntityCard } from '../components/EntityCard';
import { RelationGraph } from '../components/RelationGraph';
import { formatEntityTypeLabel, uiCopy } from '../copy';
import {
  filterEntitiesForViewer,
  getEntityRelations,
  getRelationDegreeMap,
  getSelectedView
} from '../index';
import { useViewerContext } from '../viewer-context';

export const EntityListPage = () => {
  const { bundle } = useViewerContext();
  const navigate = useNavigate();
  const { scopeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = searchParams.get('q') ?? '';
  const filteredView = useMemo(
    () => filterEntitiesForViewer(bundle, searchText, scopeId),
    [bundle, searchText, scopeId]
  );
  const selectedScope = scopeId ? getSelectedView(bundle.graph, scopeId) : undefined;
  const relationDegrees = useMemo(() => getRelationDegreeMap(bundle), [bundle]);
  const visibleEntities = filteredView.entities;
  const spotlightEntity = [...visibleEntities].sort(
    (left, right) => (relationDegrees.get(right.id) ?? 0) - (relationDegrees.get(left.id) ?? 0)
  )[0];
  const spotlightRelations = spotlightEntity ? getEntityRelations(bundle, spotlightEntity.id) : [];
  const availableScopes = bundle.graph.views;

  if (scopeId && !selectedScope) {
    return (
      <section className="status-panel">
        <p className="eyebrow">不明なスコープ</p>
        <h1>{uiCopy.status.scopeNotFoundTitle}</h1>
        <p>{uiCopy.status.scopeNotFoundBody}</p>
        <Link className="primary-button mt-6" to="/explore">
          {uiCopy.labels.allNodes}
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <article className="panel px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <p className="eyebrow">探索</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-[2.8rem]">
                {selectedScope ? selectedScope.title : 'ノードと関係を横断して探索する'}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                {selectedScope?.summary ??
                  '検索、スコープ、関係密度を手掛かりに、bundle 内の network を絞り込みながら探索できます。'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_260px]">
              <label className="space-y-2" htmlFor="entity-search">
                <span className="text-sm font-semibold text-slate-700">{uiCopy.labels.search}</span>
                <input
                  id="entity-search"
                  className="field-input"
                  placeholder={uiCopy.labels.searchPlaceholder}
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

              <label className="space-y-2" htmlFor="scope-select">
                <span className="text-sm font-semibold text-slate-700">{uiCopy.routes.scopes}</span>
                <select
                  className="field-input"
                  id="scope-select"
                  value={scopeId ?? ''}
                  onChange={(event) => {
                    const nextScopeId = event.target.value;
                    const nextQuery = searchText ? `?q=${encodeURIComponent(searchText)}` : '';
                    navigate(
                      nextScopeId ? `/scopes/${nextScopeId}${nextQuery}` : `/explore${nextQuery}`
                    );
                  }}
                >
                  <option value="">{uiCopy.labels.allScopes}</option>
                  {availableScopes.map((scope) => (
                    <option key={scope.id} value={scope.id}>
                      {scope.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="metric-card">
                <span>表示ノード</span>
                <strong>{visibleEntities.length}</strong>
                <p>現在の検索語とスコープに含まれるノード数です。</p>
              </div>
              <div className="metric-card">
                <span>対象タイプ</span>
                <strong>
                  {selectedScope
                    ? selectedScope.entityTypes
                        .map((type) => formatEntityTypeLabel(type))
                        .join(' / ')
                    : uiCopy.labels.allNodes}
                </strong>
                <p>探索対象の型をスコープ単位で切り替えられます。</p>
              </div>
              <div className="metric-card">
                <span>検索クエリ</span>
                <strong>{searchText || '未指定'}</strong>
                <p>絞り込みが空の時は bundle 全体を横断します。</p>
              </div>
            </div>
          </div>
        </article>

        <aside className="panel px-6 py-7">
          <div>
            <p className="eyebrow">スコープ一覧</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              利用可能なスコープ
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {availableScopes.map((scope) => (
              <Link
                key={scope.id}
                className={`scope-card ${scope.id === selectedScope?.id ? 'border-teal-200 bg-teal-50/80' : ''}`}
                to={`/scopes/${scope.id}${searchText ? `?q=${encodeURIComponent(searchText)}` : ''}`}
              >
                <div>
                  <p className="font-semibold text-slate-950">{scope.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {scope.summary ?? '関連の切り口を固定しながら探索できます。'}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  {scope.entityTypes.length}
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.38fr)_360px]">
        <article className="panel px-6 py-7 sm:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">結果レーン</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {visibleEntities.length === 0
                  ? uiCopy.status.noResultsTitle
                  : 'ノードを開いて関係を読む'}
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              {visibleEntities.length}
              {uiCopy.labels.visible}
            </span>
          </div>

          {visibleEntities.length === 0 ? (
            <div className="empty-state-block">
              <p>{uiCopy.status.noResultsBody}</p>
              <button
                className="secondary-button mt-5"
                onClick={() => setSearchParams(new URLSearchParams())}
                type="button"
              >
                {uiCopy.actions.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid gap-5" aria-live="polite">
              {visibleEntities.map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  relationCount={relationDegrees.get(entity.id) ?? 0}
                  scopeId={selectedScope?.id}
                  searchText={searchText}
                />
              ))}
            </div>
          )}
        </article>

        <aside className="space-y-6">
          <section className="panel px-6 py-7">
            <div className="mb-4">
              <p className="eyebrow">関係プレビュー</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                現在の探索で目立つつながり
              </h2>
            </div>
            {spotlightEntity ? (
              <>
                <RelationGraph
                  className="min-h-[420px]"
                  entity={spotlightEntity}
                  entries={spotlightRelations}
                />
                <Link
                  className="secondary-button mt-4"
                  to={`/nodes/${spotlightEntity.id}${scopeId ? `?scope=${scopeId}` : ''}`}
                >
                  {spotlightEntity.title} を開く
                </Link>
              </>
            ) : null}
          </section>

          <section className="panel px-6 py-7">
            <div>
              <p className="eyebrow">現在の範囲</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                この範囲で見えている型
              </h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {Array.from(new Set(visibleEntities.map((entity) => entity.type))).map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {formatEntityTypeLabel(type)}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};
