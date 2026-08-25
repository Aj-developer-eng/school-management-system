# School Management System

A comprehensive school management system built with Laravel 12, React 18, Inertia.js, and TailwindCSS. Manages academics, students, teachers, parents, fees, attendance, tests, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.2+, Laravel 12 |
| Frontend | React 18, Inertia.js |
| Styling | TailwindCSS 3, Vite 7 |
| Auth | Laravel Breeze (email verification) |
| Authorization | Spatie Laravel Permission (8 roles, 41 permissions) |
| Media | Spatie Media Library (logos, profile images) |
| PDF | Barryvdh DomPDF (invoice PDFs, student records) |
| Icons | lucide-react |
| Alerts | SweetAlert2 |
| Database | SQLite (default), MySQL supported |
| Deployment | Docker (PHP-FPM + Nginx + Supervisor) |

## Quick Start

```bash
# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Run migrations and seed
php artisan migrate --seed

# Build assets
npm run build

# Start dev server (or use: composer dev)
php artisan serve
```

### Demo Data (optional)

```bash
php artisan db:seed --class=DemoDataSeeder
```

### Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@school.test | password |
| Principal | principal@school.test | password |

## Architecture Overview

```
Browser (React/Inertia)
    │
    ▼
Routes (routes/web.php) ── middleware: auth, verified
    │
    ▼
Controllers (app/Http/Controllers/)
    │ ├── authorizeResource() → Policies (app/Policies/)
    │ ├── Validation → FormRequests (app/Http/Requests/)
    │ └── Business Logic → Services (app/Services/)
    │
    ▼
Models (app/Models/) ── Eloquent ORM
    │
    ▼
Database (SQLite / MySQL)
```

**Inertia.js flow:** Controllers return `Inertia::render('Page', $props)` → React components in `resources/js/Pages/` receive props → Ziggy generates route URLs in JS via `route('name')`.

## Roles & Permissions

### Roles (app/Enums/RoleEnum.php)

| Role | Description |
|------|-------------|
| Super Admin | Full access (bypasses all policies via Gate::before) |
| Principal | All permissions |
| Vice Principal | Academics, teachers, students, parents, fees |
| Teacher | View classes/sections/subjects/assignments/students, full test management |
| Accountant | View classes/sections/students/parents, full fee management |
| Receptionist | View classes/sections, student & parent CRUD |
| Student | View own fee invoices/payments, view tests |
| Parent | View children's fee invoices/payments/tests, create payments, special requests |

### Permission Scoping

Several controllers scope data based on the logged-in user's role:

| Module | Scoping Logic |
|--------|--------------|
| Fee Invoices (`/fee-invoices`) | Parents see only children's invoices; students see only their own |
| Fee Reports (`/fee-reports`) | Parents/students scoped to own children/self; staff see all |
| Attendance Report (`/attendance/report`) | Parents/students scoped to own children/self |
| Subjects (`/subjects`) | Teachers see only subjects they're assigned to |
| Dashboard | Role-specific dashboards (staff/teacher/parent/student) |
| Parent Dashboard | Shows children's fees, today's attendance, invoices |

## Core Modules

### 1. Academic Management

- **Academic Sessions** (`/academic-sessions`) — School years with start/end dates. Only one can be active at a time (enforced via model boot). Many pages fall back to the latest session if none is active.
- **Classes** (`/classes`) — Grade levels (Playgroup through Class 10).
- **Sections** (`/sections`) — Class sections (A, B) tied to academic sessions.
- **Subjects** (`/subjects`) — Subjects mapped to classes via `class_subject` pivot table.

### 2. Teacher Management

- **Teachers** (`/teachers`) — Teacher profiles with employee codes, qualifications, profile images (Spatie Media).
- **Subject Assignments** (`/teacher-assignments`) — Assigns teachers to class+section+subject for a session. Includes class time (start_time/end_time) and status (pending/started/completed).
- **Teacher Reports** (`/teacher-reports`) — Audit log of assignment status changes with per-teacher and per-date summaries.

### 3. Student Management

- **Students** (`/students`) — Full student records with admission numbers (auto-generated), enrollment tracking, PDF export. Activate/deactivate toggle (hidden for Super Admin).
- **Enrollments** — Students enrolled in class+section per academic session with roll numbers.
- **Parents** (`/parents`) — Parent accounts linked to students via `parent_student` pivot (guardian_type, is_primary_contact).

### 4. Fee Management

- **Fee Structures** (`/fee-structures`) — Fee definitions (admission, monthly, exam, transport) per class/session.
- **Fee Invoices** (`/fee-invoices`) — Individual and bulk-generated invoices. Status: unpaid → partial → paid. Can be cancelled. PDF download available.
- **Fee Payments** — Payment recording with methods (cash, cheque, bank transfer, card).
- **Fee Concessions** (`/fee-concessions`) — Scholarships, sibling discounts, staff child, financial aid (percentage or flat amount).
- **Fee Reports** (`/fee-reports`) — Summary cards, status breakdown, collection by method, class-wise summary, top outstanding.

