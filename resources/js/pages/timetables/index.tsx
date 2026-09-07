import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar as CalendarIcon,
    Check,
    Clock,
    GripVertical,
    MapPin,
    Pencil,
    Plus,
    RotateCcw,
    Save,
    Trash2,
    User,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { batchUpdate, destroy, store, update } from '@/routes/timetable';
import type { BreadcrumbItem, Subject, Team, Timetable } from '@/types';

type Props = {
    timetables: Timetable[];
    subjects: Subject[];
    currentTeam: Team;
};

// Days definition: 1 = Senin, ..., 6 = Sabtu, 0 = Minggu
const DAYS = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 0, label: 'Minggu' },
];

// Hours definition from 07:00 to 21:00
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const ROW_HEIGHT = 60; // 60px per hour => 1px per minute!

const PRESET_COLORS = [
    { bg: '#3b82f6', text: '#ffffff', label: 'Blue' },
    { bg: '#10b981', text: '#ffffff', label: 'Emerald' },
    { bg: '#8b5cf6', text: '#ffffff', label: 'Purple' },
    { bg: '#f59e0b', text: '#ffffff', label: 'Amber' },
    { bg: '#ef4444', text: '#ffffff', label: 'Red' },
    { bg: '#06b6d4', text: '#ffffff', label: 'Cyan' },
    { bg: '#ec4899', text: '#ffffff', label: 'Pink' },
    { bg: '#64748b', text: '#ffffff', label: 'Slate' },
];

function timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function minutesToTime(totalMinutes: number): string {
    const clamped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function TimetableIndex({ timetables: initialTimetables = [], subjects = [], currentTeam }: Props) {
    // Current day of week (0: Sunday, 1: Monday, ..., 6: Saturday)
    const todayDay = useMemo(() => new Date().getDay(), []);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Timetable | null>(null);
    const [deletingItem, setDeletingItem] = useState<Timetable | null>(null);

    // Local items to stage drag & drop / resize / edit changes
    const [items, setItems] = useState<Timetable[]>(initialTimetables);
    const [isSavingChanges, setIsSavingChanges] = useState(false);

    // Sync when server props change
    useEffect(() => {
        setItems(initialTimetables);
    }, [initialTimetables]);

    // Check if there are unsaved pending position/time modifications (from drag & drop / resize)
    const modifiedItems = useMemo(() => {
        const initialMap = new Map<number, Timetable>(initialTimetables.map((t) => [t.id, t]));
        return items.filter((item) => {
            const original = initialMap.get(item.id);
            if (!original) return false;
            return (
                original.day !== item.day ||
                original.start_time !== item.start_time ||
                original.end_time !== item.end_time
            );
        });
    }, [items, initialTimetables]);

    const hasUnsavedChanges = modifiedItems.length > 0;

    // Subject selection mode in create/edit modal
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('custom');

    // Drag / Resize state for direct board interaction
    const [activeInteraction, setActiveInteraction] = useState<{
        type: 'move' | 'resize';
        timetable: Timetable;
        startY: number;
        startX: number;
        initialStartMin: number;
        initialEndMin: number;
        currentStartMin: number;
        currentEndMin: number;
        currentDay: number;
        dayWidth: number;
    } | null>(null);

    const gridRef = useRef<HTMLDivElement>(null);

    // Forms
    const createForm = useForm({
        subject_id: '' as string | number | null,
        title: '',
        day: 1,
        start_time: '08:00',
        end_time: '10:00',
        color: '#ffffff',
        bg_color: '#3b82f6',
    });

    const editForm = useForm({
        subject_id: '' as string | number | null,
        title: '',
        day: 1,
        start_time: '08:00',
        end_time: '10:00',
        color: '#ffffff',
        bg_color: '#3b82f6',
    });

    const deleteForm = useForm({});

    const handleOpenCreateAt = (day: number, hour: number) => {
        const start = `${String(hour).padStart(2, '0')}:00`;
        const end = `${String(hour + 2).padStart(2, '0')}:00`;
        setSelectedSubjectId('custom');
        createForm.setData({
            subject_id: null,
            title: '',
            day,
            start_time: start,
            end_time: end,
            color: '#ffffff',
            bg_color: '#3b82f6',
        });
        createForm.clearErrors();
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(store.url(currentTeam.slug), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleOpenEdit = (item: Timetable) => {
        setEditingItem(item);
        setSelectedSubjectId(item.subject_id ? String(item.subject_id) : 'custom');
        editForm.setData({
            subject_id: item.subject_id ?? null,
            title: item.title,
            day: item.day,
            start_time: item.start_time,
            end_time: item.end_time,
            color: item.color,
            bg_color: item.bg_color,
        });
        editForm.clearErrors();
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        editForm.put(update.url([currentTeam.slug, editingItem.id]), {
            onSuccess: () => {
                setEditingItem(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingItem) return;
        deleteForm.delete(destroy.url([currentTeam.slug, deletingItem.id]), {
            onSuccess: () => {
                setDeletingItem(null);
            },
        });
    };

    // Save All Batch Changes
    const handleSaveAllChanges = () => {
        if (!hasUnsavedChanges || isSavingChanges) return;

        setIsSavingChanges(true);
        router.post(
            batchUpdate.url(currentTeam.slug),
            {
                items: modifiedItems.map((item) => ({
                    id: item.id,
                    day: item.day,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    title: item.title,
                    subject_id: item.subject_id ?? null,
                    color: item.color,
                    bg_color: item.bg_color,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSavingChanges(false);
                },
            },
        );
    };

    // Revert All Changes
    const handleRevertChanges = () => {
        setItems(initialTimetables);
    };

    // Helper when choosing subject dropdown
    const handleSubjectChange = (val: string, isEditing: boolean) => {
        const form = isEditing ? editForm : createForm;
        if (val === 'custom') {
            form.setData((prev) => ({
                ...prev,
                subject_id: null,
                title: '',
            }));
            setSelectedSubjectId('custom');
        } else {
            const sub = subjects.find((s) => s.id === Number(val));
            if (sub) {
                form.setData((prev) => ({
                    ...prev,
                    subject_id: sub.id,
                    title: sub.title,
                }));
            }
            setSelectedSubjectId(val);
        }
    };

    // --- Drag & Drop / Resize Mouse Listeners ---
    const handleMouseDownMove = (e: React.MouseEvent, item: Timetable) => {
        e.stopPropagation();
        e.preventDefault();
        const colEl = (e.currentTarget as HTMLElement).closest('.day-column') as HTMLElement;
        const dayWidth = colEl?.offsetWidth || 150;
        const startMin = timeToMinutes(item.start_time);
        const endMin = timeToMinutes(item.end_time);

        setActiveInteraction({
            type: 'move',
            timetable: item,
            startY: e.clientY,
            startX: e.clientX,
            initialStartMin: startMin,
            initialEndMin: endMin,
            currentStartMin: startMin,
            currentEndMin: endMin,
            currentDay: item.day,
            dayWidth,
        });
    };

    const handleMouseDownResize = (e: React.MouseEvent, item: Timetable) => {
        e.stopPropagation();
        e.preventDefault();
        const colEl = (e.currentTarget as HTMLElement).closest('.day-column') as HTMLElement;
        const dayWidth = colEl?.offsetWidth || 150;
        const startMin = timeToMinutes(item.start_time);
        const endMin = timeToMinutes(item.end_time);

        setActiveInteraction({
            type: 'resize',
            timetable: item,
            startY: e.clientY,
            startX: e.clientX,
            initialStartMin: startMin,
            initialEndMin: endMin,
            currentStartMin: startMin,
            currentEndMin: endMin,
            currentDay: item.day,
            dayWidth,
        });
    };

    useEffect(() => {
        if (!activeInteraction) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - activeInteraction.startY;
            // Snap to 15 minutes step (15px = 15min)
            const minutesDelta = Math.round(deltaY / 15) * 15;

            if (activeInteraction.type === 'resize') {
                const duration = Math.max(
                    30,
                    activeInteraction.initialEndMin - activeInteraction.initialStartMin + minutesDelta,
                );
                const newEndMin = Math.min(END_HOUR * 60, activeInteraction.initialStartMin + duration);
                setActiveInteraction((prev) => (prev ? { ...prev, currentEndMin: newEndMin } : null));
            } else if (activeInteraction.type === 'move') {
                const duration = activeInteraction.initialEndMin - activeInteraction.initialStartMin;
                let newStartMin = activeInteraction.initialStartMin + minutesDelta;
                // Keep inside bounds
                newStartMin = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - duration, newStartMin));
                const newEndMin = newStartMin + duration;

                // Day change detection via horizontal delta
                const deltaX = e.clientX - activeInteraction.startX;
                const dayOffset = Math.round(deltaX / activeInteraction.dayWidth);
                const currentDayIndex = DAYS.findIndex((d) => d.value === activeInteraction.timetable.day);
                let newDayIndex = currentDayIndex + dayOffset;
                newDayIndex = Math.max(0, Math.min(DAYS.length - 1, newDayIndex));
                const newDay = DAYS[newDayIndex].value;

                setActiveInteraction((prev) =>
                    prev
                        ? {
                              ...prev,
                              currentStartMin: newStartMin,
                              currentEndMin: newEndMin,
                              currentDay: newDay,
                          }
                        : null,
                );
            }
        };

        const handleMouseUp = () => {
            if (!activeInteraction) return;
            const { timetable, currentStartMin, currentEndMin, currentDay } = activeInteraction;
            const newStartStr = minutesToTime(currentStartMin);
            const newEndStr = minutesToTime(currentEndMin);

            const hasChanged =
                newStartStr !== timetable.start_time ||
                newEndStr !== timetable.end_time ||
                currentDay !== timetable.day;

            if (hasChanged) {
                // Update local state ONLY (do not auto-send to backend)
                setItems((prev) =>
                    prev.map((t) =>
                        t.id === timetable.id
                            ? {
                                  ...t,
                                  day: currentDay,
                                  start_time: newStartStr,
                                  end_time: newEndStr,
                              }
                            : t,
                    ),
                );
            }

            setActiveInteraction(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeInteraction]);

    // Group timetables by day
    const timetablesByDay = useMemo(() => {
        const map = new Map<number, Timetable[]>();
        DAYS.forEach((d) => map.set(d.value, []));

        items.forEach((t) => {
            // If dragging/resizing this specific item, show its interactive live coordinates
            if (activeInteraction && activeInteraction.timetable.id === t.id) {
                const liveItem: Timetable = {
                    ...t,
                    day: activeInteraction.currentDay,
                    start_time: minutesToTime(activeInteraction.currentStartMin),
                    end_time: minutesToTime(activeInteraction.currentEndMin),
                };
                map.get(liveItem.day)?.push(liveItem);
            } else {
                map.get(t.day)?.push(t);
            }
        });

        return map;
    }, [items, activeInteraction]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Jadwal Pelajaran',
            href: '#',
        },
    ];

    return (
        <>
            <Head title="Jadwal Pelajaran" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Jadwal Pelajaran</h1>
                        <p className="text-sm text-muted-foreground">
                            Atur jadwal mingguan perkuliahan atau agenda rutin. Geser (drag & drop) dan tarik ujung kartu untuk memperpanjang jam pelajaran.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleRevertChanges}
                                disabled={isSavingChanges}
                                className="gap-1.5"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Batal
                            </Button>
                        )}

                        {hasUnsavedChanges && (
                            <Button
                                type="button"
                                onClick={handleSaveAllChanges}
                                disabled={isSavingChanges}
                                className="gap-1.5 shadow-md bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Save className="h-4 w-4" />
                                {isSavingChanges ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        )}

                        <Button
                            onClick={() => {
                                setSelectedSubjectId('custom');
                                createForm.reset();
                                setIsCreateOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Jadwal
                        </Button>
                    </div>
                </div>

                {/* Timetable Grid Board */}
                <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                    <div ref={gridRef} className="min-w-[900px] select-none">
                        {/* Days Header */}
                        <div className="sticky top-0 z-20 grid grid-cols-[80px_repeat(7,1fr)] border-b bg-muted/80 backdrop-blur-md">
                            <div className="flex items-center justify-center p-3 text-xs font-semibold text-muted-foreground border-r">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                Waktu
                            </div>
                            {DAYS.map((day) => {
                                const isToday = todayDay === day.value;

                                return (
                                    <div
                                        key={day.value}
                                        className={`border-r last:border-r-0 p-3 text-center text-sm font-semibold transition-colors ${
                                            isToday
                                                ? 'bg-primary/15 text-primary font-bold shadow-inner'
                                                : 'text-foreground'
                                        }`}
                                    >
                                        {day.label}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Schedule Board Body */}
                        <div className="relative grid grid-cols-[80px_repeat(7,1fr)]">
                            {/* Time Axis (Hours) */}
                            <div className="border-r bg-muted/30">
                                {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                                    const hour = START_HOUR + i;
                                    return (
                                        <div
                                            key={hour}
                                            style={{ height: `${ROW_HEIGHT}px` }}
                                            className="flex items-start justify-center border-b pt-1 text-xs font-medium text-muted-foreground"
                                        >
                                            {String(hour).padStart(2, '0')}:00
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 7 Day Columns */}
                            {DAYS.map((day) => {
                                const dayItems = timetablesByDay.get(day.value) || [];
                                const isToday = todayDay === day.value;

                                return (
                                    <div
                                        key={day.value}
                                        className={`day-column relative border-r last:border-r-0 transition-colors ${
                                            isToday ? 'bg-primary/[0.03] dark:bg-primary/[0.05]' : ''
                                        }`}
                                        style={{ height: `${TOTAL_HOURS * ROW_HEIGHT}px` }}
                                    >
                                        {/* Background Hour Guidelines & Click to add */}
                                        {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                                            const hour = START_HOUR + i;
                                            return (
                                                <div
                                                    key={hour}
                                                    style={{ height: `${ROW_HEIGHT}px` }}
                                                    className={`group/slot border-b border-muted/50 transition-colors cursor-pointer ${
                                                        isToday
                                                            ? 'hover:bg-primary/10'
                                                            : 'hover:bg-muted/40'
                                                    }`}
                                                    onClick={() => handleOpenCreateAt(day.value, hour)}
                                                    title={`Klik untuk tambah jadwal di ${day.label} jam ${String(hour).padStart(2, '0')}:00`}
                                                >
                                                    <div className="hidden group-hover/slot:flex items-center justify-center h-full text-[10px] text-muted-foreground opacity-60">
                                                        + Tambah
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Placed Schedule Cards */}
                                        {dayItems.map((item) => {
                                            const startMin = timeToMinutes(item.start_time);
                                            const endMin = timeToMinutes(item.end_time);

                                            // Offset from START_HOUR
                                            const topMinutes = Math.max(0, startMin - START_HOUR * 60);
                                            const durationMinutes = Math.max(20, endMin - startMin);

                                            const topPx = (topMinutes / 60) * ROW_HEIGHT;
                                            const heightPx = (durationMinutes / 60) * ROW_HEIGHT;

                                            const isInteracting =
                                                activeInteraction?.timetable.id === item.id;

                                            return (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        top: `${topPx}px`,
                                                        height: `${heightPx}px`,
                                                        backgroundColor: item.bg_color,
                                                        color: item.color,
                                                    }}
                                                    className={`group/card absolute inset-x-1 z-10 flex flex-col justify-between overflow-hidden rounded-lg p-2 text-xs shadow-sm transition-[box-shadow,opacity] border border-black/10 dark:border-white/10 ${
                                                        isInteracting
                                                            ? 'opacity-90 shadow-xl ring-2 ring-primary cursor-grabbing'
                                                            : 'hover:shadow-md cursor-grab'
                                                    }`}
                                                    onMouseDown={(e) => handleMouseDownMove(e, item)}
                                                >
                                                    {/* Card Content Top */}
                                                    <div className="min-w-0">
                                                        <div className="flex items-start justify-between gap-1">
                                                            <span className="font-bold leading-tight line-clamp-2">
                                                                {item.title}
                                                            </span>
                                                            <div className="hidden group-hover/card:flex items-center gap-0.5 shrink-0 bg-black/30 rounded p-0.5 backdrop-blur-xs">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenEdit(item);
                                                                    }}
                                                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeletingItem(item);
                                                                    }}
                                                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Details if room permits */}
                                                        {item.subject && (
                                                            <div className="mt-1 space-y-0.5 text-[11px] opacity-90">
                                                                {item.subject.place && (
                                                                    <div className="flex items-center gap-1 truncate">
                                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                                        <span>{item.subject.place}</span>
                                                                    </div>
                                                                )}
                                                                {item.subject.lecturer && (
                                                                    <div className="flex items-center gap-1 truncate">
                                                                        <User className="h-3 w-3 shrink-0" />
                                                                        <span>{item.subject.lecturer}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card Time Footer */}
                                                    <div className="flex items-center justify-between text-[10px] font-medium opacity-85 mt-1">
                                                        <span>
                                                            {item.start_time} - {item.end_time}
                                                        </span>
                                                        <GripVertical className="h-3 w-3 opacity-40 group-hover/card:opacity-100" />
                                                    </div>

                                                    {/* Bottom Resize Handle */}
                                                    <div
                                                        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize bg-black/10 hover:bg-black/30 transition-colors"
                                                        title="Tarik untuk memperpanjang durasi waktu"
                                                        onMouseDown={(e) => handleMouseDownResize(e, item)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Floating Bottom Bar when there are unsaved changes */}
                {hasUnsavedChanges && (
                    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-background/95 p-3.5 px-5 shadow-2xl backdrop-blur-md dark:bg-neutral-900/95 max-w-2xl w-full ring-1 ring-black/5 dark:ring-white/10">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="font-semibold text-foreground text-sm">
                                        Ada {modifiedItems.length} pergeseran posisi/jam jadwal belum disimpan
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                        Tekan simpan untuk menyimpan posisi & durasi hasil drag and drop ke database.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRevertChanges}
                                    disabled={isSavingChanges}
                                    className="h-9 gap-1.5"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Batalkan
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSaveAllChanges}
                                    disabled={isSavingChanges}
                                    className="h-9 gap-1.5 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 font-medium"
                                >
                                    <Save className="h-4 w-4" />
                                    {isSavingChanges ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Schedule Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Jadwal Pelajaran</DialogTitle>
                        <DialogDescription>
                            Pilih mata kuliah atau masukkan nama kegiatan manual.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        {/* Subject Selector or Custom */}
                        <div className="space-y-1.5">
                            <Label>Pilih Mata Kuliah (Opsional)</Label>
                            <Select
                                value={selectedSubjectId}
                                onValueChange={(val) => handleSubjectChange(val, false)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih mata kuliah atau manual" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custom">-- Input Manual / Non-Mata Kuliah --</SelectItem>
                                    {subjects.map((sub) => (
                                        <SelectItem key={sub.id} value={String(sub.id)}>
                                            {sub.title} ({sub.credit} SKS)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create-title">Judul Jadwal *</Label>
                            <Input
                                id="create-title"
                                placeholder="Nama mata kuliah atau kegiatan (misal: Praktikum)"
                                value={createForm.data.title}
                                onChange={(e) => createForm.setData('title', e.target.value)}
                                required
                            />
                            {createForm.errors.title && (
                                <p className="text-xs text-destructive">{createForm.errors.title}</p>
                            )}
                        </div>

                        {/* Day & Time Inputs */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Hari *</Label>
                                <Select
                                    value={String(createForm.data.day)}
                                    onValueChange={(val) => createForm.setData('day', Number(val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map((d) => (
                                            <SelectItem key={d.value} value={String(d.value)}>
                                                {d.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-start">Mulai *</Label>
                                <Input
                                    id="create-start"
                                    type="time"
                                    value={createForm.data.start_time}
                                    onChange={(e) => createForm.setData('start_time', e.target.value)}
                                    required
                                />
                                {createForm.errors.start_time && (
                                    <p className="text-xs text-destructive">{createForm.errors.start_time}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-end">Selesai *</Label>
                                <Input
                                    id="create-end"
                                    type="time"
                                    value={createForm.data.end_time}
                                    onChange={(e) => createForm.setData('end_time', e.target.value)}
                                    required
                                />
                                {createForm.errors.end_time && (
                                    <p className="text-xs text-destructive">{createForm.errors.end_time}</p>
                                )}
                            </div>
                        </div>

                        {/* Color and BG Color Customization */}
                        <div className="space-y-2">
                            <Label>Warna Kartu</Label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {PRESET_COLORS.map((preset) => (
                                    <button
                                        key={preset.bg}
                                        type="button"
                                        onClick={() => {
                                            createForm.setData((prev) => ({
                                                ...prev,
                                                bg_color: preset.bg,
                                                color: preset.text,
                                            }));
                                        }}
                                        style={{ backgroundColor: preset.bg }}
                                        className={`h-7 w-7 rounded-full border-2 transition-all ${
                                            createForm.data.bg_color === preset.bg
                                                ? 'border-primary ring-2 ring-primary/40 scale-110'
                                                : 'border-transparent hover:scale-105'
                                        }`}
                                        title={preset.label}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1">
                                    <Label htmlFor="create-bg" className="text-xs text-muted-foreground">
                                        Warna Background Custom
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="create-bg"
                                            type="color"
                                            value={createForm.data.bg_color}
                                            onChange={(e) => createForm.setData('bg_color', e.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded border bg-transparent p-0"
                                        />
                                        <Input
                                            value={createForm.data.bg_color}
                                            onChange={(e) => createForm.setData('bg_color', e.target.value)}
                                            className="h-8 uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="create-color" className="text-xs text-muted-foreground">
                                        Warna Teks Custom
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="create-color"
                                            type="color"
                                            value={createForm.data.color}
                                            onChange={(e) => createForm.setData('color', e.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded border bg-transparent p-0"
                                        />
                                        <Input
                                            value={createForm.data.color}
                                            onChange={(e) => createForm.setData('color', e.target.value)}
                                            className="h-8 uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="rounded-lg border p-3 bg-muted/20">
                            <span className="text-xs font-medium text-muted-foreground block mb-2">
                                Pratinjau Tampilan Kartu:
                            </span>
                            <div
                                style={{
                                    backgroundColor: createForm.data.bg_color,
                                    color: createForm.data.color,
                                }}
                                className="rounded-lg p-2.5 text-xs font-semibold shadow-sm"
                            >
                                <div className="text-sm font-bold">
                                    {createForm.data.title || 'Judul Jadwal'}
                                </div>
                                <div className="text-[11px] opacity-90 mt-1">
                                    {createForm.data.start_time} - {createForm.data.end_time}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'Menyimpan...' : 'Simpan Jadwal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Schedule Modal */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Jadwal Pelajaran</DialogTitle>
                        <DialogDescription>
                            Perbarui waktu, hari, warna, atau mata kuliah.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        {/* Subject Selector or Custom */}
                        <div className="space-y-1.5">
                            <Label>Pilih Mata Kuliah (Opsional)</Label>
                            <Select
                                value={selectedSubjectId}
                                onValueChange={(val) => handleSubjectChange(val, true)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih mata kuliah atau manual" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custom">-- Input Manual / Non-Mata Kuliah --</SelectItem>
                                    {subjects.map((sub) => (
                                        <SelectItem key={sub.id} value={String(sub.id)}>
                                            {sub.title} ({sub.credit} SKS)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-title">Judul Jadwal *</Label>
                            <Input
                                id="edit-title"
                                value={editForm.data.title}
                                onChange={(e) => editForm.setData('title', e.target.value)}
                                required
                            />
                            {editForm.errors.title && (
                                <p className="text-xs text-destructive">{editForm.errors.title}</p>
                            )}
                        </div>

                        {/* Day & Time Inputs */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Hari *</Label>
                                <Select
                                    value={String(editForm.data.day)}
                                    onValueChange={(val) => editForm.setData('day', Number(val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map((d) => (
                                            <SelectItem key={d.value} value={String(d.value)}>
                                                {d.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-start">Mulai *</Label>
                                <Input
                                    id="edit-start"
                                    type="time"
                                    value={editForm.data.start_time}
                                    onChange={(e) => editForm.setData('start_time', e.target.value)}
                                    required
                                />
                                {editForm.errors.start_time && (
                                    <p className="text-xs text-destructive">{editForm.errors.start_time}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-end">Selesai *</Label>
                                <Input
                                    id="edit-end"
                                    type="time"
                                    value={editForm.data.end_time}
                                    onChange={(e) => editForm.setData('end_time', e.target.value)}
                                    required
                                />
                                {editForm.errors.end_time && (
                                    <p className="text-xs text-destructive">{editForm.errors.end_time}</p>
                                )}
                            </div>
                        </div>

                        {/* Color and BG Color Customization */}
                        <div className="space-y-2">
                            <Label>Warna Kartu</Label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {PRESET_COLORS.map((preset) => (
                                    <button
                                        key={preset.bg}
                                        type="button"
                                        onClick={() => {
                                            editForm.setData((prev) => ({
                                                ...prev,
                                                bg_color: preset.bg,
                                                color: preset.text,
                                            }));
                                        }}
                                        style={{ backgroundColor: preset.bg }}
                                        className={`h-7 w-7 rounded-full border-2 transition-all ${
                                            editForm.data.bg_color === preset.bg
                                                ? 'border-primary ring-2 ring-primary/40 scale-110'
                                                : 'border-transparent hover:scale-105'
                                        }`}
                                        title={preset.label}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1">
                                    <Label htmlFor="edit-bg" className="text-xs text-muted-foreground">
                                        Warna Background Custom
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="edit-bg"
                                            type="color"
                                            value={editForm.data.bg_color}
                                            onChange={(e) => editForm.setData('bg_color', e.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded border bg-transparent p-0"
                                        />
                                        <Input
                                            value={editForm.data.bg_color}
                                            onChange={(e) => editForm.setData('bg_color', e.target.value)}
                                            className="h-8 uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="edit-color" className="text-xs text-muted-foreground">
                                        Warna Teks Custom
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="edit-color"
                                            type="color"
                                            value={editForm.data.color}
                                            onChange={(e) => editForm.setData('color', e.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded border bg-transparent p-0"
                                        />
                                        <Input
                                            value={editForm.data.color}
                                            onChange={(e) => editForm.setData('color', e.target.value)}
                                            className="h-8 uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="rounded-lg border p-3 bg-muted/20">
                            <span className="text-xs font-medium text-muted-foreground block mb-2">
                                Pratinjau Tampilan Kartu:
                            </span>
                            <div
                                style={{
                                    backgroundColor: editForm.data.bg_color,
                                    color: editForm.data.color,
                                }}
                                className="rounded-lg p-2.5 text-xs font-semibold shadow-sm"
                            >
                                <div className="text-sm font-bold">
                                    {editForm.data.title || 'Judul Jadwal'}
                                </div>
                                <div className="text-[11px] opacity-90 mt-1">
                                    {editForm.data.start_time} - {editForm.data.end_time}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingItem(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Menyimpan...' : 'Perbarui Jadwal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Schedule Modal */}
            <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Jadwal</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus jadwal <strong>{deletingItem?.title}</strong>?
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDeleteSubmit}>
                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeletingItem(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={deleteForm.processing}
                            >
                                {deleteForm.processing ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

TimetableIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Jadwal Pelajaran',
            href: props.currentTeam ? `/${props.currentTeam.slug}/timetable` : '#',
        },
    ],
});

