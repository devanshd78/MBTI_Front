'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getApi, postApi } from '@/lib/api';

// lucide
import {
  Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Edit3, Loader2,
  ChevronUp, ChevronDown, Palette, Hash,
  Image as ImageIcon, Smartphone, Music, PlayCircle, X
} from 'lucide-react';

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

  // NEW: assets
  background?: {
    fileId?: string;          // GridFS id
    mobileFileId?: string;    // GridFS id (optional)
    overlayOpacity?: number;  // 0..1
  };
  music?: {
    fileId?: string;          // GridFS id
    volume?: number;          // 0..1
    loop?: boolean;
    autoplay?: boolean;
  };
};

// ---------- icon map (lucide) ----------
import {
  Sparkles, Compass, Eye, Lock, Brain, Star as Stars, Rocket,
  ArrowRight, ChevronDown as ChevronDownIcon, Zap, Heart, TrendingUp,
  Target, Globe, Flame, Bolt, Leaf
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Compass, Eye, Lock, Brain, Stars, Rocket,
  ArrowRight, ChevronDown: ChevronDownIcon, Zap, Heart, TrendingUp,
  Target, Globe, Flame, Bolt, Leaf,
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

// Media endpoints
const MEDIA_BASE = '/media';
const mediaSrc = (id?: string) => (id ? `${MEDIA_BASE}/${id}` : '');

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

// Upload helper to GridFS
async function uploadToMedia(file: File): Promise<{ id: string; filename: string; length: number; contentType?: string }> {
  const fd = new FormData();
  fd.append('file', file);

  const r = await fetch(`http://localhost:4000${MEDIA_BASE}`, { method: 'POST', body: fd });
  if (!r.ok) {
    const msg = await r.text().catch(() => '');
    throw new Error(msg || `Upload failed (${r.status})`);
  }
  const json = await r.json();
  return json?.data;
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

  // core fields
  const [fTitle, setFTitle] = useState('');
  const [fSlug, setFSlug] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fGradient, setFGradient] = useState(GRADIENT_PRESETS[0].css);
  const [fGradientPreset, setFGradientPreset] = useState<string>('preset-0'); // 'custom' or 'preset-index'
  const [fIconKey, setFIconKey] = useState('Sparkles');
  const [fFeaturesCSV, setFFeaturesCSV] = useState('');
  const [fOrder, setFOrder] = useState<number>(0);
  const [fActive, setFActive] = useState(true);

  // NEW: assets fields
  const [fBgId, setFBgId] = useState<string | undefined>(undefined);
  const [fBgMobileId, setFBgMobileId] = useState<string | undefined>(undefined);
  const [fOverlay, setFOverlay] = useState<number>(0.35);

  const [fMusicId, setFMusicId] = useState<string | undefined>(undefined);
  const [fMusicAutoplay, setFMusicAutoplay] = useState<boolean>(false);
  const [fMusicLoop, setFMusicLoop] = useState<boolean>(true);
  const [fMusicVol, setFMusicVol] = useState<number>(0.4);

  // upload states
  const [uplBgBusy, setUplBgBusy] = useState(false);
  const [uplBgMobileBusy, setUplBgMobileBusy] = useState(false);
  const [uplMusicBusy, setUplMusicBusy] = useState(false);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // features modal
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

    // reset assets
    setFBgId(undefined);
    setFBgMobileId(undefined);
    setFOverlay(0.35);
    setFMusicId(undefined);
    setFMusicAutoplay(false);
    setFMusicLoop(true);
    setFMusicVol(0.4);

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

    // assets
    setFBgId(row.background?.fileId);
    setFBgMobileId(row.background?.mobileFileId);
    setFOverlay(
      typeof row.background?.overlayOpacity === 'number'
        ? Math.min(1, Math.max(0, row.background.overlayOpacity!))
        : 0.35
    );
    setFMusicId(row.music?.fileId);
    setFMusicAutoplay(!!row.music?.autoplay);
    setFMusicLoop(row.music?.loop ?? true);
    setFMusicVol(
      typeof row.music?.volume === 'number'
        ? Math.min(1, Math.max(0, row.music.volume!))
        : 0.4
    );

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

    const payload: any = {
      title,
      slug,
      description,
      gradient,
      iconKey,
      features,
      order,
      isActive: !!fActive
    };

    // include assets if present (safe for create & update)
    const bg: any = {};
    if (fBgId) bg.fileId = fBgId;
    if (fBgMobileId) bg.mobileFileId = fBgMobileId;
    if (typeof fOverlay === 'number') bg.overlayOpacity = Math.min(1, Math.max(0, fOverlay));
    if (Object.keys(bg).length) payload.background = bg;

    const music: any = {};
    if (fMusicId) music.fileId = fMusicId;
    if (typeof fMusicVol === 'number') music.volume = Math.min(1, Math.max(0, fMusicVol));
    music.loop = !!fMusicLoop;
    music.autoplay = !!fMusicAutoplay;
    if (music.fileId || typeof music.volume === 'number') payload.music = music;

    return payload;
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

  // Upload handlers
  async function onPickBg(file?: File | null) {
    if (!file) return;
    setUplBgBusy(true);
    try {
      const { id } = await uploadToMedia(file);
      setFBgId(id);
    } catch (e: any) {
      setErr(e?.message || 'Background upload failed');
    } finally {
      setUplBgBusy(false);
    }
  }
  async function onPickBgMobile(file?: File | null) {
    if (!file) return;
    setUplBgMobileBusy(true);
    try {
      const { id } = await uploadToMedia(file);
      setFBgMobileId(id);
    } catch (e: any) {
      setErr(e?.message || 'Mobile background upload failed');
    } finally {
      setUplBgMobileBusy(false);
    }
  }
  async function onPickMusic(file?: File | null) {
    if (!file) return;
    setUplMusicBusy(true);
    try {
      const { id } = await uploadToMedia(file);
      setFMusicId(id);
    } catch (e: any) {
      setErr(e?.message || 'Music upload failed');
    } finally {
      setUplMusicBusy(false);
    }
  }

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

      {/* Create / Edit Dialog (responsive + scrollable) */}
      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent
          className="
            w-[95vw] sm:w-full sm:max-w-3xl
            p-0 overflow-hidden
            bg-slate-900 border-white/10 text-white
            flex flex-col
            max-h-[85vh]
          "
        >
          {/* Sticky header */}
          <DialogHeader
            className="
              sticky top-0 z-10
              px-6 py-4
              bg-slate-900/95 backdrop-blur
              border-b border-white/10
            "
          >
            <DialogTitle>{mode === 'create' ? 'New Theme' : 'Edit Theme'}</DialogTitle>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="theme-form" onSubmit={submitForm} className="space-y-6">
              {/* core fields */}
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

                {/* Icon Key */}
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

                {/* Gradient */}
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

                {/* Features */}
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

                {/* Active */}
                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                  <Switch id="active" checked={fActive} onCheckedChange={setFActive} />
                  <Label htmlFor="active" className="text-slate-300">Active</Label>
                </div>
              </div>

              {/* Background section */}
              <div className="rounded-xl border border-white/10 p-4 bg-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-cyan-300" />
                  <h4 className="text-white font-semibold">Background</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Desktop / Default
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onPickBg(e.target.files?.[0])}
                        className="text-sm file:mr-2 file:rounded file:border file:border-white/10 file:bg-white/10 file:text-white file:px-3 file:py-1"
                      />
                      {uplBgBusy && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
                      {fBgId && (
                        <Button variant="ghost" className="h-8 text-rose-300 hover:text-rose-200"
                                type="button" onClick={() => setFBgId(undefined)}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    {fBgId && (
                      <div className="mt-2">
                        <img
                          src={mediaSrc(fBgId)}
                          alt="Background preview"
                          className="h-32 w-full object-cover rounded-lg border border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Mobile (optional)
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onPickBgMobile(e.target.files?.[0])}
                        className="text-sm file:mr-2 file:rounded file:border file:border-white/10 file:bg-white/10 file:text-white file:px-3 file:py-1"
                      />
                      {uplBgMobileBusy && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
                      {fBgMobileId && (
                        <Button variant="ghost" className="h-8 text-rose-300 hover:text-rose-200"
                                type="button" onClick={() => setFBgMobileId(undefined)}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    {fBgMobileId && (
                      <div className="mt-2">
                        <img
                          src={mediaSrc(fBgMobileId)}
                          alt="Mobile background preview"
                          className="h-32 w-full object-cover rounded-lg border border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-slate-300">Overlay Opacity ({fOverlay.toFixed(2)})</Label>
                    <input
                      type="range"
                      min={0} max={1} step={0.01}
                      value={fOverlay}
                      onChange={(e) => setFOverlay(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                    <p className="text-slate-400 text-xs mt-1">Helps keep text readable over bright images.</p>
                  </div>
                </div>
              </div>

              {/* Music section */}
              <div className="rounded-xl border border-white/10 p-4 bg-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-violet-300" />
                  <h4 className="text-white font-semibold">Theme Music</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" /> Upload audio
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => onPickMusic(e.target.files?.[0])}
                        className="text-sm file:mr-2 file:rounded file:border file:border-white/10 file:bg-white/10 file:text-white file:px-3 file:py-1"
                      />
                      {uplMusicBusy && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
                      {fMusicId && (
                        <Button variant="ghost" className="h-8 text-rose-300 hover:text-rose-200"
                                type="button" onClick={() => setFMusicId(undefined)}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    {fMusicId && (
                      <audio
                        className="mt-2 w-full"
                        src={mediaSrc(fMusicId)}
                        controls
                        preload="none"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch id="loop" checked={fMusicLoop} onCheckedChange={setFMusicLoop} />
                      <Label htmlFor="loop" className="text-slate-300">Loop</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="autoplay" checked={fMusicAutoplay} onCheckedChange={setFMusicAutoplay} />
                      <Label htmlFor="autoplay" className="text-slate-300">Autoplay (may be blocked by browser)</Label>
                    </div>
                    <div>
                      <Label className="text-slate-300">Volume ({fMusicVol.toFixed(2)})</Label>
                      <input
                        type="range"
                        min={0} max={1} step={0.01}
                        value={fMusicVol}
                        onChange={(e) => setFMusicVol(parseFloat(e.target.value))}
                        className="w-full accent-violet-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {err && (
                <div className="whitespace-pre-wrap text-rose-300 text-sm bg-rose-950/30 border border-rose-900/50 rounded-lg p-3">
                  {err}
                </div>
              )}
            </form>
          </div>

          {/* Sticky footer */}
          <DialogFooter
            className="
              sticky bottom-0 z-10
              gap-2 px-6 py-4
              bg-slate-900/95 backdrop-blur
              border-t border-white/10
            "
          >
            <DialogClose asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                Cancel
              </Button>
            </DialogClose>
            <Button
              form="theme-form"
              disabled={saving || uplBgBusy || uplBgMobileBusy || uplMusicBusy}
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              {mode === 'create' ? 'Create Theme' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full features dialog */}
      <Dialog open={featuresOpen} onOpenChange={setFeaturesOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{featuresTitle}</DialogTitle>
          </DialogHeader>
          <InlineChips items={featuresItems} />
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
