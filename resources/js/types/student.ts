export type Student = {
    id: number;
    user_id: number;
    student_id: string; // NIM
    university: string;
    study_program: string;
    phone_number: string;
    gender: 'male' | 'female' | 'other' | string;
    pob: string;
    dob: string;
    created_at: string;
    updated_at: string;
};
