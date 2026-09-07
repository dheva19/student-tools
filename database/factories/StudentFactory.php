<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'student_id' => fake()->unique()->numerify('##########'),
            'university' => 'Universitas Indonesia',
            'study_program' => 'Teknik Informatika',
            'phone_number' => '081234567890',
            'gender' => 'male',
            'pob' => 'Jakarta',
            'dob' => '2002-05-15',
        ];
    }
}
