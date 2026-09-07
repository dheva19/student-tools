<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('timetables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->unsignedTinyInteger('day'); // 0-6 (0: Sunday/Minggu, 1: Monday/Senin, ..., 6: Saturday/Sabtu)
            $table->string('start_time', 5); // e.g. "08:00"
            $table->string('end_time', 5); // e.g. "10:30"
            $table->string('color')->default('#ffffff'); // Text color
            $table->string('bg_color')->default('#3b82f6'); // Background color
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timetables');
    }
};
