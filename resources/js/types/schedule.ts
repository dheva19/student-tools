export type Schedule = {
    id: number;
    team_id: number;
    title: string;
    description?: string | null;
    date: string; // "YYYY-MM-DD"
    color: string;
    bg_color: string;
    created_at: string;
    updated_at: string;
};