### 5. Attendance

- **Mark Attendance** (`/attendance`) — Teachers select assignment, see enrolled students, mark present/absent/late/excused. Hidden from parents/students in sidebar.
- **Attendance Report** (`/attendance/report`) — Filterable report with summary cards. Scoped for parents/students.
- **Student Detail** (`/attendance/student/{id}`) — Per-student attendance history with day names.

### 6. Tests & Results

- **Tests** (`/tests`) — Teachers create tests (quiz, class test, mid-term, final, assignment, oral, practical). Status flow: announced → conducted → results_published.
- **Results** — Enter marks per student, auto-grade calculation (A+ through F). Publish results notifies parents via NotificationService.

### 7. Special Requests

- Parents submit requests (meeting, document, complaint, etc.) with priority. Staff can respond.

### 8. Dashboard

Role-specific dashboards:
- **Staff** — Stats overview, enrollment chart, teacher assignment overview, quick actions.
- **Teacher** — Assignment stats, class assignments table with start/complete/reset actions.
- **Parent** — Fee summary, today's attendance for children, children cards, recent invoices.
- **Student** — Enrollment info, recent invoices.

## Key Models & Relationships

```
AcademicSession ──┬── Section
                  └── (scoped in most queries)

SchoolClass ──┬── Section
              └── Subject (via class_subject pivot)

Teacher ──── TeacherSubjectAssignment ──── Subject
                    ├── SchoolClass
                    ├── Section
                    ├── AcademicSession
                    └── start_time / end_time

Student ──┬── StudentEnrollment ──┬── SchoolClass
          │                        └── Section
          ├── FeeInvoice ──┬── FeePayment
          │                 └── FeeConcession
          ├── Attendance
          ├── TestResult ── Test
          └── StudentParent (via parent_student pivot)

User ──┬── Student
       ├── Teacher
       ├── StudentParent
       └── Notification
```

## Services (app/Services/)

