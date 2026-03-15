import { useMemo, useState } from 'react';
import {
  Link,
  createSearchParams,
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom';
import { RelationGraph } from '../components/RelationGraph';
import { formatAttributeValue, formatEntityTypeLabel, uiCopy } from '../copy';
import { getEntityById, getEntityRelations, getSelectedView } from '../index';
import { useViewerContext } from '../viewer-context';
import { cn } from '../lib/cn';

export const EntityDetailPage = () => {
  const { bundle } = useViewerContext();
  const navigate = useNavigate();
  const { entityId } = useParams();
  const [searchParams] = useSearchParams();
  const scopeId = searchParams.get('scope') ?? undefined;
  const searchText = searchParams.get('q') ?? undefined;
  const selectedScope = getSelectedView(bundle.graph, scopeId);
  const entity = getEntityById(bundle, entityId);
  const [activeRelationId, setActiveRelationId] = useState<string | undefined>(undefined);

  const returnPath = selectedScope ? `/scopes/${selectedScope.id}` : '/explore';
  const returnSearch = createSearchParams({
    ...(searchText ? { q: searchText } : {})
  }).toString();
  const relatedRelations = entity ? getEntityRelations(bundle, entity.id) : [];

  const groupedRelations = useMemo(() => {
    return {
      incoming: relatedRelations.filter((entry) => entry.direction === 'incoming'),
      outgoing: relatedRelations.filter((entry) => entry.direction === 'outgoing')
    };
  }, [relatedRelations]);

  if (!entity) {
    return (
      <section className="status-panel">
        <p className="eyebrow">不明なノード</p>
        <h1>{uiCopy.status.nodeNotFoundTitle}</h1>
        <p>{uiCopy.status.nodeNotFoundBody}</p>
        <Link
          className="primary-button mt-6"
          to={`${returnPath}${returnSearch ? `?${returnSearch}` : ''}`}
        >
          {uiCopy.actions.backToResults}
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
      >
        <Link className="transition hover:text-slate-900" to="/">
          {uiCopy.routes.overview}
        </Link>
        <span>/</span>
        <Link
          className="transition hover:text-slate-900"
          to={`${returnPath}${returnSearch ? `?${returnSearch}` : ''}`}
        >
          {selectedScope ? selectedScope.title : uiCopy.routes.explore}
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">{entity.title}</span>
      </nav>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.32fr)_360px]">
        <article className="panel px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-4">
                <p className="eyebrow">ノード詳細</p>
                <div className="space-y-3">
                  <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-sky-800 uppercase">
                    {formatEntityTypeLabel(entity.type)}
                  </span>
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-[2.9rem]">
                    {entity.title}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600">
                    {entity.summary ?? 'このノードには説明文がまだありません。'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  className="secondary-button"
                  to={`${returnPath}${returnSearch ? `?${returnSearch}` : ''}`}
                >
                  {uiCopy.actions.backToResults}
                </Link>
                {selectedScope ? (
                  <Link
                    className="primary-button"
                    to={`/scopes/${selectedScope.id}${returnSearch ? `?${returnSearch}` : ''}`}
                  >
                    {selectedScope.title}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="metric-card">
                <span>ノード ID</span>
                <strong className="break-all !text-base">{entity.id}</strong>
                <p>共有しやすい安定した識別子です。</p>
              </div>
              <div className="metric-card">
                <span>{uiCopy.labels.relations}</span>
                <strong>{relatedRelations.length}</strong>
                <p>このノードに直接結び付く関係数です。</p>
              </div>
              <div className="metric-card">
                <span>{uiCopy.labels.sourceFile}</span>
                <strong className="break-all !text-base">{entity.sourceFilePath}</strong>
                <p>bundle に含まれた元ファイルへの参照です。</p>
              </div>
            </div>
          </div>
        </article>

        <aside className="panel px-6 py-7">
          <div>
            <p className="eyebrow">読解レンズ</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              読解の手掛かり
            </h2>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <li className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              中央の node から見える 1-hop relation を軽量 SVG で表現しています。
            </li>
            <li className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              左右の線は {uiCopy.labels.incoming} / {uiCopy.labels.outgoing}{' '}
              を分けて読みやすくしています。
            </li>
            <li className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              list に hover すると graph も同期し、relation の位置がすぐ分かります。
            </li>
          </ul>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <article className="panel px-6 py-7 sm:px-8">
          <RelationGraph
            className="min-h-[460px]"
            activeRelationId={activeRelationId}
            entity={entity}
            entries={relatedRelations}
            onActiveRelationChange={setActiveRelationId}
            onNodeSelect={(nextEntityId) => {
              const search = createSearchParams({
                ...(scopeId ? { scope: scopeId } : {}),
                ...(searchText ? { q: searchText } : {})
              }).toString();
              navigate(`/nodes/${nextEntityId}${search ? `?${search}` : ''}`);
            }}
          />

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {(['incoming', 'outgoing'] as const).map((direction) => {
              const entries = groupedRelations[direction];

              return (
                <section key={direction} className="space-y-4">
                  <div>
                    <p className="eyebrow">
                      {direction === 'incoming' ? uiCopy.labels.incoming : uiCopy.labels.outgoing}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                      {direction === 'incoming'
                        ? 'この node を参照する関係'
                        : 'この node から伸びる関係'}
                    </h2>
                  </div>

                  {entries.length === 0 ? (
                    <div className="empty-state-block">
                      <p>{uiCopy.status.noRelationsBody}</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {entries.map(({ direction: relationDirection, relation, relatedEntity }) => {
                        const relationSearch = createSearchParams({
                          ...(scopeId ? { scope: scopeId } : {}),
                          ...(searchText ? { q: searchText } : {})
                        }).toString();
                        const targetId =
                          relationDirection === 'outgoing'
                            ? relation.target.id
                            : relation.source.id;

                        return (
                          <li key={`${relationDirection}-${relation.id}`}>
                            <div
                              className={cn(
                                'rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition',
                                activeRelationId === relation.id &&
                                  'border-sky-200 bg-sky-50/70 shadow-sm'
                              )}
                              onFocus={() => setActiveRelationId(relation.id)}
                              onMouseEnter={() => setActiveRelationId(relation.id)}
                              onMouseLeave={() => setActiveRelationId(undefined)}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                    {relationDirection === 'incoming'
                                      ? uiCopy.labels.incoming
                                      : uiCopy.labels.outgoing}
                                  </p>
                                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                                    {relation.type}
                                  </h3>
                                  {relation.summary ? (
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                      {relation.summary}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                                  {relation.id}
                                </div>
                              </div>

                              <div className="mt-4 rounded-2xl border border-white/90 bg-white/80 px-4 py-4">
                                {relatedEntity ? (
                                  <Link
                                    className="text-base font-semibold text-slate-900 transition hover:text-sky-700"
                                    to={`/nodes/${relatedEntity.id}${relationSearch ? `?${relationSearch}` : ''}`}
                                  >
                                    {relatedEntity.title}
                                  </Link>
                                ) : (
                                  <span className="text-base font-semibold text-slate-900">
                                    {targetId}
                                  </span>
                                )}
                                <p className="mt-2 break-all font-mono text-xs text-slate-500">
                                  {targetId}
                                </p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </article>

        <aside className="space-y-6">
          <section className="panel px-6 py-7">
            <div>
              <p className="eyebrow">属性</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                主要な属性
              </h2>
            </div>
            <dl className="mt-5 grid gap-3">
              {Object.entries(entity.attributes).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4"
                >
                  <dt className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                    {key}
                  </dt>
                  <dd className="mt-2 text-sm font-medium leading-7 text-slate-700">
                    {formatAttributeValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {entity.tags.length > 0 ? (
            <section className="panel px-6 py-7">
              <div>
                <p className="eyebrow">タグ</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  分類タグ
                </h2>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2">
                {entity.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="panel px-6 py-7">
            <div>
              <p className="eyebrow">bundle コンテキスト</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                この bundle について
              </h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              <li className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                {bundle.diagnostics.counts.entities} 件の node が公開されています。
              </li>
              <li className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                {bundle.diagnostics.counts.relations} 件の relation が graph を構成しています。
              </li>
              <li className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                コンテンツはすべて静的な read-only bundle として配信されます。
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
};
