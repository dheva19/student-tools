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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('title'); // keterangan / judul
            $table->text('description')->nullable(); // deskripsi opsional
            $table->date('date'); // tanggal acara / penting
            $table->string('color')->default('#ffffff'); // warna teks
            $table->string('bg_color')->default('#3b82f6'); // warna background
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
