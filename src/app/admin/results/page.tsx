'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getApi, postApi, delApi } from '@/lib/api';
import {
  RefreshCw, Eye, Trash2, Mail, ChevronUp, ChevronDown, ShieldCheck
} from 'lucide-react';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type Theme = { _id: string; title: string };
type Personality = {
  type?: string;
  title?: string;
  traits?: string[];
  strengths?: string[];
  growth?: string[];
};
type Result = {
  _id: string;
  name?: string;
  themeId: string;
  personalityType?: string; // e.g. "INTJ"
  summary?: string;         // legacy
  traits?: string[];
  isPublic?: boolean;
  createdAt?: string;
  personality?: Personality; // when include=personality
};

type ListThemes = { success: boolean; data: Theme[] };
type ListResults = { success: boolean; data: Result[]; meta?: { pagination: { total: number; page: number; pages: number } } };

export default function ResultsAdmin() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeId, setThemeId] = useState<string>('');
  const [rows, setRows] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sort, setSort] = useState('-createdAt');
  const [includePersonality, setIncludePersonality] = useState(true);
  const [q, setQ] = useState(''); // client-side filter by name

  // share dialog
  const [shareOpen, setShareOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function loadThemes() {
    const t = await getApi<ListThemes>('/themes', { limit: 100, sort: 'title:asc' });
    setThemes(t.data);
    if (!themeId && t.data.length) setThemeId(t.data[0]._id);
  }

  async function loadResults() {
    if (!themeId) return;
    setLoading(true);
    try {
      const r = await getApi<ListResults>(`/results/${themeId}/theme`, {
        page, limit, sort, include: includePersonality ? 'personality' : undefined
      });
      setRows(r.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadThemes(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { setPage(1); /* eslint-disable-next-line */ }, [themeId, includePersonality]);
  useEffect(() => { loadResults(); /* eslint-disable-next-line */ }, [themeId, page, sort, includePersonality]);

  const themeMap = useMemo(() => new Map(themes.map(t => [t._id, t.title])), [themes]);

  const filteredRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => (r.name || '').toLowerCase().includes(s));
  }, [rows, q]);

  const sortDir = (field: string) => {
    const m = String(sort);
    if (m.startsWith('-') && m.slice(1) === field) return 'desc';
    if (m.startsWith(field)) return m.endsWith(':desc') ? 'desc' : 'asc';
    return null;
  };
  const sortToggle = (field: string) => {
    setSort(prev => {
      const isAsc = prev === field || prev === `${field}:asc`;
      return isAsc ? `${field}:desc` : `${field}:asc`;
    });
  };

  function openShare(id: string, name?: string, type?: string) {
    setShareId(id);
    setToEmail('');
    setSubject(type ? `Your MBTI result: ${type}` : 'Your MBTI result');
    setMessage(name ? `Hi ${name},\nHere’s your MBTI result link:` : `Here’s your MBTI result link:`);
    setShareOpen(true);
  }

  async function sendShare() {
    if (!shareId) return;
    if (!toEmail.trim()) return alert('Please enter recipient email.');
    setSending(true);
    try {
      await postApi(`/results/${shareId}/share-email`, { to: toEmail.trim(), subject, message });
      setShareOpen(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  }

  async function removeResult(id: string) {
    if (!confirm('Delete this result?')) return;
    try {
      await delApi(`/results/${id}`);
      await loadResults();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Delete failed');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">Results</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Theme select (shadcn) */}
          <div className="min-w-[220px]">
            <Label className="sr-only">Theme</Label>
            <Select value={themeId} onValueChange={setThemeId}>
              <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                {themes.map(t => (
                  <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Filter by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-40 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
          />

          <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-white/10 bg-white/5">
            <Switch id="inc" checked={includePersonality} onCheckedChange={setIncludePersonality} />
            <Label htmlFor="inc" className="text-sm text-slate-300">Include personality</Label>
          </div>

          <Button
            variant="outline"
            className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={loadResults}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="text-left px-4 py-3">
                  <button onClick={() => sortToggle('name')} className="inline-flex items-center gap-1 hover:underline">
                    Name
                    {sortDir('name') === 'asc' && <ChevronUp className="w-4 h-4" />}
                    {sortDir('name') === 'desc' && <ChevronDown className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3">Theme</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Personality</th>
                <th className="text-left px-4 py-3">Traits</th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => sortToggle('createdAt')} className="inline-flex items-center gap-1 hover:underline">
                    Created
                    {sortDir('createdAt') === 'asc' && <ChevronUp className="w-4 h-4" />}
                    {sortDir('createdAt') === 'desc' && <ChevronDown className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3">Public</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">No results</td></tr>
              ) : filteredRows.map(r => {
                const type = (r.personalityType || r.summary || '—').toUpperCase();
                const themeTitle = themeMap.get(r.themeId) || '—';
                const traits = r.personality?.traits || r.traits || [];
                return (
                  <tr key={r._id} className="border-t border-white/10 align-top">
                    <td className="px-4 py-3 text-white">{r.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{themeTitle}</td>
                    <td className="px-4 py-3">
                      {type !== '—' ? (
                        <Badge className="bg-white/10 border border-white/10 text-slate-100">{type}</Badge>
                      ) : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.personality?.title ? (
                        <span className="text-slate-200">{r.personality.title}</span>
                      ) : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <TraitsInline items={traits} />
                    </td>
                    <td className="px-4 py-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      {r.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <ShieldCheck className="w-4 h-4" /> Yes
                        </span>
                      ) : <span className="text-slate-400">No</span>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <Link
                        href={`/result?rid=${r._id}${r.name ? `&name=${encodeURIComponent(r.name)}` : ''}`}
                        className="inline-flex items-center gap-1 text-cyan-300 hover:underline"
                      >
                        <Eye className="w-4 h-4" /> View
                      </Link>
                      <Button
                        variant="ghost"
                        className="text-cyan-300 hover:text-cyan-200 hover:bg-white/5"
                        onClick={() => openShare(r._id, r.name, type)}
                      >
                        <Mail className="w-4 h-4 mr-1" /> Share
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-rose-300 hover:text-rose-200 hover:bg-white/5"
                        onClick={() => removeResult(r._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <div>Page: {page}</div>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={page<=1}
            onClick={() => setPage(p => Math.max(1, p-1))}
            className="h-8 border-white/10 bg-white/5 disabled:opacity-50 text-white"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(p => p+1)}
            className="h-8 border-white/10 bg-white/5 text-white"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Share result via email</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>To *</Label>
              <Input
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={sendShare} disabled={sending} className="bg-cyan-600 hover:bg-cyan-500">
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ---------- small helpers ---------- */

function ScoresInline({ scores }: { scores?: Record<string, number> }) {
  if (!scores || Object.keys(scores).length === 0) return <span className="text-slate-500">—</span>;
  const order = ['E','I','S','N','T','F','J','P'];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-200">
      {order.map(k => (k in scores) ? (
        <span key={k} className="font-mono">
          {k}: <span className="text-slate-300">{Number(scores[k]).toFixed(0)}</span>
        </span>
      ) : null)}
    </div>
  );
}

function TraitsInline({ items }: { items: string[] }) {
  if (!items?.length) return <span className="text-slate-500">—</span>;
  const shown = items.slice(0, 3);
  const more = items.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((t, i) => (
        <Badge key={`${t}-${i}`} className="bg-white/10 border border-white/10 text-slate-200">{t}</Badge>
      ))}
      {more > 0 && <Badge className="bg-white/10 border border-white/10 text-slate-200">+{more}</Badge>}
    </div>
  );
}
