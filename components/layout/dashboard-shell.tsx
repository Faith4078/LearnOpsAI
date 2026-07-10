import Link from 'next/link';
import type { ReactNode } from 'react';

type NavKey = 'dashboard' | 'help-center';

interface DashboardShellProps {
  children: ReactNode;
  /** Which primary nav item the current page corresponds to. */
  active?: NavKey;
}

const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/' },
  { key: 'help-center', label: 'Help Center', href: '/help-center' },
];

const FOCUS_RING =
  'rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';

/** Enterprise dashboard chrome: top navigation bar plus a wide, calm content area. */
export function DashboardShell({
  children,
  active = 'dashboard',
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-sm bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4"
      >
        Skip to main content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link
            href="/"
            className={`font-serif text-xl tracking-tight ${FOCUS_RING}`}
          >
            KnowledgeOps AI
          </Link>
          <nav aria-label="Primary">
            <ul className="flex items-center gap-5 text-sm font-medium sm:gap-8">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active === item.key ? 'page' : undefined}
                    className={`${FOCUS_RING} ${
                      active === item.key
                        ? 'text-foreground'
                        : 'text-muted-foreground transition-colors hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14"
      >
        {children}
      </main>
    </div>
  );
}
