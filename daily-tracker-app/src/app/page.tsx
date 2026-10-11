'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { today } from '../../dates';
import Tracker from './tracker';
import { AuthUser, clearSession, getToken, getUser } from '../../auth';


export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState<{ today: string; user: AuthUser | null } | null>(null);

  // Runs after mount: no token -> login; also keeps new Date() out of prerender
  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady({ today: today(), user: getUser() });
  }, [router]);

  if (!ready) {
    return (
      <main className="shell">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  return (
    <Tracker
      todayStr={ready.today}
      userName={ready.user?.name ?? ''}
      onSignOut={() => {
        clearSession();
        router.replace('/login');
      }}
    />
  );
}