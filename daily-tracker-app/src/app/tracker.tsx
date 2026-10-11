'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DayActivity, NewActivity } from '../../types';
import { archiveActivity, createActivity, getDay, setCompletion } from '../../api';
import { fromISO } from '../../dates';
import AddActivityForm from './add-activity-form';
import DateStrip from './date-strip';
import ActivityRow from './activity-row';


interface TrackerProps {
  todayStr: string;
  userName: string;
  onSignOut: () => void;
}

export default function Tracker({ todayStr, userName, onSignOut }: TrackerProps) {
  const [date, setDate] = useState(todayStr);
  const [items, setItems] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getDay(d));
    } catch {
      setError('Could not load this day. Check that the API is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const habits = useMemo(() => items.filter((i) => i.activity_type === 'habit'), [items]);
  const tasks = useMemo(() => items.filter((i) => i.activity_type === 'task'), [items]);
  const doneCount = items.filter((i) => i.is_completed).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  async function toggle(item: DayActivity) {
    const next = !item.is_completed;
    // optimistic update, roll back on failure
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: next } : i)));
    try {
      await setCompletion(item.id, date, next);
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: !next } : i)));
      setError('Could not save that change. Try again.');
    }
  }

  async function add(a: NewActivity) {
    try {
      await createActivity(a);
      await load(date);
    } catch {
      setError('Could not add that. Try again.');
    }
  }

  async function remove(item: DayActivity) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== item.id));
    try {
      await archiveActivity(item.id);
    } catch {
      setItems(prev);
      setError('Could not remove that. Try again.');
    }
  }

  const d = fromISO(date);
  const isToday = date === todayStr;

  return (
    <main className="shell">
      <header className="head">
        <div>
          <h1>{isToday ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'long' })}</h1>
          <p className="head-date">
            {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="head-side">
          <p className="who">
            {userName}
            <button className="link" onClick={onSignOut}>
              Sign out
            </button>
          </p>
          {!isToday && (
            <button className="btn-ghost" onClick={() => setDate(todayStr)}>
              Back to today
            </button>
          )}
          <p className="progress-label">
            <strong>{doneCount}</strong> of {items.length} done
          </p>
        </div>
      </header>

      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>

      <DateStrip date={date} todayStr={todayStr} onChange={setDate} />
      <AddActivityForm date={date} onAdd={add} />

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <section aria-labelledby="habits-h">
            <h2 id="habits-h">Habits</h2>
            {habits.length ? (
              <ul className="list">
                {habits.map((i) => (
                  <ActivityRow key={i.id} item={i} onToggle={toggle} onRemove={remove} />
                ))}
              </ul>
            ) : (
              <p className="empty">No habits yet. Add one above and it will show up every day.</p>
            )}
          </section>

          <section aria-labelledby="tasks-h">
            <h2 id="tasks-h">Tasks</h2>
            {tasks.length ? (
              <ul className="list">
                {tasks.map((i) => (
                  <ActivityRow key={i.id} item={i} onToggle={toggle} onRemove={remove} />
                ))}
              </ul>
            ) : (
              <p className="empty">Nothing planned for this day. Add a task above.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}