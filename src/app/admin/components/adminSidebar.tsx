'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LibraryBig,
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
} from 'lucide-react';
import { ADMIN_NAV } from './nav';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string | number;
};

export default function AdminSidebar({ nav = ADMIN_NAV }: { nav?: NavItem[] }) {
  const pathname = usePathname();

  // Restore collapse state without flicker
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('admin.sidebar.open');
      return saved ? saved === '1' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('admin.sidebar.open', open ? '1' : '0');
    } catch {}
  }, [open]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const widthClass = open ? 'w-64' : 'w-[74px]';

  return (
    <aside
      className={[
        // column sizing
        widthClass, 'shrink-0',
        // full-height pinned column
        'sticky top-0 h-[100dvh]',
        // visuals
        'bg-slate-950/90 border-r border-white/10 text-slate-200',
        // layout
        'flex flex-col',
        // transition
        'transition-[width] duration-200 z-40',
      ].join(' ')}
      aria-label="Admin sidebar"
      aria-expanded={open}
    >
      {/* Header (fixed within sidebar) */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10">
            <LibraryBig className="w-5 h-5 text-cyan-400" />
          </div>
          {open && (
            <span className="font-semibold tracking-tight truncate" title="Admin">
              Admin
            </span>
          )}
        </div>

        <button
          className="rounded-md hover:bg-white/10 p-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav (own overflow if items exceed viewport height) */}
      <nav className="py-3 px-2 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {nav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const base =
              'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';
            const activeCls =
              'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-white/15 text-white';
            const idleCls = 'hover:bg-white/5 border border-transparent';

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[base, active ? activeCls : idleCls].join(' ')}
                  title={open ? undefined : item.label}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  {open && <span className="flex-1 truncate">{item.label}</span>}
                  {open && item.badge !== undefined && (
                    <span className="text-xs rounded-md px-1.5 py-0.5 bg-white/10 border border-white/10">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-gradient-to-b from-cyan-400 to-blue-400"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom control (fixed at bottom of sidebar) */}
      <div className="px-2 pb-2 pt-1 border-t border-white/10">
        <button
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="w-4 h-4" />
          {open && <span>Collapse</span>}
          <span className="sr-only">{open ? 'Collapse sidebar' : 'Expand sidebar'}</span>
        </button>
      </div>
    </aside>
  );
}
