interface Props {
  sourceNotes: string;
  lastReviewed: string;
}

export function SourceBadge({ sourceNotes, lastReviewed }: Props) {
  return (
    <div className="source-badge">
      <span className="source-badge-icon" aria-hidden>
        🛰️
      </span>
      <div>
        <div className="source-badge-text">{sourceNotes}</div>
        <div className="source-badge-date">آخر مراجعة للمحتوى: {lastReviewed}</div>
      </div>
    </div>
  );
}
