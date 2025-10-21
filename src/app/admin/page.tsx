'use client';

import Link from 'next/link';
import { FolderKanban, HelpCircle, ClipboardList, Brain } from 'lucide-react';

const cards = [
  { href: '/admin/themes', title: 'Themes', icon: FolderKanban, hint: 'Create & manage themes' },
  { href: '/admin/questions', title: 'Questions', icon: HelpCircle, hint: 'Bulk upsert & organize' },
  { href: '/admin/results', title: 'Results', icon: ClipboardList, hint: 'Browse submissions' },
  { href: '/admin/mbti', title: 'MBTI', icon: Brain, hint: 'Manage personality profiles' },
];

export default function Page() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
        >
          <div className="flex items-center gap-3">
            <c.icon className="w-5 h-5 text-cyan-300" />
            <h3 className="font-semibold text-white">{c.title}</h3>
          </div>
          <p className="mt-2 text-sm text-slate-400">{c.hint}</p>
          <div className="mt-3 h-1 w-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded group-hover:w-full transition-all" />
        </Link>
      ))}
    </div>
  );
}
