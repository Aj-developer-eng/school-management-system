<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::orderBy('name')
            ->with('permissions:id,name')
            ->get();

        return Inertia::render('Role/Index', [
            'roles' => $roles,
            'permissions' => Permission::orderBy('name')->pluck('name'),
        ]);
    }

    public function update(Request $request, Role $role): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $role);

        $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->syncPermissions($request->input('permissions', []));

        ActivityLogService::custom('Roles & Permissions', 'updated', "Updated permissions for role: {$role->name}");

        return redirect()->route('roles.index')
            ->with('success', "Permissions for {$role->name} updated successfully.");
    }
}
