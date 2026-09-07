<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    /**
     * Display the student registration form.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->student()->exists()) {
            if ($user->currentTeam) {
                return redirect()->route('dashboard', ['current_team' => $user->currentTeam->slug]);
            }

            return redirect()->route('home');
        }

        return Inertia::render('student/register');
    }

    /**
     * Store a newly created student profile in storage.
     */
    public function store(StoreStudentRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->student()->exists()) {
            if ($user->currentTeam) {
                return redirect()->route('dashboard', ['current_team' => $user->currentTeam->slug]);
            }

            return redirect()->route('home');
        }

        $validated = $request->validated();

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => Storage::url($path)]);
        }

        if ($request->filled('name')) {
            $user->update(['name' => $request->input('name')]);
        }

        unset($validated['avatar'], $validated['name']);

        $user->student()->create($validated);

        if ($user->currentTeam) {
            return redirect()->route('dashboard', ['current_team' => $user->currentTeam->slug])
                ->with('success', 'Student profile created successfully!');
        }

        return redirect()->route('home')->with('success', 'Student profile created successfully!');
    }
}
