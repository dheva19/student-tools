export type Subject = {
    id: number;
    team_id: number;
    title: string;
    place?: string | null;
    lecturer?: string | null;
    credit: number;
    note?: string | null;
    timetables_count?: number;
    created_at: string;
    updated_at: string;
};