| Service | Responsibility |
|---------|---------------|
| `ActivityLogService` | Audit trail logging |
| `AdmissionNumberGenerator` | Auto-generates admission numbers (PREFIX-YEAR-####) |
| `FeeInvoiceService` | Invoice creation, bulk generation, cancellation |
| `FeePaymentService` | Payment recording, invoice recalculation |
| `ImageOptimizer` | Image optimization for uploads |
| `InvoiceNumberGenerator` | Invoice number generation |
| `NotificationService` | Send notifications to users/roles/admins |
| `SchoolSettingsService` | School settings singleton management |
| `StudentParentService` | Parent CRUD with user account sync |
| `StudentService` | Student creation with enrollment & user account |

## Frontend Structure

```
resources/js/
├── Components/
│   ├── Dashboard/        # DashboardCard, QuickAction, SimpleBarChart
│   ├── Layout/           # Breadcrumbs, Sidebar, Topbar, NotificationBell, GlobalSearch
│   ├── Ui/               # Card, DataTable, Pagination, SearchInput, StatusBadge, etc.
│   └── *.jsx             # Base components (TextInput, InputLabel, Modal, etc.)
├── config/
│   └── navigation.js     # Role-aware sidebar config (permissions, excludeRoles)
├── hooks/
│   └── useFilter.js      # Inertia filter hook for search/pagination
├── Layouts/
│   └── AuthenticatedLayout.jsx
├── Pages/                # Inertia page components (organized by feature)
└── utils/
    ├── authorization.js  # useAuth() hook — can(), canAny(), hasRole(), isSuperAdmin
    ├── format.js         # formatDate(), formatTime(), formatTimeRange(), formatDateTime()
    └── swal.js           # SweetAlert2 confirm dialogs
```

### Utility Helpers (resources/js/utils/format.js)

| Function | Example Output |
|----------|---------------|
| `formatDate(date)` | `Aug 25, 2026` |
| `formatTime(time)` | `2:30 PM` |
| `formatTimeRange(start, end)` | `9:00 AM — 1:30 PM` |
| `formatDateTime(date)` | `Aug 25, 2026 2:30 PM` |
| `formatDateTimeTime(date)` | `2:30 PM` |

**Always use these helpers for displaying dates/times in the UI.** HTML `<input type="date">` and `<input type="time">` keep `YYYY-MM-DD` / `HH:MM` values internally (browser spec), but display values should be formatted via these helpers.

## Important Patterns

### Date Handling

- Models with `date` casts serialize to full ISO datetime strings. For `<input type="date">` fields, format as `Y-m-d` in the controller before passing to Inertia.
- Use `whereDate()` (not `where()`) when querying date columns in SQLite — stored values include a time component.
- Active session fallback: `AcademicSession::active()->first() ?? AcademicSession::latest('start_date')->first()`

### Authorization

- Controllers use `$this->authorizeResource()` for automatic policy checks.
- Super Admin bypasses all policy checks via `Gate::before` in `AppServiceProvider`.
- `useAuth()` hook in React provides `can()`, `canAny()`, `hasRole()`, `isSuperAdmin`.
- Navigation items use `permission` (required), `roles` (allow-list), and `excludeRoles` (deny-list).

### Scoping Pattern

For parent/student data isolation, controllers use a `scopedStudentIds()` helper:

```php
private function scopedStudentIds(User $user): ?Collection
{
    if ($user->hasRole(RoleEnum::Parent->value)) {
        return StudentParent::where('user_id', $user->id)->first()?->students()->pluck('students.id');
    }
    if ($user->hasRole(RoleEnum::Student->value)) {
        return collect([Student::where('user_id', $user->id)->first()?->id]);
    }
    return null; // Staff: no scoping
}
```

### Lazy Loading Prevention

Lazy loading is disabled in non-production environments (`Model::preventLazyLoading()`). Always eager-load relationships in queries to avoid `LazyLoadingViolationException`.

## Database

### Migrations

Migrations are in `database/migrations/` with timestamp prefixes. Key tables:

- `users`, `students`, `teachers`, `parents`
- `academic_sessions`, `school_classes`, `sections`, `subjects`
- `class_subject` (pivot), `parent_student` (pivot)
- `teacher_subject_assignments`, `teacher_assignment_logs`
- `student_enrollments`
- `fee_structures`, `fee_invoices`, `fee_payments`, `fee_concessions`
- `attendances`
- `tests`, `test_results`
- `special_requests`
- `notifications`, `activity_logs`
- `school_settings`, `landing_page_settings`

### Seeders

| Seeder | Command | Description |
|--------|---------|-------------|
| `DatabaseSeeder` | `php artisan db:seed` | Runs RolesAndPermissions + SuperAdmin |
| `RolesAndPermissionsSeeder` | — | Creates 8 roles, 41 permissions, assigns to roles |
| `SuperAdminSeeder` | — | Creates superadmin & principal accounts |
| `DemoDataSeeder` | `php artisan db:seed --class=DemoDataSeeder` | Full demo data (sessions, classes, teachers, students, parents, fees) |

## Development

### Commands

```bash
composer dev          # Start Laravel + Vite + queue + logs (concurrently)
composer test         # Run PHPUnit tests
npm run dev           # Vite dev server only
npm run build         # Production build
php artisan migrate   # Run migrations
php artisan tinker    # REPL
```

### Code Style

- PHP: Laravel Pint (PSR-12 + Laravel preset)
- JS: React functional components with hooks
- Naming: PascalCase for components/classes, camelCase for functions/variables
- Controllers: Resource controllers with `authorizeResource()`
- Validation: Form Request classes in `app/Http/Requests/{Module}/`

### Adding a New Module

1. Create migration: `php artisan make:migration create_xyz_table`
2. Create model: `php artisan make:model Xyz`
3. Create policy: `php artisan make:policy XyzPolicy --model=Xyz`
4. Create controller: `php artisan make:controller XyzController --resource`
5. Create form requests: `php artisan make:request Xyz/StoreRequest`
6. Add routes in `routes/web.php` (resource route)
7. Create React pages in `resources/js/Pages/Xyz/`
8. Add navigation item in `resources/js/config/navigation.js`
9. Add permission in `app/Enums/PermissionEnum.php`
10. Assign permission to roles in `database/seeders/RolesAndPermissionsSeeder.php`

## Deployment (Docker)

The `dockerfile` builds a PHP-FPM + Nginx + Supervisor image:

```bash
docker build -t school-management .
docker run -p 80:80 school-management
```

**Config:** PHP 8.4 FPM, Nginx, Node 20, 256MB memory limit, 25MB upload limit.

Docker config files: `docker/nginx.conf`, `docker/supervisord.conf`, `docker/entrypoint.sh`.

## File Locations Quick Reference

| What | Where |
|------|-------|
| Routes | `routes/web.php`, `routes/auth.php` |
| Controllers | `app/Http/Controllers/` |
| Models | `app/Models/` |
| Policies | `app/Policies/` |
| Services | `app/Services/` |
| Enums | `app/Enums/` |
| Form Requests | `app/Http/Requests/{Module}/` |
| Migrations | `database/migrations/` |
| Seeders | `database/seeders/` |
| React Pages | `resources/js/Pages/` |
| React Components | `resources/js/Components/` |
| Navigation Config | `resources/js/config/navigation.js` |
| Auth Hook | `resources/js/utils/authorization.js` |
| Format Helpers | `resources/js/utils/format.js` |
| Layout | `resources/js/Layouts/AuthenticatedLayout.jsx` |
