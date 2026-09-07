<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\Timetable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    /**
     * Display the timetable schedule board.
     */
    public function index(Request $request, Team $current_team): Response
    {
        $timetables = $current_team->timetables()
            ->with('subject')
            ->orderBy('day')
            ->orderBy('start_time')
            ->get();

        $subjects = $current_team->subjects()
            ->orderBy('title')
            ->get();

        return Inertia::render('timetables/index', [
            'timetables' => $timetables,
            'subjects' => $subjects,
        ]);
    }

    /**
     * Store a newly created timetable entry.
     */
    public function store(Request $request, Team $current_team): RedirectResponse
    {
        $validated = $request->validate([
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'title' => ['required', 'string', 'max:255'],
            'day' => ['required', 'integer', 'between:0,6'],
            'start_time' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'end_time' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/', 'after:start_time'],
            'color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'bg_color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
        ]);

        if (!empty($validated['subject_id'])) {
            $subject = $current_team->subjects()->find($validated['subject_id']);
            abort_if(!$subject, 404);
            $validated['title'] = $subject->title;
        }

        $current_team->timetables()->create($validated);

        return back()->with('success', 'Jadwal berhasil ditambahkan.');
    }

    /**
     * Batch update multiple timetable entries.
     */
    public function batchUpdate(Request $request, Team $current_team): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:timetables,id'],
            'items.*.day' => ['required', 'integer', 'between:0,6'],
            'items.*.start_time' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'items.*.end_time' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/', 'after:items.*.start_time'],
            'items.*.title' => ['sometimes', 'string', 'max:255'],
            'items.*.subject_id' => ['nullable', 'exists:subjects,id'],
            'items.*.color' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'items.*.bg_color' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
        ]);

        foreach ($validated['items'] as $itemData) {
            $timetable = $current_team->timetables()->find($itemData['id']);
            if ($timetable) {
                $updateFields = [
                    'day' => $itemData['day'],
                    'start_time' => $itemData['start_time'],
                    'end_time' => $itemData['end_time'],
                ];
                if (isset($itemData['title'])) {
                    $updateFields['title'] = $itemData['title'];
                }
                if (array_key_exists('subject_id', $itemData)) {
                    $updateFields['subject_id'] = $itemData['subject_id'];
                }
                if (isset($itemData['color'])) {
                    $updateFields['color'] = $itemData['color'];
                }
                if (isset($itemData['bg_color'])) {
                    $updateFields['bg_color'] = $itemData['bg_color'];
                }
                $timetable->update($updateFields);
            }
        }

        return back()->with('success', 'Semua perubahan jadwal berhasil disimpan.');
    }

    /**
     * Update the specified timetable entry in storage.
     */
    public function update(Request $request, Team $current_team, Timetable $timetable): RedirectResponse
    {
        abort_if($timetable->team_id !== $current_team->id, 403);

        $validated = $request->validate([
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'title' => ['required', 'string', 'max:255'],
            'day' => ['required', 'integer', 'between:0,6'],
            'start_time' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'end_time' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/', 'after:start_time'],
            'color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'bg_color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
        ]);

        if (!empty($validated['subject_id'])) {
            $subject = $current_team->subjects()->find($validated['subject_id']);
            abort_if(!$subject, 404);
            $validated['title'] = $subject->title;
        }

        $timetable->update($validated);

        return back()->with('success', 'Jadwal berhasil diperbarui.');
    }

    /**
     * Remove the specified timetable entry.
     */
    public function destroy(Request $request, Team $current_team, Timetable $timetable): RedirectResponse
    {
        abort_if($timetable->team_id !== $current_team->id, 403);

        $timetable->delete();

        return back()->with('success', 'Jadwal berhasil dihapus.');
    }
}
