import type { EntityRecord } from '@cataloga/types';
import { Link, createSearchParams } from 'react-router-dom';
import { formatAttributeValue, formatEntityTypeLabel, uiCopy } from '../copy';

type EntityCardProps = {
  entity: EntityRecord;
  scopeId: string | undefined;
  searchText: string | undefined;
  relationCount: number;
};

export const EntityCard = ({ entity, scopeId, searchText, relationCount }: EntityCardProps) => {
  const previewEntries = Object.entries(entity.attributes).slice(0, 2);
  const search = createSearchParams({
    ...(scopeId ? { scope: scopeId } : {}),
    ...(searchText ? { q: searchText } : {})
  }).toString();

  return (
    <Link
      className="group flex flex-col gap-5 rounded-[28px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_28px_100px_rgba(14,165,233,0.16)]"
      to={`/nodes/${entity.id}${search ? `?${search}` : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-sky-800 uppercase">
            {formatEntityTypeLabel(entity.type)}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {uiCopy.labels.relationCount} {relationCount}
          </span>
        </div>
        <span className="font-mono text-xs text-slate-400">{entity.id}</span>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-sky-700">
            {entity.title}
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {entity.summary ?? '概要はまだ定義されていません。'}
          </p>
        </div>

        {previewEntries.length > 0 ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {previewEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3"
              >
                <dt className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                  {key}
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-700">
                  {formatAttributeValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {entity.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={uiCopy.labels.tags}>
          {entity.tags.slice(0, 4).map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
};
