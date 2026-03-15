import { Link } from 'react-router-dom';
import { RelationGraph } from '../components/RelationGraph';
import { formatEntityTypeLabel, uiCopy } from '../copy';
import { getEntityRelations, getRelationDegreeMap } from '../index';
import { useViewerContext } from '../viewer-context';

export const OverviewPage = () => {
  const { bundle, bundlePath } = useViewerContext();
  const relationDegrees = getRelationDegreeMap(bundle);
  const featuredScopes = bundle.graph.views.slice(0, 4);
  const focusEntity = [...bundle.graph.entities].sort(
    (left, right) => (relationDegrees.get(right.id) ?? 0) - (relationDegrees.get(left.id) ?? 0)
  )[0];
  const focusRelations = focusEntity ? getEntityRelations(bundle, focusEntity.id) : [];
  const spotlightNodes = [...bundle.graph.entities]
    .sort(
      (left, right) => (relationDegrees.get(right.id) ?? 0) - (relationDegrees.get(left.id) ?? 0)
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <article className="panel relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_56%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.16),transparent_38%)]" />
          <div className="relative space-y-6">
            <div className="space-y-4">
              <p className="eyebrow">ネットワーク・ワークスペース</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                ネットワーク全体を、関係性から読む。
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Ledra は静的 bundle をそのまま公開しつつ、ノード、関係、スコープを落ち着いて読める
                viewer として提示します。 導入コピーではなく、実際の利用画面そのものを入口にします。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="primary-button" to="/explore">
                {uiCopy.actions.openExplore}
              </Link>
              {featuredScopes[0] ? (
                <Link className="secondary-button" to={`/scopes/${featuredScopes[0].id}`}>
                  {uiCopy.actions.openScope}
                </Link>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="metric-card">
                <span>{uiCopy.labels.entities}</span>
                <strong>{bundle.diagnostics.counts.entities}</strong>
                <p>bundle 内で公開されている全ノード数です。</p>
              </div>
              <div className="metric-card">
                <span>{uiCopy.labels.relations}</span>
                <strong>{bundle.diagnostics.counts.relations}</strong>
                <p>ノード同士のつながりを示す関係レコードです。</p>
              </div>
              <div className="metric-card">
                <span>{uiCopy.labels.scopes}</span>
                <strong>{bundle.diagnostics.counts.views}</strong>
                <p>調査の切り口を定義するスコープです。</p>
              </div>
            </div>
          </div>
        </article>

        <aside className="panel flex flex-col gap-5 px-6 py-7 sm:px-7">
          <div>
            <p className="eyebrow">公開 bundle</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              公開中の配信情報
            </h2>
          </div>
          <dl className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <dt className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                {uiCopy.labels.sourceBundle}
              </dt>
              <dd className="mt-2 break-all font-mono text-xs text-slate-600">{bundlePath}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <dt className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                主要タイプ
              </dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {Array.from(
                  new Set(bundle.graph.entities.slice(0, 10).map((entity) => entity.type))
                ).map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                  >
                    {formatEntityTypeLabel(type)}
                  </span>
                ))}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
              <dt className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                公開ポリシー
              </dt>
              <dd className="mt-2 text-base font-semibold text-slate-900">
                {bundle.diagnostics.counts.policies} 件の検査ルール
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <article className="panel px-6 py-7 sm:px-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">関係のパルス</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                最も接続の多いノードを起点に見る
              </h2>
            </div>
            {focusEntity ? (
              <Link className="secondary-button" to={`/nodes/${focusEntity.id}`}>
                {uiCopy.actions.openNode}
              </Link>
            ) : null}
          </div>

          {focusEntity ? (
            <RelationGraph
              className="min-h-[460px]"
              entity={focusEntity}
              entries={focusRelations}
            />
          ) : null}
        </article>

        <aside className="space-y-6">
          <section className="panel px-6 py-7">
            <div>
              <p className="eyebrow">注目ノード</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                関係が集まるノード
              </h2>
            </div>
            <ul className="mt-5 space-y-3">
              {spotlightNodes.map((entity) => (
                <li key={entity.id}>
                  <Link
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition hover:border-sky-200 hover:bg-white"
                    to={`/nodes/${entity.id}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{entity.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatEntityTypeLabel(entity.type)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                      {relationDegrees.get(entity.id) ?? 0}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel px-6 py-7">
            <div>
              <p className="eyebrow">スコープ</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                主要なスコープ
              </h2>
            </div>
            <div className="mt-5 space-y-3">
              {featuredScopes.map((scope) => (
                <Link key={scope.id} className="scope-card" to={`/scopes/${scope.id}`}>
                  <div>
                    <p className="font-semibold text-slate-950">{scope.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {scope.summary ?? '調査の焦点を絞って node と relation を読みます。'}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {scope.entityTypes.length} 種別
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
};
