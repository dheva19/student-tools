import { Head, router, usePage } from '@inertiajs/react';
import React, { useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/student';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
    errors: Record<string, string>;
};

export default function RegisterStudent() {
    const { auth, errors: pageErrors } = usePage<PageProps>().props;
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [gender, setGender] = useState('male');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(auth.user?.avatar || null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set('gender', gender);

        router.post(store.url(), formData, {
            forceFormData: true,
            onError: (errs) => {
                setErrors(errs);
                setSubmitting(false);
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    };

    const mergedErrors = { ...pageErrors, ...errors };

    return (
        <>
            <Head title="Registrasi Data Mahasiswa" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-3">
                    <Avatar className="size-20 border shadow-sm">
                        {avatarPreview ? (
                            <AvatarImage src={avatarPreview} alt="Preview Foto Profil" />
                        ) : null}
                        <AvatarFallback className="text-lg font-semibold uppercase">
                            {auth.user?.name ? auth.user.name.charAt(0) : 'M'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Upload Foto Profil
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            id="avatar"
                            name="avatar"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        <span className="text-muted-foreground mt-1 text-xs">
                            Format JPG, PNG, atau WEBP (Maks. 2MB). Opsional.
                        </span>
                        <InputError message={mergedErrors.avatar} className="mt-1" />
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            defaultValue={auth.user?.name || ''}
                            placeholder="cth: Ahmad Fauzi"
                        />
                        <InputError message={mergedErrors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="student_id">Nomor Induk Mahasiswa (NIM)</Label>
                        <Input
                            id="student_id"
                            name="student_id"
                            type="text"
                            required
                            placeholder="cth: 220101004"
                        />
                        <InputError message={mergedErrors.student_id} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="university">Perguruan Tinggi / Kampus</Label>
                            <Input
                                id="university"
                                name="university"
                                type="text"
                                required
                                placeholder="cth: Universitas Indonesia"
                            />
                            <InputError message={mergedErrors.university} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="study_program">Program Studi / Jurusan</Label>
                            <Input
                                id="study_program"
                                name="study_program"
                                type="text"
                                required
                                placeholder="cth: Sistem Informasi"
                            />
                            <InputError message={mergedErrors.study_program} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="phone_number">Nomor WhatsApp / HP</Label>
                            <Input
                                id="phone_number"
                                name="phone_number"
                                type="tel"
                                required
                                placeholder="cth: 081234567890"
                            />
                            <InputError message={mergedErrors.phone_number} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="gender">Jenis Kelamin</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger id="gender" className="w-full">
                                    <SelectValue placeholder="Pilih Jenis Kelamin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Laki-laki</SelectItem>
                                    <SelectItem value="female">Perempuan</SelectItem>
                                    <SelectItem value="other">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={mergedErrors.gender} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="pob">Tempat Lahir</Label>
                            <Input
                                id="pob"
                                name="pob"
                                type="text"
                                required
                                placeholder="cth: Jakarta"
                            />
                            <InputError message={mergedErrors.pob} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dob">Tanggal Lahir</Label>
                            <Input
                                id="dob"
                                name="dob"
                                type="date"
                                required
                            />
                            <InputError message={mergedErrors.dob} />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        disabled={submitting}
                    >
                        {submitting && <Spinner className="mr-2" />}
                        Simpan Data Mahasiswa
                    </Button>
                </div>
            </form>
        </>
    );
}

RegisterStudent.layout = {
    title: 'Lengkapi Data Mahasiswa',
    description: 'Silakan isi data diri mahasiswa Anda untuk mulai menggunakan fitur perkuliahan.',
};
