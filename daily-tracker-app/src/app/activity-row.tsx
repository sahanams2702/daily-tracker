'use client';

import { DayActivity } from "../../types";

interface Props {
  item: DayActivity;
  onToggle: (item: DayActivity) => void;
  onRemove: (item: DayActivity) => void;
}

export default function ActivityRow({ item, onToggle, onRemove }: Props) {
  const done = item.is_completed;
  return (
    <li className={`row${done ? ' is-done' : ''}`}>
      {/* round box = habit, square box = task */}
      <button
        className={`check ${item.activity_type}`}
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark "${item.title}" ${done ? 'not done' : 'done'}`}
        onClick={() => onToggle(item)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      </button>

      <div className="row-body">
        <span className="row-title">{item.title}</span>
        {item.description && <span className="row-desc">{item.description}</span>}
      </div>

      {item.activity_type === 'task' && item.repeat_type === 'daily' && (
        <span className="badge">daily</span>
      )}

      <button className="row-remove" onClick={() => onRemove(item)} aria-label={`Remove ${item.title}`} title="Remove">
        ×
      </button>
    </li>
  );
}