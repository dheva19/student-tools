<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = $this->profileRules($this->user()->id);

        $rules['avatar'] = ['nullable', 'image', 'max:2048'];

        $student = $this->user()->student;

        if ($student) {
            $rules['student_id'] = [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('students', 'student_id')->ignore($student->id),
            ];
            $rules['university'] = ['sometimes', 'required', 'string', 'max:255'];
            $rules['study_program'] = ['sometimes', 'required', 'string', 'max:255'];
            $rules['phone_number'] = ['sometimes', 'required', 'string', 'max:30'];
            $rules['gender'] = ['sometimes', 'required', 'string', 'in:male,female,other'];
            $rules['pob'] = ['sometimes', 'required', 'string', 'max:255'];
            $rules['dob'] = ['sometimes', 'required', 'date', 'before:today'];
        }

        return $rules;
    }
}
