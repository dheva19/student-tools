import { router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as calendarRoutes from '@/routes/calendar';
import type { Schedule, Team } from '@/types';

// ------------------------------------------------------------------
// Preset colours (same palette as timetable)
// ------------------------------------------------------------------
const PRESET_COLORS = [
    '#3b82f6',
    '#10b981',
    '#8b5cf6',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#64748b',
    '#ffffff',
];

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];
const DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function getDaysInGrid(year: number, month: number): Date[] {
    const firstDay = new Date(year, month - 1, 1);
    // JS getDay(): 0=Sun … 6=Sat → we want Mon=0 … Sun=6
    const startOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(firstDay);
    start.setDate(start.getDate() - startOffset);

    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        cells.push(d);
    }
    return cells;
}

function toYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

// ------------------------------------------------------------------
// ColorPicker sub-component
// ------------------------------------------------------------------
function ColorPicker({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => onChange(c)}
                        className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                            backgroundColor: c,
                            borderColor:
                                value === c ? '#6366f1' : 'transparent',
                            boxShadow:
                                value === c
                                    ? '0 0 0 2px #6366f1'
                                    : '0 0 0 1px #cbd5e1',
                        }}
                    />
                ))}
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded-full border border-slate-300"
                    title="Pilih warna kustom"
                />
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface PageProps {
    schedules: Schedule[];
    currentYear: number;
    currentMonth: number;
    currentTeam: Team;
    [key: string]: unknown;
}

