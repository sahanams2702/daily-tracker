'use client';

import { addDays, fromISO, weekOf } from "../../dates";

interface Props {
  date: string;
  todayStr: string;
  onChange: (d: string) => void;
}

export default function DateStrip({ date, todayStr, onChange }: Props) {
  const days = weekOf(date);
  const t = todayStr;

  return (
    <nav className="strip" aria-label="Choose a day">
      <button className="strip-nav" onClick={() => onChange(addDays(date, -7))} aria-label="Previous week">
        ‹
      </button>
      <ol className="strip-days">
        {days.map((d) => {
          const dt = fromISO(d);
          const isSel = d === date;
          return (
            <li key={d}>
              <button
                className={`strip-day${isSel ? ' is-selected' : ''}${d === t ? ' is-today' : ''}`}
                onClick={() => onChange(d)}
                aria-current={isSel ? 'date' : undefined}
              >
                <span className="strip-wd">{dt.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                <span className="strip-num">{dt.getDate()}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <button className="strip-nav" onClick={() => onChange(addDays(date, 7))} aria-label="Next week">
        ›
      </button>
    </nav>
  );
}