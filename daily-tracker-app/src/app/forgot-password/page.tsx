'use client';
import Link from 'next/link';
import { useState } from 'react';
import { forgotPassword } from '../../../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await forgotPassword(email);
      setSent(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <h1>MarkItUp</h1>
        <p className="muted">Enter your email and we&apos;ll send you a reset link</p>

        {sent ? (
          <p className="muted" role="status">{sent}</p>
        ) : (
          <>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>

            {error && <p className="alert" role="alert">{error}</p>}

            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Send reset link'}
            </button>
          </>
        )}

        <p className="auth-switch">
          <Link href="/login" className="link">Back to sign in</Link>
        </p>
      </form>
    </main>
  );
}