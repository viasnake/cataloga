import type { EntityRecord } from '@ledra/types';
import { Link, createSearchParams } from 'react-router-dom';

const getPreviewValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
};

export const EntityCard = ({
  entity,
  viewId,
  searchText
}: {
  entity: EntityRecord;
  viewId: string | undefined;
  searchText: string | undefined;
}) => {
  const previewEntries = Object.entries(entity.attributes).slice(0, 2);
  const search = createSearchParams({
    ...(viewId ? { view: viewId } : {}),
    ...(searchText ? { q: searchText } : {})
  }).toString();

  return (
    <Link className="entity-card" to={`/entities/${entity.id}${search ? `?${search}` : ''}`}>
      <div className="entity-card-top">
        <span className="entity-badge">{entity.type}</span>
        <span className="entity-id">{entity.id}</span>
      </div>

      <div className="entity-card-body">
        <h3>{entity.title}</h3>
        <p>{entity.summary ?? 'No summary available yet.'}</p>
      </div>

      {previewEntries.length > 0 ? (
        <dl className="entity-preview-grid">
          {previewEntries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{getPreviewValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {entity.tags.length > 0 ? (
        <ul className="tag-list" aria-label="Tags">
          {entity.tags.slice(0, 3).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
};
