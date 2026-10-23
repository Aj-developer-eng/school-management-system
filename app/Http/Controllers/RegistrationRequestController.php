<?php

namespace App\Http\Controllers;

use App\Models\RegistrationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistrationRequestController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/RegistrationRequests/Index', [
            'requests' => RegistrationRequest::latest()->get(),
        ]);
    }

    public function approve(RegistrationRequest $registrationRequest)
    {
        $registrationRequest->update(['status' => 'approved']);
        return back()->with('success', 'Registration approved.');
    }

    public function reject(RegistrationRequest $registrationRequest)
    {
        $registrationRequest->update(['status' => 'rejected']);
        return back()->with('success', 'Registration rejected.');
    }
}