type ScheduleFormData = {
    title: string;
    description: string;
    date: string;
    color: string;
    bg_color: string;
};

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default function CalendarIndex() {
    const { schedules, currentYear, currentMonth, currentTeam } =
        usePage<PageProps>().props;

    const today = toYMD(new Date());
    const cells = getDaysInGrid(currentYear, currentMonth);

    // Group schedules by date string
    const scheduleMap: Record<string, Schedule[]> = {};
    for (const s of schedules) {
        if (!scheduleMap[s.date]) scheduleMap[s.date] = [];
        scheduleMap[s.date].push(s);
    }

    // ------------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------------
    function goToMonth(year: number, month: number) {
        router.get(
            calendarRoutes.index.url(currentTeam.slug),
            { year, month },
            { preserveState: false },
        );
    }

    function prevMonth() {
        if (currentMonth === 1) goToMonth(currentYear - 1, 12);
        else goToMonth(currentYear, currentMonth - 1);
    }

    function nextMonth() {
        if (currentMonth === 12) goToMonth(currentYear + 1, 1);
        else goToMonth(currentYear, currentMonth + 1);
    }

    // ------------------------------------------------------------------
    // Year/month pickers
    // ------------------------------------------------------------------
    const [yearInput, setYearInput] = useState(String(currentYear));
    const [monthInput, setMonthInput] = useState(String(currentMonth));

    useEffect(() => {
        setYearInput(String(currentYear));
        setMonthInput(String(currentMonth));
    }, [currentYear, currentMonth]);

    function jumpToYearMonth() {
        const y = parseInt(yearInput);
        const m = parseInt(monthInput);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
            goToMonth(y, m);
        }
    }

    // ------------------------------------------------------------------
    // Add dialog
    // ------------------------------------------------------------------
    const [addOpen, setAddOpen] = useState(false);

    const addForm = useForm<ScheduleFormData>({
        title: '',
        description: '',
        date: today,
        color: '#ffffff',
        bg_color: '#3b82f6',
    });

    function openAdd(dateStr: string) {
        addForm.reset();
        addForm.setData({
            title: '',
            description: '',
            date: dateStr,
            color: '#ffffff',
            bg_color: '#3b82f6',
        });
        setAddOpen(true);
    }

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post(calendarRoutes.store.url(currentTeam.slug), {
            preserveScroll: true,
            onSuccess: () => {
                setAddOpen(false);
                addForm.reset();
            },
        });
    }

    // ------------------------------------------------------------------
    // Edit dialog
    // ------------------------------------------------------------------
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Schedule | null>(null);

    const editForm = useForm<ScheduleFormData>({
        title: '',
        description: '',
        date: today,
        color: '#ffffff',
        bg_color: '#3b82f6',
    });

    function openEdit(s: Schedule, e: React.MouseEvent) {
        e.stopPropagation();
        setEditTarget(s);
        editForm.setData({
            title: s.title,
            description: s.description ?? '',
            date: s.date,
            color: s.color,
            bg_color: s.bg_color,
        });
        setEditOpen(true);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        editForm.put(calendarRoutes.update.url([currentTeam.slug, editTarget.id]), {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setEditTarget(null);
            },
        });
    }

    // ------------------------------------------------------------------
    // Delete
    // ------------------------------------------------------------------
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
    const deleteForm = useForm({});

    function openDelete(s: Schedule, e: React.MouseEvent) {
        e.stopPropagation();
        setDeleteTarget(s);
        setEditOpen(false);
        setDeleteOpen(true);
    }

    function submitDelete() {
        if (!deleteTarget) return;
        deleteForm.delete(calendarRoutes.destroy.url([currentTeam.slug, deleteTarget.id]), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setDeleteTarget(null);
            },
        });
    }

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <div className="flex flex-col gap-6 p-6">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Month select */}
                    <select
                        value={monthInput}
                        onChange={(e) => {
                            setMonthInput(e.target.value);
                            const y = parseInt(yearInput);
                            const m = parseInt(e.target.value);
                            if (!isNaN(y) && !isNaN(m)) goToMonth(y, m);
                        }}
                        className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
                    >
                        {MONTHS.map((name, i) => (
                            <option key={i} value={i + 1}>
                                {name}
                            </option>
                        ))}
                    </select>

                    {/* Year input */}
                    <input
                        type="number"
                        value={yearInput}
                        onChange={(e) => setYearInput(e.target.value)}
                        onBlur={jumpToYearMonth}
                        onKeyDown={(e) =>
                            e.key === 'Enter' && jumpToYearMonth()
                        }
                        className="border-input bg-background w-20 rounded-md border px-3 py-1.5 text-sm"
                    />

                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    onClick={() => openAdd(today)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Agenda
                </Button>
            </div>

            {/* ── Calendar grid ── */}
            <div className="overflow-hidden rounded-xl border shadow-sm">
                {/* Day-of-week headers */}
                <div className="bg-muted/40 grid grid-cols-7 border-b">
                    {DAYS_SHORT.map((d) => (
                        <div
                            key={d}
                            className="text-muted-foreground py-2 text-center text-xs font-semibold tracking-wide uppercase"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Cells */}
                <div className="grid grid-cols-7">
                    {cells.map((cell, idx) => {
                        const dateStr = toYMD(cell);
                        const isCurrentMonth =
                            cell.getMonth() + 1 === currentMonth;
                        const isToday = dateStr === today;
                        const daySchedules = scheduleMap[dateStr] ?? [];

                        return (
                            <div
                                key={idx}
                                onClick={() => openAdd(dateStr)}
                                className={[
                                    'min-h-[100px] cursor-pointer border-b border-r p-1.5 transition-colors',
                                    'hover:bg-muted/30',
                                    isCurrentMonth
                                        ? 'bg-background'
                                        : 'bg-muted/20',
                                    (idx + 1) % 7 === 0 ? 'border-r-0' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                {/* Date number */}
                                <div className="mb-1 flex justify-end">
                                    <span
                                        className={[
                                            'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                                            isToday
                                                ? 'bg-primary text-primary-foreground font-bold'
                                                : isCurrentMonth
                                                  ? 'text-foreground'
                                                  : 'text-muted-foreground',
                                        ].join(' ')}
                                    >
                                        {cell.getDate()}
                                    </span>
                                </div>

                                {/* Schedule chips */}
                                <div className="flex flex-col gap-0.5">
                                    {daySchedules.map((s) => (
                                        <div
                                            key={s.id}
                                            onClick={(e) => openEdit(s, e)}
                                            className="flex cursor-pointer items-center justify-between truncate rounded px-1.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80"
                                            style={{
                                                backgroundColor: s.bg_color,
                                                color: s.color,
                                            }}
                                            title={s.title}
                                        >
                                            <span className="truncate">
                                                {s.title}
                                            </span>
                                            <Pencil className="ml-1 h-2.5 w-2.5 shrink-0 opacity-60" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Add Dialog ── */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Agenda</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="add-title">Judul *</Label>
                            <Input
                                id="add-title"
                                value={addForm.data.title}
                                onChange={(e) =>
                                    addForm.setData('title', e.target.value)
                                }
                                placeholder="Nama agenda"
                                required
                            />
                            {addForm.errors.title && (
                                <p className="text-destructive text-xs">
                                    {addForm.errors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="add-date">Tanggal *</Label>
                            <Input
                                id="add-date"
                                type="date"
                                value={addForm.data.date}
                                onChange={(e) =>
                                    addForm.setData('date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="add-desc">Deskripsi</Label>
                            <Textarea
                                id="add-desc"
                                value={addForm.data.description}
                                onChange={(e) =>
                                    addForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                                placeholder="Keterangan tambahan (opsional)"
                                rows={3}
                            />
                        </div>

                        <ColorPicker
                            label="Warna Teks"
                            value={addForm.data.color}
                            onChange={(v) => addForm.setData('color', v)}
                        />

                        <ColorPicker
                            label="Warna Latar"
                            value={addForm.data.bg_color}
                            onChange={(v) => addForm.setData('bg_color', v)}
                        />

                        {/* Preview */}
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                                Preview:
                            </span>
                            <span
                                className="rounded px-2 py-0.5 text-xs font-medium"
                                style={{
                                    backgroundColor: addForm.data.bg_color,
                                    color: addForm.data.color,
                                }}
                            >
                                {addForm.data.title || 'Judul agenda'}
                            </span>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={addForm.processing}
                            >
                                {addForm.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Agenda</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-title">Judul *</Label>
                            <Input
                                id="edit-title"
                                value={editForm.data.title}
                                onChange={(e) =>
                                    editForm.setData('title', e.target.value)
                                }
                                required
                            />
                            {editForm.errors.title && (
                                <p className="text-destructive text-xs">
                                    {editForm.errors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-date">Tanggal *</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={editForm.data.date}
                                onChange={(e) =>
                                    editForm.setData('date', e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-desc">Deskripsi</Label>
                            <Textarea
                                id="edit-desc"
                                value={editForm.data.description}
                                onChange={(e) =>
                                    editForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                                placeholder="Keterangan tambahan (opsional)"
                                rows={3}
                            />
                        </div>

                        <ColorPicker
                            label="Warna Teks"
                            value={editForm.data.color}
                            onChange={(v) => editForm.setData('color', v)}
                        />

                        <ColorPicker
                            label="Warna Latar"
                            value={editForm.data.bg_color}
                            onChange={(v) => editForm.setData('bg_color', v)}
                        />

                        {/* Preview */}
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                                Preview:
                            </span>
                            <span
                                className="rounded px-2 py-0.5 text-xs font-medium"
                                style={{
                                    backgroundColor: editForm.data.bg_color,
                                    color: editForm.data.color,
                                }}
                            >
                                {editForm.data.title || 'Judul agenda'}
                            </span>
                        </div>

                        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={(e) =>
                                    editTarget && openDelete(editTarget, e)
                                }
                                className="flex items-center gap-1"
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                >
                                    {editForm.processing
                                        ? 'Menyimpan...'
                                        : 'Perbarui'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm Dialog ── */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Agenda</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        Yakin ingin menghapus agenda{' '}
                        <strong className="text-foreground">
                            {deleteTarget?.title}
                        </strong>
                        ? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={submitDelete}
                            disabled={deleteForm.processing}
                        >
                            {deleteForm.processing ? 'Menghapus...' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

CalendarIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Kalender',
            href: props.currentTeam
                ? `/${props.currentTeam.slug}/calendar`
                : '#',
        },
    ],
});
