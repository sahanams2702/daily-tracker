'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { resetPassword } from '../../../api';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-card">
        <h1>MarkItUp</h1>
        <p className="alert" role="alert">This reset link is invalid.</p>
        <p className="auth-switch">
          <Link href="/forgot-password" className="link">Request a new link</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <h1>MarkItUp</h1>
      <p className="muted">Choose a new password</p>

      {done ? (
        <p className="muted" role="status">Password updated. Redirecting to sign in…</p>
      ) : (
        <>
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
            />
            <small className="muted">At least 8 characters</small>
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
            />
          </label>

          {error && <p className="alert" role="alert">{error}</p>}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : 'Update password'}
          </button>
        </>
      )}

      <p className="auth-switch">
        <Link href="/login" className="link">Back to sign in</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-shell">
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}