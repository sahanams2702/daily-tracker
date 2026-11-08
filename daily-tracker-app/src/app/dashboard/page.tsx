'use client';
import { useEffect, useMemo, useState } from 'react';

import { getReport, type DayStat, type Report } from '../../../api';
import { addDays, fromISO, today } from '../../../dates';
import StatCard from '../stat-card';
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  YAxis,
  Area,
  BarChart,
  Legend,
  Bar,
} from 'recharts';

const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

const short = (s: string) => fromISO(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const trunc = (s: string) => (s.length > 18 ? `${s.slice(0, 17)}…` : s);
const tip = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 };
const tick = { fill: 'var(--muted)', fontSize: 12 };

// Consecutive "perfect" days (everything planned was done), skipping days with nothing planned.
// Today is skipped while it's still in progress.
function calcStreak(days: DayStat[]) {
  let n = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.planned === 0) continue;
    if (d.completed === d.planned) n++;
    else if (i === days.length - 1) continue;
    else break;
  }
  return n;
}

export default function DashboardPage() {
  const [t, setT] = useState<string | null>(null);
  const [range, setRange] = useState<Range>(14);
  const [recent, setRecent] = useState<DayStat[] | null>(null); // last 60 days, for today + streak
  const [report, setReport] = useState<Report | null>(null); // selected range
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setT(today()), []);

  useEffect(() => {
    if (!t) return;
    let off = false;
    getReport(addDays(t, -59), t)
      .then((r) => { if (!off) setRecent(r.days); })
      .catch(() => { if (!off) setError('Could not load your stats. Is the API running?'); });
    return () => { off = true; };
  }, [t]);

  useEffect(() => {
    if (!t) return;
    let off = false;
    setReport(null);
    getReport(addDays(t, -(range - 1)), t)
      .then((r) => { if (!off) setReport(r); })
      .catch(() => { if (!off) setError('Could not load your stats. Is the API running?'); });
    return () => { off = true; };
  }, [t, range]);

  const todayStat = recent?.[recent.length - 1];
  const streak = useMemo(() => (recent ? calcStreak(recent) : 0), [recent]);
  const days = useMemo(() => (report?.days ?? []).map((d) => ({ ...d, label: short(d.date) })), [report]);
  const top = useMemo(
    () => [...(report?.activities ?? [])].sort((a, b) => b.rate - a.rate).slice(0, 6),
    [report],
  );

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">How your habits and tasks are going</p>
        </div>
        <div className="seg" role="radiogroup" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r} role="radio" aria-checked={range === r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>
              {r} days
            </button>
          ))}
        </div>
      </header>

      {error && <p className="alert" role="alert">{error}</p>}

      <section className="cards">
        <StatCard
          label="Today"
          value={todayStat ? (todayStat.planned ? `${todayStat.completed}/${todayStat.planned}` : '—') : '…'}
          sub={todayStat?.planned ? `${todayStat.rate}% done` : 'Nothing planned'}
        />
        <StatCard
          label={`Last ${range} days`}
          value={report ? (report.totals.rate == null ? '—' : `${report.totals.rate}%`) : '…'}
          sub={report ? `${report.totals.completed} of ${report.totals.planned} items` : undefined}
        />
        <StatCard
          label="Current streak"
          value={recent ? `${streak >= 60 ? '60+' : streak} ${streak === 1 ? 'day' : 'days'}` : '…'}
          sub="Days with everything done"
        />
        <StatCard
          label="Most consistent"
          value={top[0] ? trunc(top[0].title) : '—'}
          sub={top[0] ? `${top[0].rate}% completed` : undefined}
        />
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2>Daily progress</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis domain={[0, 100]} unit="%" tick={tick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tip} formatter={(v) => (v == null ? '—' : `${v}%`)} />
                <Area type="monotone" dataKey="rate" name="Completion" stroke="var(--accent)" strokeWidth={2} fill="url(#rateFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <h2>Completed vs planned</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: 'var(--line)', opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                <Bar dataKey="planned" name="Planned" fill="var(--line)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="var(--done)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Most consistent activities</h2>
        {top.length ? (
          <div className="chart" style={{ height: Math.max(180, top.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={tick} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="title" width={140} tick={tick} tickLine={false} axisLine={false} tickFormatter={trunc} />
                <Tooltip contentStyle={tip} cursor={{ fill: 'var(--line)', opacity: 0.4 }} formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" name="Completed" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="empty">{report ? 'Add a habit or task to see how consistent you are.' : 'Loading…'}</p>
        )}
      </section>
    </div>
  );
}