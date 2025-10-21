'use client';

import { useEffect, useMemo, useState } from 'react';
import { getApi, postApi } from '@/lib/api';
import {
  Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight,
  Edit3, Loader2, ChevronUp, ChevronDown, Palette, Hash
} from 'lucide-react';
import Link from 'next/link';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// ---------- types ----------
type ApiList<T> = { success: boolean; data: T[]; meta?: any };

type Theme = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  gradient: string;   // CSS gradient string like 'linear-gradient(...)'
  iconKey: string;    // e.g., 'Sparkles'
  features: string[];
  order: number;
  isActive: boolean;
  createdAt?: string;
};

// ---------- icon map (lucide) ----------
import {
  Sparkles, Compass, Eye, Lock, Brain, Star as Stars, Rocket,
  ArrowRight, ChevronDown as ChevronDownIcon, Zap, Heart, TrendingUp, Target, Globe, Flame, Bolt, Leaf
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Compass, Eye, Lock, Brain, Stars, Rocket,
  ArrowRight, ChevronDown: ChevronDownIcon, Zap, Heart, TrendingUp, Target, Globe, Flame, Bolt, Leaf,
};

// Curated choices shown in Select (keys should match ICON_MAP)
const ICON_OPTIONS = [
  'Sparkles','Compass','Eye','Lock','Brain','Stars','Rocket',
  'ArrowRight','ChevronDown','Zap','Heart','TrendingUp','Target','Globe','Flame','Bolt','Leaf'
];

