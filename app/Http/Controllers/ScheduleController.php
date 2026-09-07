<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    /**
     * Display the calendar and events schedule.
     */
    public function index(Request $request, Team $current_team): Response
    {
        // Month and year can be filtered or default to current
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);

        // Fetch all schedules for this team in the specified month (plus margin for overlapping calendar days)
        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth()->subDays(7);
        $endOfMonth = Carbon::createFromDate($year, $month, 1)->endOfMonth()->addDays(7);

        $schedules = $current_team->schedules()
            ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->orderBy('date')
            ->orderBy('created_at')
            ->get();

        return Inertia::render('calendar/index', [
            'schedules' => $schedules,
            'currentYear' => $year,
            'currentMonth' => $month,
        ]);
    }

    /**
     * Store a newly created schedule/event in storage.
     */
    public function store(Request $request, Team $current_team): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'date' => ['required', 'date'],
            'color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'bg_color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
        ]);

        $current_team->schedules()->create($validated);

        return back()->with('success', 'Agenda jadwal berhasil ditambahkan.');
    }

    /**
     * Update the specified schedule entry in storage.
     */
    public function update(Request $request, Team $current_team, Schedule $schedule): RedirectResponse
    {
        abort_if($schedule->team_id !== $current_team->id, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'date' => ['required', 'date'],
            'color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'bg_color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
        ]);

        $schedule->update($validated);

        return back()->with('success', 'Agenda jadwal berhasil diperbarui.');
    }

    /**
     * Remove the specified schedule entry from storage.
     */
    public function destroy(Request $request, Team $current_team, Schedule $schedule): RedirectResponse
    {
        abort_if($schedule->team_id !== $current_team->id, 403);

        $schedule->delete();

        return back()->with('success', 'Agenda jadwal berhasil dihapus.');
    }
}

