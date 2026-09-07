import type { Subject } from './subject';

export type Timetable = {
    id: number;
    team_id: number;
    subject_id?: number | null;
    title: string;
    day: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    start_time: string; // "HH:MM"
    end_time: string; // "HH:MM"
    color: string; // text color hex
    bg_color: string; // bg color hex
    subject?: Subject | null;
    created_at: string;
    updated_at: string;
};