// Gradient presets
const GRADIENT_PRESETS = [
  { label: 'Cyan → Blue',   css: 'linear-gradient(90deg, #22d3ee, #3b82f6)' },
  { label: 'Blue → Violet', css: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' },
  { label: 'Emerald → Teal',css: 'linear-gradient(90deg, #10b981, #14b8a6)' },
  { label: 'Orange → Rose', css: 'linear-gradient(90deg, #f59e0b, #f43f5e)' },
];

// ---------- utils ----------
function slugify(s: string) {
  return s
    .toLowerCase().trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function toIcon(key?: string) {
  if (!key) return Sparkles;
  const exact = ICON_MAP[key];
  if (exact) return exact;
  const found = Object.keys(ICON_MAP).find(k => k.toLowerCase() === key.toLowerCase());
  return found ? ICON_MAP[found] : Sparkles;
}

export default function ThemesAdmin() {
  const [rows, setRows] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('-createdAt');

  // dialog+form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'create'|'edit'>('create');
  const [editing, setEditing] = useState<Theme | null>(null);

  // form fields
  const [fTitle, setFTitle] = useState('');
  const [fSlug, setFSlug] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fGradient, setFGradient] = useState(GRADIENT_PRESETS[0].css);
  const [fGradientPreset, setFGradientPreset] = useState<string>('preset-0'); // 'custom' or 'preset-index'
  const [fIconKey, setFIconKey] = useState('Sparkles');
  const [fFeaturesCSV, setFFeaturesCSV] = useState('');
  const [fOrder, setFOrder] = useState<number>(0);
  const [fActive, setFActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // features modal (top-level; not inside table to avoid layout weirdness)
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [featuresItems, setFeaturesItems] = useState<string[]>([]);
  const [featuresTitle, setFeaturesTitle] = useState<string>('Features');

  async function load() {
    setLoading(true);
    try {
      const json = await getApi<ApiList<Theme>>('/themes', {
        page, limit, sort, q: q.trim() || undefined
      });
      setRows(json.data);
      setTotal(json.meta?.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, limit, sort]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  function openCreate() {
    setMode('create');
    setEditing(null);
    setFTitle('');
    setFSlug('');
    setFDesc('');
    setFGradient(GRADIENT_PRESETS[0].css);
    setFGradientPreset('preset-0');
    setFIconKey('Sparkles');
    setFFeaturesCSV('');
    setFOrder(0);
    setFActive(true);
    setErr(null);
    setDialogOpen(true);
  }

  function openEdit(row: Theme) {
    setMode('edit');
    setEditing(row);
    setFTitle(row.title || '');
    setFSlug(row.slug || '');
    setFDesc(row.description || '');
    setFGradient(row.gradient || GRADIENT_PRESETS[0].css);
    const presetIndex = GRADIENT_PRESETS.findIndex(p => p.css === row.gradient);
    setFGradientPreset(presetIndex >= 0 ? `preset-${presetIndex}` : 'custom');
    setFIconKey(row.iconKey || 'Sparkles');
    setFFeaturesCSV((row.features || []).join(', '));
    setFOrder(Number.isFinite(row.order) ? row.order : 0);
    setFActive(!!row.isActive);
    setErr(null);
    setDialogOpen(true);
  }

  async function toggleActive(row: Theme) {
    await postApi(`/themes/${row._id}/update`, { isActive: !row.isActive });
    load();
  }

  async function remove(row: Theme) {
    if (!confirm(`Delete theme "${row.title}"?`)) return;
    await postApi(`/themes/${row._id}/delete`);
    const wouldBeEmpty = rows.length === 1 && page > 1;
    if (wouldBeEmpty) setPage(p => Math.max(1, p - 1));
    await load();
  }

  function buildPayload() {
    const title = fTitle.trim();
    const slug = (fSlug || slugify(title)).trim();
    const description = fDesc.trim();
    const gradient = fGradient.trim();
    const iconKey = fIconKey.trim();
    const order = Number.isFinite(fOrder) ? Math.max(0, Math.trunc(fOrder)) : 0;
    const features = fFeaturesCSV.split(',').map(s => s.trim()).filter(Boolean);

    return {
      title,
      slug,
      description,
      gradient,
      iconKey,
      features,
      order,
      isActive: !!fActive
    };
  }

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

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = buildPayload();

      if (!payload.title) throw new Error('title is required');
      if (!payload.description) throw new Error('description is required');
      if (!payload.gradient) throw new Error('gradient is required');
      if (!payload.iconKey) throw new Error('iconKey is required');

      if (mode === 'create') {
        await postApi('/themes', payload);
      } else if (mode === 'edit' && editing?._id) {
        await postApi(`/themes/${editing._id}/update`, payload);
      }

      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setErr(parseServerError(e));
    } finally {
      setSaving(false);
    }
  }

  function sortToggle(field: string) {
    setSort(prev => {
      const isAsc = prev === field || prev === `${field}:asc`;
      return isAsc ? `${field}:desc` : `${field}:asc`;
    });
  }

  const sortDir = (field: string) => {
    const m = String(sort);
    if (m.startsWith('-') && m.slice(1) === field) return 'desc';
    if (m.startsWith(field)) return m.endsWith(':desc') ? 'desc' : 'asc';
    return null;
  };

  // features preview list in dialog form
  const featuresList = useMemo(
    () => fFeaturesCSV.split(',').map(s => s.trim()).filter(Boolean),
    [fFeaturesCSV]
  );

  const GradientSwatch = ({ css }: { css: string }) => (
    <div
      className="h-5 w-28 rounded border border-white/10"
      style={ css.includes('gradient') ? { backgroundImage: css } : { background: css } }
      title={css}
    />
  );

  const openFeaturesDialog = (title: string, items: string[]) => {
    setFeaturesTitle(title);
    setFeaturesItems(items);
    setFeaturesOpen(true);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Themes</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-48 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
          />
          <Button
            variant="outline"
            className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={load}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button className="h-9 bg-cyan-600 hover:bg-cyan-500 text-white" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Theme
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="text-left px-4 py-3">
                  <button onClick={() => sortToggle('title')} className="inline-flex items-center gap-1 hover:underline">
                    Title
                    {sortDir('title') === 'asc' && <ChevronUp className="w-4 h-4" />}
                    {sortDir('title') === 'desc' && <ChevronDown className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Icon</th>
                <th className="text-left px-4 py-3">Gradient</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Features</th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => sortToggle('createdAt')} className="inline-flex items-center gap-1 hover:underline">
                    Created
                    {sortDir('createdAt') === 'asc' && <ChevronUp className="w-4 h-4" />}
                    {sortDir('createdAt') === 'desc' && <ChevronDown className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">No themes</td></tr>
              ) : rows.map((r) => {
                const Icon = toIcon(r.iconKey);
                return (
                  <tr key={r._id} className="border-t border-white/10 align-top">
                    <td className="px-4 py-3 text-white">{r.title}</td>
                    <td className="px-4 py-3 text-slate-300">{r.slug}</td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-2">
                        <Icon className="w-5 h-5 text-cyan-300" />
                        <span className="text-slate-300">{r.iconKey}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <GradientSwatch css={r.gradient} />
                    </td>
                    <td className="px-4 py-3">{r.order ?? 0}</td>
                    <td className="px-4 py-3">
                      <FeatureCell
                        items={r.features || []}
                        onOpenAll={() => openFeaturesDialog(`${r.title} — Features`, r.features || [])}
                      />
                    </td>
                    <td className="px-4 py-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(r)} className="inline-flex items-center gap-1">
                        {r.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        <span className="text-slate-300">{r.isActive ? 'On' : 'Off'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <Button variant="ghost" className="text-cyan-300 hover:text-cyan-200 hover:bg-white/5"
                              onClick={() => openEdit(r)}>
                        <Edit3 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Link href={`/admin/questions?theme=${r._id}`} className="text-cyan-300 hover:underline inline-flex items-center gap-1">
                        Questions
                      </Link>
                      <Button variant="ghost" className="text-rose-300 hover:text-rose-200 hover:bg-white/5"
                              onClick={() => remove(r)}>
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
        <div>Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={page<=1}
            onClick={() => setPage(p => Math.max(1, p-1))}
            className="h-8 border-white/10 bg-white/5 disabled:opacity-50 text-white"
          >
            Prev
          </Button>
          <span className="px-2">Page {page} / {totalPages}</span>
          <Button
            variant="outline"
            disabled={page>=totalPages}
            onClick={() => setPage(p => p+1)}
            className="h-8 border-white/10 bg-white/5 disabled:opacity-50 text-white"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New Theme' : 'Edit Theme'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <Label className="text-slate-300">Title *</Label>
                <Input
                  value={fTitle}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFTitle(v);
                    if (mode === 'create') setFSlug(slugify(v));
                  }}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                  placeholder="e.g., 16 Shades of You — Story-Based Discovery"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <Label className="text-slate-300">Slug *</Label>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <Input
                    value={fSlug}
                    onChange={(e) => setFSlug(slugify(e.target.value))}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="auto-generated-from-title"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label className="text-slate-300">Description *</Label>
                <Textarea
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white min-h-[96px]"
                  placeholder="Short description shown to users"
                  required
                />
              </div>

              {/* Icon Key — shadcn Select */}
              <div>
                <Label className="text-slate-300">Icon Key *</Label>
                <Select value={fIconKey} onValueChange={setFIconKey}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Pick icon" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {ICON_OPTIONS.map((k) => {
                      const Icon = toIcon(k);
                      return (
                        <SelectItem key={k} value={k}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{k}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Order */}
              <div>
                <Label className="text-slate-300">Order *</Label>
                <Input
                  type="number"
                  min={0}
                  value={Number.isFinite(fOrder) ? fOrder : 0}
                  onChange={(e) => setFOrder(parseInt(e.target.value || '0', 10))}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              {/* Gradient preset */}
              <div className="md:col-span-2">
                <Label className="text-slate-300">Gradient *</Label>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-1">
                  <div className="lg:col-span-1">
                    <Select
                      value={fGradientPreset}
                      onValueChange={(val) => {
                        setFGradientPreset(val);
                        if (val.startsWith('preset-')) {
                          const idx = parseInt(val.split('-')[1] || '0', 10);
                          const css = GRADIENT_PRESETS[idx]?.css ?? GRADIENT_PRESETS[0].css;
                          setFGradient(css);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Choose preset" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {GRADIENT_PRESETS.map((p, i) => (
                          <SelectItem key={p.label} value={`preset-${i}`}>
                            <div className="flex items-center gap-2">
                              <span className="inline-block h-3 w-6 rounded border border-white/10" style={{ backgroundImage: p.css }} />
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom CSS input */}
                  <div className="lg:col-span-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-400" />
                    <Input
                      value={fGradient}
                      onChange={(e) => {
                        setFGradient(e.target.value);
                        setFGradientPreset('custom');
                      }}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="linear-gradient(90deg, #22d3ee, #3b82f6)"
                      required
                    />
                    <div className="shrink-0">
                      <div className="h-8 w-24 rounded border border-white/10" style={{ backgroundImage: fGradient }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features CSV + chips preview */}
              <div className="md:col-span-2">
                <Label className="text-slate-300">Features (comma separated)</Label>
                <Input
                  value={fFeaturesCSV}
                  onChange={(e) => setFFeaturesCSV(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                  placeholder="e.g., 12 story-based questions, Real-world dilemmas, Narrative personality story"
                />
                <div className="mt-2">
                  <InlineChips items={featuresList} />
                </div>
              </div>

              {/* Active switch */}
              <div className="md:col-span-2 flex items-center gap-2 pt-1">
                <Switch id="active" checked={fActive} onCheckedChange={setFActive} />
                <Label htmlFor="active" className="text-slate-300">Active</Label>
              </div>
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
              <Button
                disabled={saving}
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {mode === 'create' ? 'Create Theme' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full features dialog (safe, outside table) */}
      <Dialog open={featuresOpen} onOpenChange={setFeaturesOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{featuresTitle}</DialogTitle>
          </DialogHeader>
          <InlineChips items={featuresList} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** chips renderer in the table cell with responsive clamp + “+N more” */
function FeatureCell({ items, onOpenAll }: { items: string[]; onOpenAll: () => void }) {
  if (!items?.length) return <span className="text-slate-500">—</span>;

  // limits for each breakpoint
  const limits = { base: 2, sm: 4, lg: 8 };

  return (
    <div className="max-w-[280px] sm:max-w-[360px] lg:max-w-[460px]">
      {/* mobile */}
      <ChipRow items={items} limit={limits.base} onOpenAll={onOpenAll} className="block sm:hidden" />
      {/* small screens */}
      <ChipRow items={items} limit={limits.sm} onOpenAll={onOpenAll} className="hidden sm:block lg:hidden" />
      {/* large+ */}
      <ChipRow items={items} limit={limits.lg} onOpenAll={onOpenAll} className="hidden lg:block" />
    </div>
  );
}

function ChipRow({
  items, limit, onOpenAll, className
}: { items: string[]; limit: number; onOpenAll: () => void; className?: string }) {
  const visible = items.slice(0, limit);
  const more = Math.max(0, items.length - visible.length);

  return (
    <div className={['flex flex-wrap gap-1', 'whitespace-normal', 'break-words', className].join(' ')}>
      {visible.map((f, i) => (
        <Badge
          key={`${f}-${i}`}
          variant="secondary"
          className="bg-white/10 border border-white/10 text-slate-200 max-w-full truncate"
          title={f}
        >
          {f}
        </Badge>
      ))}
      {more > 0 && (
        <Button
          type="button"
          onClick={onOpenAll}
          variant="ghost"
          className="h-6 px-2 py-0 text-xs text-slate-300 hover:text-slate-100 hover:bg-white/5"
        >
          +{more} more
        </Button>
      )}
    </div>
  );
}

function InlineChips({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {items.map((f, i) => (
        <Badge
          key={`${f}-${i}`}
          variant="secondary"
          className="bg-white/10 border border-white/10 text-slate-200"
        >
          {f}
        </Badge>
      ))}
    </div>
  );
}
