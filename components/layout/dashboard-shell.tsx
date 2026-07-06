import type { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
}

/** Enterprise dashboard chrome: top navigation bar plus a wide, calm content area. */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <p className="font-serif text-xl tracking-tight">KnowledgeOps AI</p>
          <nav aria-label="Primary">
            <ul className="flex items-center gap-8 text-sm font-medium">
              <li>
                <span aria-current="page" className="text-foreground">
                  Dashboard
                </span>
              </li>
              <li>
                <span className="cursor-default text-muted-foreground">
                  Help Center
                </span>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">
        {children}
      </main>
    </div>
  );
}
