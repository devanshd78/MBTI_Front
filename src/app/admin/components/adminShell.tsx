'use client';

import { ReactNode } from 'react';
import AdminSidebar from './adminSidebar';
import AdminTopbar from './adminTopbar';

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <div className="h-full flex items-stretch">
        <AdminSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <AdminTopbar />
          {/* The ONLY scrollable area */}
          <div className="flex-1 overflow-auto">
            <main className="p-4 md:p-6">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
