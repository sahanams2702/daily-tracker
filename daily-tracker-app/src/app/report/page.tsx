'use client';
import { useEffect, useMemo, useState } from 'react';
import { getReport, type Report } from '../../../api';
import { addMonths, fromISO, monthEnd, monthStart, today } from '../../../dates';
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

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const tip = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 };
const tick = { fill: 'var(--muted)', fontSize: 12 };

export default function ReportPage() {
  const [t, setT] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null); // first day of the shown month
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const n = today();
    setT(n);
    setMonth(monthStart(n));
  }, []);

  useEffect(() => {
    if (!t || !month) return;
    let off = false;
    setReport(null);
    setError(null);
    const end = monthEnd(month) < t ? monthEnd(month) : t; // don't count days that haven't happened yet
    getReport(month, end)
      .then((r) => { if (!off) setReport(r); })
      .catch(() => { if (!off) setError('Could not load the report. Is the API running?'); });
    return () => { off = true; };
  }, [t, month]);

  const days = useMemo(() => report?.days ?? [], [report]);
  const daily = useMemo(
    () => days.map((d) => ({ day: fromISO(d.date).getDate(), date: d.date, completed: d.completed, missed: d.planned - d.completed })),
    [days],
  );
  const perfect = days.filter((d) => d.planned > 0 && d.completed === d.planned).length;
  const weekday = useMemo(
    () =>
      WEEKDAYS.map((name, i) => {
        const ds = days.filter((d) => (fromISO(d.date).getDay() + 6) % 7 === i);
        const p = ds.reduce((s, d) => s + d.planned, 0);
        const c = ds.reduce((s, d) => s + d.completed, 0);
        return { name, rate: p ? Math.round((c / p) * 100) : null };
      }),
    [days],
  );

  if (!t || !month) {
    return <div className="page"><p className="muted">Loading…</p></div>;
  }

  const isCurrent = monthStart(t) === month;
  const totals = report?.totals;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Monthly report</h1>
          <p className="muted">{fromISO(month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="month-nav">
          <button className="btn-ghost" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">‹</button>
          <button className="btn-ghost" onClick={() => setMonth(monthStart(t))} disabled={isCurrent}>This month</button>
          <button className="btn-ghost" onClick={() => setMonth(addMonths(month, 1))} disabled={isCurrent} aria-label="Next month">›</button>
        </div>
      </header>

      {error && <p className="alert" role="alert">{error}</p>}

      <section className="cards">
        <StatCard label="Completion rate" value={totals ? (totals.rate == null ? '—' : `${totals.rate}%`) : '…'} />
        <StatCard label="Completed" value={totals ? String(totals.completed) : '…'} sub="items ticked off" />
        <StatCard label="Missed" value={totals ? String(totals.planned - totals.completed) : '…'} sub="items not done" />
        <StatCard label="Perfect days" value={report ? String(perfect) : '…'} sub="everything done" />
      </section>

      {report && totals?.planned === 0 ? (
        <p className="empty">Nothing was planned in this month.</p>
      ) : (
        <>
          <div className="grid-2">
            <section className="panel">
              <h2>Day by day</h2>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="day" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tip} cursor={{ fill: 'var(--line)', opacity: 0.4 }} labelFormatter={(d) => `Day ${d}`} />
                    <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="var(--done)" />
                    <Bar dataKey="missed" name="Missed" stackId="a" fill="var(--line)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel">
              <h2>By weekday</h2>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekday} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="name" tick={tick} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} unit="%" tick={tick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tip} cursor={{ fill: 'var(--line)', opacity: 0.4 }} formatter={(v) => (v == null ? '—' : `${v}%`)} />
                    <Bar dataKey="rate" name="Completion" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="panel">
            <h2>By activity</h2>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Activity</th><th>Type</th><th>Done</th><th>Progress</th></tr>
                </thead>
                <tbody>
                  {(report?.activities ?? []).map((a) => (
                    <tr key={a.id}>
                      <td>{a.title}</td>
                      <td><span className="badge">{a.activity_type}</span></td>
                      <td>{a.completed}/{a.planned}</td>
                      <td>
                        <div className="mini-wrap">
                          <div className="mini-bar"><span style={{ width: `${a.rate}%` }} /></div>
                          <span className="mini-pct">{a.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}