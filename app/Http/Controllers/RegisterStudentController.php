<?php

namespace App\Http\Controllers;

use App\Models\RegistrationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegisterStudentController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/RegisterStudent');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'program' => 'nullable|string|max:255',
        ]);

        RegistrationRequest::create($data);

        return redirect()->route('landing')->with('success', 'Registration submitted for approval.');
    }
}
