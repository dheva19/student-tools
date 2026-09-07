import { Head, useForm } from '@inertiajs/react';
import { BookOpen, Edit2, GraduationCap, MapPin, Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { destroy, store, update } from '@/routes/subjects';
import type { BreadcrumbItem, Subject, Team } from '@/types';

type Props = {
    subjects: Subject[];
    currentTeam: Team;
};

export default function SubjectsIndex({ subjects = [], currentTeam }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

    // Create form
    const createForm = useForm({
        title: '',
        place: '',
        lecturer: '',
        credit: 3,
        note: '',
    });

    // Edit form
    const editForm = useForm({
        title: '',
        place: '',
        lecturer: '',
        credit: 3,
        note: '',
    });

    // Delete form
    const deleteForm = useForm({});

    const handleOpenCreate = () => {
        createForm.reset();
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

    const handleOpenEdit = (subject: Subject) => {
        setEditingSubject(subject);
        editForm.setData({
            title: subject.title,
            place: subject.place || '',
            lecturer: subject.lecturer || '',
            credit: subject.credit,
            note: subject.note || '',
        });
        editForm.clearErrors();
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubject) return;
        editForm.put(update.url([currentTeam.slug, editingSubject.id]), {
            onSuccess: () => {
                setEditingSubject(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingSubject) return;
        deleteForm.delete(destroy.url([currentTeam.slug, deletingSubject.id]), {
            onSuccess: () => {
                setDeletingSubject(null);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Mata Kuliah',
            href: '#',
        },
    ];

    return (
        <>
            <Head title="Mata Kuliah" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daftar Mata Kuliah</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola daftar mata kuliah, dosen pengampu, SKS, dan ruang kelas.
                        </p>
                    </div>
                    <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Mata Kuliah
                    </Button>
                </div>

                {/* Cards Grid */}
                {subjects.length === 0 ? (
                    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <BookOpen className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">Belum ada mata kuliah</h3>
                        <p className="mb-4 mt-2 max-w-sm text-sm text-muted-foreground">
                            Mata kuliah yang Anda tambahkan dapat digunakan untuk menyusun jadwal pelajaran (timetable).
                        </p>
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Mata Kuliah Pertama
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {subjects.map((subject) => (
                            <Card key={subject.id} className="flex flex-col justify-between transition-all hover:shadow-md">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg font-semibold leading-tight line-clamp-1">
                                            {subject.title}
                                        </CardTitle>
                                        <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                            {subject.credit} SKS
                                        </span>
                                    </div>
                                    <CardDescription className="flex items-center gap-1.5 text-xs">
                                        <GraduationCap className="h-3.5 w-3.5" />
                                        {subject.timetables_count ?? 0} Sesi Jadwal
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-2.5 text-sm">
                                    {subject.lecturer && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <User className="h-4 w-4 shrink-0 text-foreground/70" />
                                            <span className="truncate">{subject.lecturer}</span>
                                        </div>
                                    )}

                                    {subject.place && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4 shrink-0 text-foreground/70" />
                                            <span className="truncate">{subject.place}</span>
                                        </div>
                                    )}

                                    {subject.note && (
                                        <div className="mt-2 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground line-clamp-3">
                                            {subject.note}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="flex items-center justify-end gap-2 border-t pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5"
                                        onClick={() => handleOpenEdit(subject)}
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8 gap-1.5"
                                        onClick={() => setDeletingSubject(subject)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Hapus
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Mata Kuliah</DialogTitle>
                        <DialogDescription>
                            Masukkan rincian mata kuliah baru untuk tim/jadwal ini.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-title">Nama Mata Kuliah *</Label>
                            <Input
                                id="create-title"
                                placeholder="Contoh: Pemrograman Web Lanjut"
                                value={createForm.data.title}
                                onChange={(e) => createForm.setData('title', e.target.value)}
                                required
                            />
                            {createForm.errors.title && (
                                <p className="text-xs text-destructive">{createForm.errors.title}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-credit">Jumlah SKS *</Label>
                                <Input
                                    id="create-credit"
                                    type="number"
                                    min={0}
                                    max={20}
                                    value={createForm.data.credit}
                                    onChange={(e) => createForm.setData('credit', parseInt(e.target.value) || 0)}
                                    required
                                />
                                {createForm.errors.credit && (
                                    <p className="text-xs text-destructive">{createForm.errors.credit}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-place">Ruangan / Tempat</Label>
                                <Input
                                    id="create-place"
                                    placeholder="Contoh: Lab Komputer 2"
                                    value={createForm.data.place}
                                    onChange={(e) => createForm.setData('place', e.target.value)}
                                />
                                {createForm.errors.place && (
                                    <p className="text-xs text-destructive">{createForm.errors.place}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-lecturer">Dosen Pengampu</Label>
                            <Input
                                id="create-lecturer"
                                placeholder="Contoh: Dr. Budi Santoso, M.Kom"
                                value={createForm.data.lecturer}
                                onChange={(e) => createForm.setData('lecturer', e.target.value)}
                            />
                            {createForm.errors.lecturer && (
                                <p className="text-xs text-destructive">{createForm.errors.lecturer}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-note">Catatan Tambahan</Label>
                            <Textarea
                                id="create-note"
                                placeholder="Catatan tugas, link RPS, info grup dsb..."
                                value={createForm.data.note}
                                onChange={(e) => createForm.setData('note', e.target.value)}
                                rows={3}
                            />
                            {createForm.errors.note && (
                                <p className="text-xs text-destructive">{createForm.errors.note}</p>
                            )}
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
                                {createForm.processing ? 'Menyimpan...' : 'Simpan Mata Kuliah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Mata Kuliah</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi mata kuliah.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-title">Nama Mata Kuliah *</Label>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-credit">Jumlah SKS *</Label>
                                <Input
                                    id="edit-credit"
                                    type="number"
                                    min={0}
                                    max={20}
                                    value={editForm.data.credit}
                                    onChange={(e) => editForm.setData('credit', parseInt(e.target.value) || 0)}
                                    required
                                />
                                {editForm.errors.credit && (
                                    <p className="text-xs text-destructive">{editForm.errors.credit}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-place">Ruangan / Tempat</Label>
                                <Input
                                    id="edit-place"
                                    value={editForm.data.place}
                                    onChange={(e) => editForm.setData('place', e.target.value)}
                                />
                                {editForm.errors.place && (
                                    <p className="text-xs text-destructive">{editForm.errors.place}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-lecturer">Dosen Pengampu</Label>
                            <Input
                                id="edit-lecturer"
                                value={editForm.data.lecturer}
                                onChange={(e) => editForm.setData('lecturer', e.target.value)}
                            />
                            {editForm.errors.lecturer && (
                                <p className="text-xs text-destructive">{editForm.errors.lecturer}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-note">Catatan Tambahan</Label>
                            <Textarea
                                id="edit-note"
                                value={editForm.data.note}
                                onChange={(e) => editForm.setData('note', e.target.value)}
                                rows={3}
                            />
                            {editForm.errors.note && (
                                <p className="text-xs text-destructive">{editForm.errors.note}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingSubject(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Menyimpan...' : 'Perbarui Mata Kuliah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deletingSubject} onOpenChange={(open) => !open && setDeletingSubject(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Mata Kuliah</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus mata kuliah{' '}
                            <strong>{deletingSubject?.title}</strong>? Sesi jadwal yang terkait dengan mata kuliah ini akan tetap ada namun mata kuliahnya dikosongkan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDeleteSubmit}>
                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeletingSubject(null)}
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

SubjectsIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Mata Kuliah',
            href: props.currentTeam ? `/${props.currentTeam.slug}/subjects` : '#',
        },
    ],
});

