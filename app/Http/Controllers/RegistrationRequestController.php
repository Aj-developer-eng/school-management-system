<?php

namespace App\Http\Controllers;

use App\Models\RegistrationRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistrationRequestController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/RegistrationRequests/Index', [
            'requests' => RegistrationRequest::with('assignedUser')->latest()->get(),
            'users' => User::whereDoesntHave('roles', fn ($q) => $q->whereIn('name', ['Student', 'Parent']))->get(['id','name']),
        ]);
    }

    public function approve(RegistrationRequest $registrationRequest)
    {
        $registrationRequest->update(['status' => 'approved']);
        return back()->with('success', 'Registration approved.');
    }

    public function assign(Request $request, RegistrationRequest $registrationRequest)
    {
        $data = $request->validate(['assigned_user_id' => 'nullable|exists:users,id']);
        $registrationRequest->update($data);
        return back()->with('success', 'Assigned.');
    }
    public function reject(RegistrationRequest $registrationRequest)
    {
        $registrationRequest->update(['status' => 'rejected']);
        return back()->with('success', 'Registration rejected.');
    }
}
