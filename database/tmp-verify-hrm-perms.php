<?php

// Temporary: verify HRM permissions/policy. Safe to delete.
require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

app(Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

$teacher = User::whereHas('roles', fn ($q) => $q->where('name', 'Teacher'))->first();
$accountant = User::whereHas('roles', fn ($q) => $q->where('name', 'Accountant'))->first();

// Debug why teacher has hrm.view
$t = User::whereHas('roles', fn ($q) => $q->where('name', 'Teacher'))->first();
app(Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
echo 'Teacher role permissions: '.json_encode($t->roles()->with('permissions')->get()->pluck('permissions.name')->flatten()->values())."\n";
echo 'direct hasPermissionTo: '.var_export($t->hasPermissionTo('hrm.view'), true)."\n";

// 1) Teacher (no hrm.view) -> 403
Auth::login($teacher);
echo 'Teacher can(hrm.view) = '.var_export($teacher->can('hrm.view'), true)."\n";
echo 'Teacher roles: '.$teacher->getRoleNames()->implode(', ')."\n";
$response = app(Illuminate\Contracts\Http\Kernel::class)->handle(Request::create('/hrm', 'GET'));
echo 'Teacher GET /hrm -> '.$response->getStatusCode()." (expect 403)\n";

// 2) Accountant (hrm.view + hrm.update) -> 200 + can manage
Auth::login($accountant);
echo 'Accountant can(hrm.view) = '.var_export($accountant->can('hrm.view'), true)."\n";
echo 'Accountant can(hrm.update) = '.var_export($accountant->can('hrm.update'), true)."\n";
$response = app(Illuminate\Contracts\Http\Kernel::class)->handle(Request::create('/hrm', 'GET'));
echo 'Accountant GET /hrm -> '.$response->getStatusCode()." (expect 200)\n";

// Accountant payroll update
$request = Request::create('/', 'POST', ['month' => now()->format('Y-m'), 'amount' => '5000', 'status' => 'unpaid']);
$request->setUserResolver(fn () => $accountant);
$resp = app(App\Http\Controllers\UserController::class)->updatePayroll($request, $teacher);
echo 'Accountant updatePayroll -> '.$resp->getStatusCode()." (expect 302, not 403)\n";

// Accountant CSV export (view permission)
$response = app(Illuminate\Contracts\Http\Kernel::class)->handle(Request::create('/hrm/payroll-export', 'GET'));
echo 'Accountant CSV export -> '.$response->getStatusCode()." (expect 200)\n";

// 3) Permissions exist in DB for /roles page
$perms = \Spatie\Permission\Models\Permission::whereIn('name', ['hrm.view', 'hrm.update'])->pluck('name');
echo 'DB permissions: '.$perms->implode(', ')."\n";
echo 'Accountant roles-perms: '.$accountant->getAllPermissions()->whereIn('name', ['hrm.view', 'hrm.update'])->keys()->implode(', ')."\n";
Auth::logout();
