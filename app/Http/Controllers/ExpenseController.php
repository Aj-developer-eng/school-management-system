<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\Expense;
use App\Models\HrmPayroll;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Expense::class);
    }

    public function index(Request $request): Response
    {
        $month = $this->resolveMonth($request);

        $expenses = Expense::query()
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%");
                });
            })
            ->when($request->category, function ($query, $category): void {
                $query->where('category', $category);
            })
            ->when($request->boolean('this_month') || ! $request->filled('from'), function ($query) use ($month): void {
                $query->whereBetween('expense_date', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()]);
            })
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $monthTotals = Expense::query()
            ->selectRaw("coalesce(sum(amount), 0) as total, coalesce(sum(case when category = 'salaries' then amount else 0 end), 0) as salaries")
            ->whereBetween('expense_date', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])
            ->first();

        $payrollPaid = HrmPayroll::query()
            ->whereDate('month', $month->toDateString())
            ->where('status', 'paid')
            ->sum('amount');

        $categoryTotals = Expense::query()
            ->select('category', DB::raw('coalesce(sum(amount), 0) as total'))
            ->whereBetween('expense_date', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        return Inertia::render('Expense/Index', [
            'expenses' => $expenses,
            'filters' => $request->only(['search', 'category', 'month']),
            'categories' => Expense::CATEGORIES,
            'month' => $month->format('Y-m'),
            'summary' => [
                'month_total' => (float) $monthTotals->total,
                'month_salaries' => (float) $monthTotals->salaries,
                'payroll_paid' => (float) $payrollPaid,
                'by_category' => $categoryTotals->map(fn ($row) => [
                    'category' => $row->category,
                    'label' => Expense::CATEGORIES[$row->category] ?? ucfirst($row->category),
                    'total' => (float) $row->total,
                ]),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Expense/Form', [
            'expense' => null,
            'categories' => Expense::CATEGORIES,
        ]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $data = $this->validated($request);

        $expense = Expense::create($data);

        ActivityLogService::custom('Expenses', 'created', "Recorded expense: {$expense->title} (Rs. {$expense->amount}, {$expense->category})");

        return redirect()->route('expenses.index')
            ->with('success', 'Expense recorded successfully.');
    }

    public function edit(Expense $expense): Response
    {
        return Inertia::render('Expense/Form', [
            'expense' => $expense,
            'categories' => Expense::CATEGORIES,
        ]);
    }

    public function update(Request $request, Expense $expense): \Illuminate\Http\RedirectResponse
    {
        $expense->update($this->validated($request));

        ActivityLogService::custom('Expenses', 'updated', "Updated expense: {$expense->title} (Rs. {$expense->amount}, {$expense->category})");

        return redirect()->route('expenses.index')
            ->with('success', 'Expense updated successfully.');
    }

    public function destroy(Expense $expense): \Illuminate\Http\RedirectResponse
    {
        $expense->delete();

        ActivityLogService::custom('Expenses', 'deleted', "Deleted expense: {$expense->title} (Rs. {$expense->amount}, {$expense->category})");

        return redirect()->route('expenses.index')
            ->with('success', 'Expense deleted successfully.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(array_keys(Expense::CATEGORIES))],
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'expense_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    private function resolveMonth(Request $request): \Carbon\CarbonImmutable
    {
        if ($request->filled('month') && preg_match('/^\d{4}-\d{2}$/', (string) $request->month)) {
            return \Carbon\CarbonImmutable::createFromFormat('Y-m', $request->month)->startOfMonth();
        }

        return \Carbon\CarbonImmutable::now()->startOfMonth();
    }
}