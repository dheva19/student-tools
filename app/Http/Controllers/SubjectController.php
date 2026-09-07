<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    /**
     * Display a listing of subjects.
     */
    public function index(Request $request, Team $current_team): Response
    {
        $subjects = $current_team->subjects()
            ->withCount('timetables')
            ->latest()
            ->get();

        return Inertia::render('subjects/index', [
            'subjects' => $subjects,
        ]);
    }

    /**
     * Store a newly created subject in storage.
     */
    public function store(Request $request, Team $current_team): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'place' => ['nullable', 'string', 'max:255'],
            'lecturer' => ['nullable', 'string', 'max:255'],
            'credit' => ['required', 'integer', 'min:0', 'max:20'],
            'note' => ['nullable', 'string'],
        ]);

        $current_team->subjects()->create($validated);

        return back()->with('success', 'Mata kuliah berhasil ditambahkan.');
    }

    /**
     * Update the specified subject in storage.
     */
    public function update(Request $request, Team $current_team, Subject $subject): RedirectResponse
    {
        abort_if($subject->team_id !== $current_team->id, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'place' => ['nullable', 'string', 'max:255'],
            'lecturer' => ['nullable', 'string', 'max:255'],
            'credit' => ['required', 'integer', 'min:0', 'max:20'],
            'note' => ['nullable', 'string'],
        ]);

        $subject->update($validated);

        return back()->with('success', 'Mata kuliah berhasil diperbarui.');
    }

    /**
     * Remove the specified subject from storage.
     */
    public function destroy(Request $request, Team $current_team, Subject $subject): RedirectResponse
    {
        abort_if($subject->team_id !== $current_team->id, 403);

        $subject->delete();

        return back()->with('success', 'Mata kuliah berhasil dihapus.');
    }
}

