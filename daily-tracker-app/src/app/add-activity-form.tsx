'use client';
import { useState } from 'react';
import { ActivityType, NewActivity, RepeatType } from '../../types';

interface Props {
  date: string;
  onAdd: (a: NewActivity) => Promise<void>;
}

export default function AddActivityForm({ date, onAdd }: Props) {
  const [type, setType] = useState<ActivityType>('task');
  const [repeat, setRepeat] = useState<RepeatType>('once');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const pickType = (t: ActivityType) => {
    setType(t);
    setRepeat(t === 'habit' ? 'daily' : 'once'); // sensible defaults, still changeable
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        activity_type: type,
        repeat_type: repeat,
        start_date: date,
      });
      setTitle('');
      setDescription('');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer-row">
        <div className="seg" role="radiogroup" aria-label="Type">
          {(['task', 'habit'] as const).map((t) => (
            <button
              type="button"
              key={t}
              role="radio"
              aria-checked={type === t}
              className={type === t ? 'on' : ''}
              onClick={() => pickType(t)}
            >
              {t === 'task' ? 'Task' : 'Habit'}
            </button>
          ))}
        </div>
        <input
          className="composer-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={type === 'habit' ? 'New habit, e.g. Read 20 pages' : 'New task for this day'}
          maxLength={200}
          aria-label="Title"
        />
        <button className="btn-primary" type="submit" disabled={!title.trim() || busy}>
          {busy ? 'Adding…' : `Add ${type}`}
        </button>
      </div>

      {open && (
        <div className="composer-more">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            aria-label="Description"
          />
          <label className="repeat">
            Repeats
            <select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatType)}>
              <option value="once">Only on this day</option>
              <option value="daily">Every day from this day</option>
            </select>
          </label>
        </div>
      )}
    </form>
  );
}