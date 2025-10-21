'use client';

import { useEffect, useMemo, useState } from 'react';
import { getApi, postApi } from '@/lib/api';
import { Plus, RefreshCw, PencilLine, Layers } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// shadcn ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

type Theme = { _id: string; title: string };
type Dimension = 'EI'|'SN'|'TF'|'JP';

type Question = {
  _id?: string;
  themeId: string;
  code: string;                       // e.g., "EI-01"
  dimension: Dimension;
  title: string;
  scenario: string;
  options: { A: string; B: string };  // visible choices
  scores: { A: string; B: string };   // letters (must match pair for dimension)
};

type PairTitles = {
  EI?: { title: string };
  SN?: { title: string };
  TF?: { title: string };
  JP?: { title: string };
} | null;

type QRes = { success: true; data: { themeId: string; pairTitles: PairTitles; questions: Question[] } };
type ListThemes = { success: boolean; data: Theme[]; meta?: any };

const DIM_TO_PAIR: Record<Dimension, [string,string]> = {
  EI: ['E','I'],
  SN: ['S','N'],
  TF: ['T','F'],
  JP: ['J','P'],
};

export default function QuestionsAdmin() {
  const sp = useSearchParams();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeId, setThemeId] = useState(sp.get('theme') || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pairTitles, setPairTitles] = useState<PairTitles>(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);

  // Editing state
  const [draft, setDraft] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [pairSaving, setPairSaving] = useState(false);

  async function loadThemes() {
    const json = await getApi<ListThemes>('/themes', { limit: 100, sort: 'title:asc' });
    setThemes(json.data);
    if (!themeId && json.data.length) setThemeId(json.data[0]._id);
  }

  async function loadQuestions() {
    if (!themeId) return;
    setLoading(true);
    const q = await getApi<QRes>(`/themes/${themeId}/questions`);
    setQuestions(q.data.questions || []);
    setPairTitles(q.data.pairTitles || null);
    setLoading(false);
  }

  useEffect(() => { loadThemes(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { loadQuestions(); /* eslint-disable-next-line */ }, [themeId]);

  // Helpers
  const byDimension = useMemo(() => {
    const map: Record<Dimension, Question[]> = { EI:[], SN:[], TF:[], JP:[] };
    for (const q of questions) map[q.dimension].push(q);
    (Object.keys(map) as Dimension[]).forEach((k) => {
      map[k].sort((a,b) => a.code.localeCompare(b.code));
    });
    return map;
  }, [questions]);

  const nextCodeFor = (dim: Dimension) => {
    const list = byDimension[dim];
    let max = 0;
    for (const q of list) {
      const m = q.code.match(/-(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    const n = (max + 1).toString().padStart(2, '0');
    return `${dim}-${n}`;
  };

  const openNew = () => {
    const dim: Dimension = 'EI';
    const [a,b] = DIM_TO_PAIR[dim];
    setDraft({
      themeId,
      code: nextCodeFor(dim),
      dimension: dim,
      title: '',
      scenario: '',
      options: { A: '', B: '' },
      scores: { A: a, B: b },
    });
    setEditOpen(true);
  };

  const openEdit = (q: Question) => {
    setDraft(JSON.parse(JSON.stringify(q)));
    setEditOpen(true);
  };

  const onChangeDraft = (patch: Partial<Question>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
  };

  const onChangeDimension = (dim: Dimension) => {
    const [a,b] = DIM_TO_PAIR[dim];
    onChangeDraft({
      dimension: dim,
      code: draft?.code?.replace(/^[A-Z]{2}-/, `${dim}-`) || nextCodeFor(dim),
      scores: { A: a, B: b }
    });
  };

  const validateDraft = (q: Question): string | null => {
    if (!q.code?.trim()) return 'Code is required.';
    if (!q.title?.trim()) return 'Title is required.';
    if (!q.scenario?.trim()) return 'Scenario is required.';
    if (!q.options?.A?.trim() || !q.options?.B?.trim()) return 'Both options (A & B) are required.';
    const [a,b] = DIM_TO_PAIR[q.dimension];
    if (![a,b].includes(q.scores.A) || ![a,b].includes(q.scores.B)) {
      return `Scores must be ${a} or ${b} for dimension ${q.dimension}.`;
    }
    return null;
  };

  const saveDraft = async () => {
    if (!draft || !themeId) return;
    const err = validateDraft(draft);
    if (err) { alert(err); return; }
    setSaving(true);
    try {
      const payload = { questions: [draft] };
      await postApi(`/themes/${themeId}/questions/bulk`, payload);
      setEditOpen(false);
      setDraft(null);
      await loadQuestions();
    } finally {
      setSaving(false);
    }
  };

  const openPairTitles = () => setPairOpen(true);

  const [pairForm, setPairForm] = useState<{EI:string;SN:string;TF:string;JP:string}>({
    EI: '', SN: '', TF: '', JP: ''
  });

  useEffect(() => {
    setPairForm({
      EI: pairTitles?.EI?.title || '',
      SN: pairTitles?.SN?.title || '',
      TF: pairTitles?.TF?.title || '',
      JP: pairTitles?.JP?.title || '',
    });
  }, [pairTitles]);

  const savePairTitles = async () => {
    if (!themeId) return;
    setPairSaving(true);
    try {
      await postApi(`/themes/${themeId}/update`, {
        pairTitles: {
          EI: pairForm.EI ? { title: pairForm.EI } : undefined,
          SN: pairForm.SN ? { title: pairForm.SN } : undefined,
          TF: pairForm.TF ? { title: pairForm.TF } : undefined,
          JP: pairForm.JP ? { title: pairForm.JP } : undefined,
        }
      });
      setPairOpen(false);
      await loadQuestions();
    } finally {
      setPairSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Questions</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* THEME PICKER — shadcn Select only */}
          <Select value={themeId} onValueChange={(v) => setThemeId(v)}>
            <SelectTrigger className="w-64 border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Select theme…" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              {themes.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={loadQuestions}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={openPairTitles}
          >
            <Layers className="w-4 h-4 mr-2" />
            Chapter Titles
          </Button>
          <Button
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
            onClick={openNew}
            disabled={!themeId}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Question
          </Button>
        </div>
      </div>

      {/* Pair titles preview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 grid md:grid-cols-4 gap-3">
        {(['EI','SN','TF','JP'] as Dimension[]).map(dim => (
          <div key={dim} className="rounded-lg bg-white/5 border border-white/10 p-3">
            <div className="text-slate-400">{dim}</div>
            <div className="text-white">{pairTitles?.[dim]?.title || '—'}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Dim</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Option A / B</th>
              <th className="text-left px-4 py-3">Scores A/B</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No questions</td></tr>
            ) : questions.map(q => (
              <tr key={q.code} className="border-t border-white/10 align-top">
                <td className="px-4 py-3 font-mono text-slate-200">{q.code}</td>
                <td className="px-4 py-3">{q.dimension}</td>
                <td className="px-4 py-3">
                  <div className="text-slate-200">{q.title}</div>
                  <div className="text-slate-400 text-xs mt-1 line-clamp-2">{q.scenario}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-200">A: <span className="text-slate-300">{q.options.A}</span></div>
                  <div className="text-slate-200">B: <span className="text-slate-300">{q.options.B}</span></div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-200">A → <span className="font-semibold">{q.scores.A}</span></div>
                  <div className="text-slate-200">B → <span className="font-semibold">{q.scores.B}</span></div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    className="text-cyan-300 hover:text-cyan-200 hover:bg-white/5"
                    onClick={() => openEdit(q)}
                  >
                    <PencilLine className="w-4 h-4 mr-1" /> Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) { setEditOpen(false); setDraft(null); } }}>
        <DialogContent className="sm:max-w-[720px] bg-slate-900 border-white/10 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white">{draft?._id ? 'Edit Question' : 'New Question'}</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label className="text-slate-400 text-xs">Dimension</Label>
                  <Select
                    value={draft.dimension}
                    onValueChange={(v: Dimension) => onChangeDimension(v)}
                  >
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {(['EI','SN','TF','JP'] as Dimension[]).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-slate-400 text-xs">Code</Label>
                  <Input
                    value={draft.code}
                    onChange={(e) => onChangeDraft({ code: e.target.value.toUpperCase() })}
                    className="mt-1 bg-white/5 border-white/10 text-white font-mono"
                    placeholder="EI-01"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-400 text-xs">Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => onChangeDraft({ title: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-400 text-xs">Scenario</Label>
                <Textarea
                  value={draft.scenario}
                  onChange={(e) => onChangeDraft({ scenario: e.target.value })}
                  rows={4}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 p-3 bg-white/5">
                  <div className="font-semibold text-white mb-2">Option A</div>
                  <Input
                    value={draft.options.A}
                    onChange={(e) => onChangeDraft({ options: { ...draft.options, A: e.target.value } })}
                    className="bg-slate-950/60 border-white/10 text-white"
                    placeholder="Text for option A"
                  />
                  <div className="mt-2">
                    <Label className="text-slate-400 text-xs">
                      Score Letter
                    </Label>
                    <Select
                      value={draft.scores.A}
                      onValueChange={(v) => onChangeDraft({ scores: { ...draft.scores, A: v } })}
                    >
                      <SelectTrigger className="mt-1 w-28 bg-slate-950/60 border-white/10 text-white">
                        <SelectValue placeholder={`Pick ${DIM_TO_PAIR[draft.dimension].join('/')}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {DIM_TO_PAIR[draft.dimension].map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 p-3 bg-white/5">
                  <div className="font-semibold text-white mb-2">Option B</div>
                  <Input
                    value={draft.options.B}
                    onChange={(e) => onChangeDraft({ options: { ...draft.options, B: e.target.value } })}
                    className="bg-slate-950/60 border-white/10 text-white"
                    placeholder="Text for option B"
                  />
                  <div className="mt-2">
                    <Label className="text-slate-400 text-xs">
                      Score Letter
                    </Label>
                    <Select
                      value={draft.scores.B}
                      onValueChange={(v) => onChangeDraft({ scores: { ...draft.scores, B: v } })}
                    >
                      <SelectTrigger className="mt-1 w-28 bg-slate-950/60 border-white/10 text-white">
                        <SelectValue placeholder={`Pick ${DIM_TO_PAIR[draft.dimension].join('/')}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {DIM_TO_PAIR[draft.dimension].map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={saveDraft}
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pair Titles Dialog */}
      <Dialog open={pairOpen} onOpenChange={setPairOpen}>
        <DialogContent className="sm:max-w-[640px] bg-slate-900 border-white/10 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Chapter Titles</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-3">
            {(['EI','SN','TF','JP'] as Dimension[]).map(dim => (
              <div key={dim} className="rounded-xl border border-white/10 p-3 bg-white/5">
                <Label className="text-slate-400 text-xs mb-1">{dim}</Label>
                <Input
                  value={pairForm[dim]}
                  onChange={(e) => setPairForm((p) => ({ ...p, [dim]: e.target.value }))}
                  className="bg-slate-950/60 border-white/10 text-white"
                  placeholder="e.g., Chapter I: Energy — Crowd or Cocoon"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={savePairTitles}
              disabled={pairSaving}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {pairSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
