<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\StudentController;
use App\Http\Middleware\EnsureHasStudentProfile;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('student/register', [StudentController::class, 'create'])->name('student.create');
    Route::post('student/register', [StudentController::class, 'store'])->name('student.store');
});

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class, EnsureHasStudentProfile::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        // Timetable / Jadwal
        Route::get('timetable', [App\Http\Controllers\TimetableController::class, 'index'])->name('timetable.index');
        Route::post('timetable', [App\Http\Controllers\TimetableController::class, 'store'])->name('timetable.store');
        Route::post('timetable/batch-update', [App\Http\Controllers\TimetableController::class, 'batchUpdate'])->name('timetable.batch-update');
        Route::put('timetable/{timetable}', [App\Http\Controllers\TimetableController::class, 'update'])->name('timetable.update');
        Route::delete('timetable/{timetable}', [App\Http\Controllers\TimetableController::class, 'destroy'])->name('timetable.destroy');

        // Subjects / Mata Kuliah
        Route::get('subjects', [App\Http\Controllers\SubjectController::class, 'index'])->name('subjects.index');
        Route::post('subjects', [App\Http\Controllers\SubjectController::class, 'store'])->name('subjects.store');
        Route::put('subjects/{subject}', [App\Http\Controllers\SubjectController::class, 'update'])->name('subjects.update');
        Route::delete('subjects/{subject}', [App\Http\Controllers\SubjectController::class, 'destroy'])->name('subjects.destroy');

        // Calendar / Schedule (Agenda & Event)
        Route::get('calendar', [App\Http\Controllers\ScheduleController::class, 'index'])->name('calendar.index');
        Route::post('calendar', [App\Http\Controllers\ScheduleController::class, 'store'])->name('calendar.store');
        Route::put('calendar/{schedule}', [App\Http\Controllers\ScheduleController::class, 'update'])->name('calendar.update');
        Route::delete('calendar/{schedule}', [App\Http\Controllers\ScheduleController::class, 'destroy'])->name('calendar.destroy');
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
