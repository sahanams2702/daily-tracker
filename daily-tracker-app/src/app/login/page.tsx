'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login, register } from '../../../api';
import { saveSession } from '../../../auth';


export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === 'login' ? await login(email, password) : await register(name, email, password);
      saveSession(res.access_token, res.user);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <h1>MarkItUp</h1>
        <p className="muted">{isLogin ? 'Sign in to your tracker' : 'Create your account'}</p>

        {!isLogin && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          {!isLogin && <small className="muted">At least 8 characters</small>}
        </label>

        {isLogin && (
          <p className="auth-switch">
            <Link href="/forgot-password" className="link">
              Forgot password?
            </Link>
          </p>
        )}

        {error && <p className="alert" role="alert">{error}</p>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
        </button>

        <p className="auth-switch">
          {isLogin ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(isLogin ? 'register' : 'login');
              setError(null);
            }}
          >
            {isLogin ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </form>
    </main>
  );
}