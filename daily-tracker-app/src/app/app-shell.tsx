"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getToken, getUser, type AuthUser } from "../../auth";

const icon = (paths: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths}
  </svg>
);

const NAV = [
  {
    href: "/",
    label: "Today",
    icon: icon(
      <>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18" />
      </>,
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: icon(<path d="M5 20V11M12 20V4M19 20v-6" />),
  },
  {
    href: "/report",
    label: "Monthly report",
    icon: icon(
      <>
        <path d="M4 4v16h16" />
        <path d="M8 15l4-5 3 3 5-6" />
      </>,
    ),
  },
];

// Wraps every page except /login: auth guard + sidebar.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const bare = ["/login", "/forgot-password", "/reset-password"].includes(
    pathname,
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (bare) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setUser(getUser());
    setReady(true);
  }, [bare, router]);

  if (bare) return <>{children}</>;
  if (!ready) {
    return (
      <main className="shell">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  const signOut = () => {
    clearSession();
    setReady(false);
    router.replace("/login");
  };

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="icon-btn"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="brand">MarkItUp</span>
      </header>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="brand">
          MarkItUp
          <small>The Daily Tracker</small>
        </div>
        <nav className="side-nav" aria-label="Main">
          {NAV.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`side-link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {n.icon}
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="side-foot">
          <span className="side-user">{user?.name}</span>
          <button className="link" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="content">{children}</div>
    </div>
  );
}
