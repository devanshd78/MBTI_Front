'use client';

import { usePathname } from 'next/navigation';
import { Search, UserCircle2 } from 'lucide-react';

export default function AdminTopbar() {
  const pathname = usePathname();
  const title = pathTitle(pathname);

  // NOTE: no sticky here — the parent shell places this above the scrollable pane
  return (
    <header className="h-14 shrink-0 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <h1 className="text-sm md:text-base font-semibold text-white">{title}</h1>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              placeholder="Search admin…"
              className="bg-transparent outline-none text-sm py-1 placeholder:text-slate-500 text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-white/10 bg-white/5">
            <UserCircle2 className="w-5 h-5 text-cyan-300" />
            <span className="hidden md:inline text-sm text-slate-300">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function pathTitle(pathname: string) {
  if (pathname === '/admin') return 'Dashboard';
  const parts = pathname.replace(/^\/+/, '').split('/');
  return parts.slice(1).map(cap).join(' / ');
}
function cap(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}
