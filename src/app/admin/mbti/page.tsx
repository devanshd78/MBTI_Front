'use client';

import { useEffect, useMemo, useState } from 'react';
import { getApi, postApi } from '@/lib/api';
import {
  Plus, RefreshCw, PencilLine, Loader2, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ---------- types ----------
type MBTI = {
  type: string;
  title: string;
  description: string;
  traits: string[];
  strengths: string[];
  growth?: string[];
  idealEnvironments?: string[];
  communicationStyle?: string[];
  collaborationTips?: string[];
  createdAt?: string;
  updatedAt?: string;
};
type MBTIM = { success: boolean; data: Record<string, MBTI> };

// ---------- helpers ----------
const TYPE_REGEX = /^(E|I)(S|N)(T|F)(J|P)$/i;

function parseServerError(e: any): string {
  const msg = e?.message || '';
  const body = e?.response?.data || {};
  const details = body?.details;
  if (details?.fieldErrors) {
    const lines = Object.entries(details.fieldErrors)
      .flatMap(([field, arr]: any) => (arr || []).map((m: string) => `${field}: ${m}`));
    if (lines.length) return `Validation failed:\n• ${lines.join('\n• ')}`;
  }
  return body?.message || msg || 'Request failed';
}

function asList(v?: string[] | null) {
  return (Array.isArray(v) ? v : []).filter(Boolean);
}

// ---------- main ----------
export default function MBTIAdmin() {
  const [rows, setRows] = useState<MBTI[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // form fields
  const [fType, setFType] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fTraits, setFTraits] = useState<string[]>([]);
  const [fStrengths, setFStrengths] = useState<string[]>([]);
  const [fGrowth, setFGrowth] = useState<string[]>([]);
  const [fEnvs, setFEnvs] = useState<string[]>([]);
  const [fComms, setFComms] = useState<string[]>([]);
  const [fCollab, setFCollab] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getApi<MBTIM>('/mbti/results');
      const map = data?.data || {};
      const arr = Object.values(map).map((v) => ({
        ...v,
        traits: asList(v.traits),
        strengths: asList(v.strengths),
        growth: asList(v.growth),
        idealEnvironments: asList(v.idealEnvironments),
        communicationStyle: asList(v.communicationStyle),
        collaborationTips: asList(v.collaborationTips),
      }));
      arr.sort((a, b) => a.type.localeCompare(b.type));
      setRows(arr);
    } finally {
      setLoading(false);
    }
  }

  async function seed() {
    setLoading(true);
    try {
      await postApi('/mbti/seed');
      await load();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.type.toLowerCase().includes(s) ||
      r.title?.toLowerCase().includes(s) ||
      r.description?.toLowerCase().includes(s) ||
      r.traits?.some(t => t.toLowerCase().includes(s)) ||
      r.strengths?.some(t => t.toLowerCase().includes(s))
    );
  }, [rows, q]);

  function openCreate() {
    setMode('create');
    setErr(null);
    setFType('');
    setFTitle('');
    setFDesc('');
    setFTraits([]);
    setFStrengths([]);
    setFGrowth([]);
    setFEnvs([]);
    setFComms([]);
    setFCollab([]);
    setOpen(true);
  }

  function openEdit(row: MBTI) {
    setMode('edit');
    setErr(null);
    setFType(row.type || '');
    setFTitle(row.title || '');
    setFDesc(row.description || '');
    setFTraits(asList(row.traits));
    setFStrengths(asList(row.strengths));
    setFGrowth(asList(row.growth));
    setFEnvs(asList(row.idealEnvironments));
    setFComms(asList(row.communicationStyle));
    setFCollab(asList(row.collaborationTips));
    setOpen(true);
  }

  function validate(): string | null {
    const type = (fType || '').toUpperCase();
    if (!type) return 'Type is required.';
    if (!TYPE_REGEX.test(type)) return 'Type must look like INTJ / ENFP etc.';
    if (!fTitle.trim()) return 'Title is required.';
    if (!fDesc.trim()) return 'Description is required.';
    return null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setSaving(true);
    try {
      const payload: MBTI = {
        type: fType.toUpperCase(),
        title: fTitle.trim(),
        description: fDesc.trim(),
        traits: fTraits.filter(Boolean),
        strengths: fStrengths.filter(Boolean),
        growth: fGrowth.filter(Boolean),
        idealEnvironments: fEnvs.filter(Boolean),
        communicationStyle: fComms.filter(Boolean),
        collaborationTips: fCollab.filter(Boolean),
      };
      // single-item upsert via bulk endpoint
      await postApi('/mbti/results/bulk', [payload]);
      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(parseServerError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">MBTI (Personality Library)</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search type / title / trait…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-60 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
          />
          <Button
            variant="outline"
            className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={load}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button
            variant="outline"
            className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={seed}
          >
            <RocketIcon className="w-4 h-4 mr-2" /> Seed
          </Button>
          <Button className="h-9 bg-cyan-600 hover:bg-cyan-500 text-white" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Type
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Traits</th>
              <th className="text-left px-4 py-3">Updated</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No data</td></tr>
            ) : filtered.map((r) => {
              const isOpen = expanded === r.type;
              return (
                <FragmentRow
                  key={r.type}
                  row={r}
                  isOpen={isOpen}
                  onToggle={() => setExpanded(prev => prev === r.type ? null : r.type)}
                  onEdit={() => openEdit(r)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New MBTI Type' : `Edit ${fType.toUpperCase()}`}</DialogTitle>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Type *</Label>
                <Input
                  value={fType}
                  onChange={(e) => setFType(e.target.value.toUpperCase())}
                  placeholder="e.g., INTJ"
                  className="mt-1 bg-white/5 border-white/10 text-white font-mono"
                  maxLength={4}
                  disabled={mode === 'edit'}
                  required
                />
              </div>

              <div>
                <Label className="text-slate-300">Title *</Label>
                <Input
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                  placeholder="The Architect"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-slate-300">Description *</Label>
                <Textarea
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white min-h-[96px]"
                  placeholder="Short, helpful summary for this type"
                  required
                />
              </div>

              <ArrayEditor label="Core Traits" items={fTraits} setItems={setFTraits} placeholder="e.g., Systems thinker" />
              <ArrayEditor label="Strengths" items={fStrengths} setItems={setFStrengths} placeholder="e.g., Strategic planning" />
              <ArrayEditor label="Growth Edges" items={fGrowth} setItems={setFGrowth} placeholder="e.g., Embrace flexibility" />
              <ArrayEditor label="Ideal Environments" items={fEnvs} setItems={setFEnvs} placeholder="e.g., Quiet focus time" />
              <ArrayEditor label="Communication Style" items={fComms} setItems={setFComms} placeholder="e.g., Direct & concise" />
              <ArrayEditor label="Collaboration Tips" items={fCollab} setItems={setFCollab} placeholder="e.g., Share rationale early" />
            </div>

            {err && (
              <div className="whitespace-pre-wrap text-rose-300 text-sm bg-rose-950/30 border border-rose-900/50 rounded-lg p-3">
                {err}
              </div>
            )}

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={saving} type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {mode === 'create' ? 'Create Type' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* --------------------------------- pieces --------------------------------- */
import React from 'react';

function RocketIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M5 15l-2 6 6-2M14 10l-4 4M14 10c3-3 7-9 7-9s-6 4-9 7m2 2a3 3 0 11-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function ArrayEditor({
  label, items, setItems, placeholder,
}: {
  label: string;
  items: string[];
  setItems: (v: string[]) => void;
  placeholder?: string;
}) {
  const [val, setVal] = useState('');

  function add() {
    const v = val.trim();
    if (!v) return;
    setItems([...items, v]);
    setVal('');
  }
  function remove(i: number) {
    const next = items.slice(); next.splice(i, 1); setItems(next);
  }
  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  }

  return (
    <div className="md:col-span-1">
      <Label className="text-slate-300">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="bg-white/5 border-white/10 text-white"
        />
        <Button type="button" onClick={add} className="bg-white/10 hover:bg-white/15 text-white">
          Add
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {items.map((t, i) => (
          <Badge
            key={`${t}-${i}`}
            variant="secondary"
            className="bg-white/10 border border-white/10 text-slate-200 max-w-full truncate cursor-pointer"
            title="Click to remove"
            onClick={() => remove(i)}
          >
            {t}
          </Badge>
        ))}
        {!items.length && <span className="text-slate-500 text-sm">No items yet</span>}
      </div>
    </div>
  );
}

function FragmentRow({
  row, isOpen, onToggle, onEdit,
}: {
  row: MBTI;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const shortTraits = (row.traits || []).slice(0, 4);
  const moreCount = Math.max(0, (row.traits || []).length - shortTraits.length);

  return (
    <>
      <tr className="border-t border-white/10">
        <td className="px-4 py-3 font-mono text-white">{row.type}</td>
        <td className="px-4 py-3 text-white">{row.title}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {shortTraits.map((t, i) => (
              <Badge key={`${t}-${i}`} variant="secondary" className="bg-white/10 border border-white/10 text-slate-200">
                {t}
              </Badge>
            ))}
            {moreCount > 0 && (
              <Badge variant="outline" className="border-white/20 text-slate-300">
                +{moreCount} more
              </Badge>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-slate-300">
          {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—'}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex items-center gap-2">
            <Button variant="ghost" className="text-cyan-300 hover:text-cyan-200 hover:bg-white/5" onClick={onEdit}>
              <PencilLine className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" className="text-slate-300 hover:text-slate-100 hover:bg-white/5" onClick={onToggle}>
              <Eye className="w-4 h-4 mr-1" /> {isOpen ? 'Hide' : 'View'}
              {isOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </td>
      </tr>

      {/* expandable preview */}
      {isOpen && (
        <tr className="border-t border-white/10 bg-white/5/50">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-slate-200">
              <div>
                <h4 className="font-semibold text-white mb-1">Description</h4>
                <p className="text-slate-300">{row.description || '—'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Core Traits</h4>
                <ListChips items={row.traits} />
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Strengths</h4>
                <ListChips items={row.strengths} />
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Growth Edges</h4>
                <ListChips items={row.growth} />
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Ideal Environments</h4>
                <ListChips items={row.idealEnvironments} />
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1">Communication Style</h4>
                <ListChips items={row.communicationStyle} />
              </div>

              <div className="lg:col-span-2">
                <h4 className="font-semibold text-white mb-1">Collaboration Tips</h4>
                <ListChips items={row.collaborationTips} />
              </div>
            </div>
            <Separator className="my-3 bg-white/10" />
          </td>
        </tr>
      )}
    </>
  );
}

function ListChips({ items }: { items?: string[] }) {
  const arr = asList(items);
  if (!arr.length) return <span className="text-slate-500">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {arr.map((t, i) => (
        <Badge key={`${t}-${i}`} variant="secondary" className="bg-white/10 border border-white/10 text-slate-200">
          {t}
        </Badge>
      ))}
    </div>
  );
}
