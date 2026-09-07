import { Head, router, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import React, { useRef, useState } from 'react';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
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
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { edit, update } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
    errors: Record<string, string>;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth, errors: pageErrors } = usePage<PageProps>().props;
    const student = auth.user?.student;

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [gender, setGender] = useState(student?.gender || 'male');
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
        formData.set('_method', 'PATCH');
        if (student) {
            formData.set('gender', gender);
        }

        router.post(update.url(), formData, {
            forceFormData: true,
            preserveScroll: true,
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
    const formattedDob = student?.dob ? student.dob.substring(0, 10) : '';

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile & Data Mahasiswa"
                    description="Perbarui identitas profil, akun, dan data akademik perkuliahan Anda"
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Foto Profil Avatar */}
                    <div className="flex items-center gap-4">
                        <Avatar className="size-16 border shadow-sm">
                            {avatarPreview ? (
                                <AvatarImage src={avatarPreview} alt={auth.user.name} />
                            ) : null}
                            <AvatarFallback className="text-base font-semibold uppercase">
                                {auth.user.name ? auth.user.name.charAt(0) : 'U'}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Ganti Foto
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
                            <p className="text-muted-foreground mt-1 text-xs">
                                JPG, PNG, atau WEBP (maks 2MB).
                            </p>
                            <InputError message={mergedErrors.avatar} className="mt-1" />
                        </div>
                    </div>

                    {/* Informasi Akun Dasar */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                            id="name"
                            className="mt-1 block w-full"
                            defaultValue={auth.user.name}
                            name="name"
                            required
                            autoComplete="name"
                            placeholder="Nama Lengkap"
                        />
                        <InputError message={mergedErrors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            defaultValue={auth.user.email}
                            name="email"
                            required
                            autoComplete="username"
                            placeholder="Email address"
                        />
                        <InputError message={mergedErrors.email} />
                    </div>

                    {mustVerifyEmail && auth.user.email_verified_at === null && (
                        <div>
                            <p className="text-muted-foreground -mt-2 text-sm">
                                Your email address is unverified.{' '}
                                <Link
                                    href={send()}
                                    as="button"
                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                >
                                    Click here to re-send the verification email.
                                </Link>
                            </p>

                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600">
                                    A new verification link has been sent to your email address.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Data Mahasiswa (Jika user sudah memiliki data student) */}
                    {student && (
                        <>
                            <Separator className="my-6" />

                            <Heading
                                variant="small"
                                title="Informasi Akademik"
                                description="Data nomor mahasiswa dan perguruan tinggi"
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="student_id">Nomor Induk Mahasiswa (NIM)</Label>
                                <Input
                                    id="student_id"
                                    name="student_id"
                                    type="text"
                                    required
                                    defaultValue={student.student_id}
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
                                        defaultValue={student.university}
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
                                        defaultValue={student.study_program}
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
                                        defaultValue={student.phone_number}
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
                                        defaultValue={student.pob}
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
                                        defaultValue={formattedDob}
                                    />
                                    <InputError message={mergedErrors.dob} />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            type="submit"
                            disabled={submitting}
                            data-test="update-profile-button"
                        >
                            {submitting && <Spinner className="mr-2" />}
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
