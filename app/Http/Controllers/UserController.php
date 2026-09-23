<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Http\Requests\User\StoreRequest;
use App\Http\Requests\User\UpdateRequest;
use App\Models\HrmPayroll;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Roles that are managed by the HRM module.
     *
     * @return list<string>
     */
    private function hrmExcludedRoles(): array
    {
        return [
            RoleEnum::Student->value,
            RoleEnum::Parent->value,
            RoleEnum::SuperAdmin->value,
        ];
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()->with('roles:id,name');

        if ($request->search) {
            $query->where(function ($q) use ($request): void {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $users = $query->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('User/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * HRM view: staff users only (no students, parents, or super admins),
     * with per-month payroll status.
     */
    public function hrm(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $month = $this->resolvePayrollMonth($request);

        $query = User::query()
            ->with('roles:id,name')
            ->whereDoesntHave('roles', function ($q): void {
                $q->whereIn('name', $this->hrmExcludedRoles());
            });

        if ($request->search) {
            $query->where(function ($q) use ($request): void {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $users = $query->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Attach each staff member's payroll record for the selected month.
        $payrolls = HrmPayroll::whereDate('month', $month->toDateString())
            ->whereIn('user_id', $users->pluck('id'))
            ->get()
            ->keyBy('user_id');

        $users->getCollection()->transform(function (User $user) use ($payrolls) {
            $payroll = $payrolls->get($user->id);

            $user->payroll = [
                'id' => $payroll?->id,
                'amount' => $payroll?->amount ?? '0.00',
                'status' => $payroll?->status ?? 'unpaid',
                'paid_at' => $payroll?->paid_at?->toDateTimeString(),
                'notes' => $payroll?->notes,
            ];

            return $user;
        });

        $summary = HrmPayroll::whereDate('month', $month->toDateString())
            ->selectRaw("count(*) as records, sum(case when status = 'paid' then 1 else 0 end) as paid, coalesce(sum(amount), 0) as total, coalesce(sum(case when status = 'paid' then amount else 0 end), 0) as paid_amount")
            ->first();

        return Inertia::render('User/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
            'scope' => 'hrm',
            'payrollMonth' => $month->format('Y-m'),
            'payrollSummary' => [
                'staff' => $users->total(),
                'records' => (int) $summary->records,
                'paid' => (int) $summary->paid,
                'unpaid' => $users->total() - (int) $summary->paid,
                'total_amount' => (float) $summary->total,
                'paid_amount' => (float) $summary->paid_amount,
            ],
        ]);
    }

    /**
     * Create or update the payroll record for one staff member.
     */
    public function updatePayroll(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'status' => ['required', 'in:unpaid,paid'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $payroll = $this->findPayroll($user->id, $validated['month']);

        if ($payroll) {
            $payroll->update([
                'amount' => $validated['amount'] ?? 0,
                'status' => $validated['status'],
                'paid_at' => $validated['status'] === 'paid' ? now() : null,
                'notes' => $validated['notes'] ?? null,
            ]);
        } else {
            $payroll = HrmPayroll::create([
                'user_id' => $user->id,
                'month' => $validated['month'].'-01',
                'amount' => $validated['amount'] ?? 0,
                'status' => $validated['status'],
                'paid_at' => $validated['status'] === 'paid' ? now() : null,
                'notes' => $validated['notes'] ?? null,
            ]);
        }

        return back()->with('success', "Payroll updated for {$user->name} ({$validated['month']}).");
    }

    /**
     * Mark every unpaid staff member as paid for the selected month.
     */
    public function payAll(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $month = $this->resolvePayrollMonth($request);

        $staff = User::query()
            ->whereDoesntHave('roles', function ($q): void {
                $q->whereIn('name', $this->hrmExcludedRoles());
            })
            ->pluck('id');

        $created = 0;
        foreach ($staff as $userId) {
            $existing = $this->findPayroll($userId, $month->format('Y-m'));

            if ($existing && $existing->status === 'paid') {
                continue;
            }

            if ($existing) {
                $existing->update(['status' => 'paid', 'paid_at' => now()]);
            } else {
                HrmPayroll::create([
                    'user_id' => $userId,
                    'month' => $month->toDateString(),
                    'amount' => 0,
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);
            }
            $created++;
        }

        return back()->with('success', "Marked {$created} staff member(s) as paid for {$month->format('F Y')}.");
    }

    /**
     * Download the payroll report for the selected month as CSV.
     */
    public function exportPayroll(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('viewAny', User::class);

        $month = $this->resolvePayrollMonth($request);

        $staff = User::query()
            ->with(['roles:id,name', 'payrollForMonth' => fn ($q) => $q->whereDate('month', $month->toDateString())])
            ->whereDoesntHave('roles', function ($q): void {
                $q->whereIn('name', $this->hrmExcludedRoles());
            })
            ->orderBy('name')
            ->get();

        $filename = "payroll-{$month->format('Y-m')}.csv";

        return response()->streamDownload(function () use ($staff, $month): void {
            $out = fopen('php://output', 'w');

            echo "\xEF\xBB\xBF"; // UTF-8 BOM so Excel opens it correctly
            fputcsv($out, ['Name', 'Email', 'Roles', 'Month', 'Amount', 'Status', 'Paid At', 'Notes']);

            foreach ($staff as $member) {
                $payroll = $member->payrollForMonth->first();

                fputcsv($out, [
                    $member->name,
                    $member->email,
                    $member->roles->pluck('name')->implode(', '),
                    $month->format('Y-m'),
                    $payroll?->amount ?? '0.00',
                    $payroll?->status ?? 'unpaid',
                    $payroll?->paid_at?->toDateTimeString() ?? '',
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function findPayroll(int $userId, string $yearMonth): ?HrmPayroll
    {
        return HrmPayroll::withTrashed()
            ->where('user_id', $userId)
            ->whereDate('month', $yearMonth.'-01')
            ->first();
    }

    private function resolvePayrollMonth(Request $request): \Carbon\CarbonImmutable
    {
        if ($request->filled('month') && preg_match('/^\d{4}-\d{2}$/', (string) $request->month)) {
            return \Carbon\CarbonImmutable::createFromFormat('Y-m', $request->month)->startOfMonth();
        }

        return \Carbon\CarbonImmutable::now()->startOfMonth();
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('User/Form', [
            'roles' => Role::orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'password' => Hash::make($request->input('password')),
            'is_active' => $request->input('is_active'),
            'email_verified_at' => now(),
        ]);
        $user->syncRoles($request->input('roles'));

        return redirect()->route('users.index')
            ->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        $user->load('roles');

        return Inertia::render('User/Form', [
            'user' => $user,
            'roles' => Role::orderBy('name')->pluck('name'),
        ]);
    }

    public function update(UpdateRequest $request, User $user): \Illuminate\Http\RedirectResponse
    {
        $data = $request->safe()->only(['name', 'email', 'phone', 'is_active']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->input('password'));
        }

        $user->update($data);
        $user->syncRoles($request->input('roles'));

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('delete', $user);

        if ($user->hasRole('Super Admin') && User::role('Super Admin')->count() <= 1) {
            return redirect()->route('users.index')
                ->with('error', 'Cannot delete the only Super Admin account.');
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }
}
