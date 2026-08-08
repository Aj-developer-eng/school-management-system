<?php

namespace App\Providers;

use App\Enums\RoleEnum;
use App\Models\FeeConcession;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\User;
use App\Policies\FeeConcessionPolicy;
use App\Policies\FeeInvoicePolicy;
use App\Policies\FeePaymentPolicy;
use App\Policies\FeeStructurePolicy;
use App\Policies\RolePolicy;
use App\Policies\UserPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Model::preventLazyLoading(! $this->app->isProduction());

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(FeeStructure::class, FeeStructurePolicy::class);
        Gate::policy(FeeInvoice::class, FeeInvoicePolicy::class);
        Gate::policy(FeePayment::class, FeePaymentPolicy::class);
        Gate::policy(FeeConcession::class, FeeConcessionPolicy::class);

        Gate::before(function (User $user): ?bool {
            return $user->hasRole(RoleEnum::SuperAdmin->value) ? true : null;
        });
    }
}
