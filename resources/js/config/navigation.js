import {
    BarChart3,
    BookOpen,
    CalendarRange,
    GraduationCap,
    Layers,
    LayoutDashboard,
    Library,
    Receipt,
    School,
    Settings,
    ShieldCheck,
    UserCog,
    Users,
    UsersRound,
    Wallet,
    ClipboardCheck,
    FileText,
    MessageSquareText,
    ScrollText,
} from 'lucide-react';

/**
 * Role-aware navigation tree.
 * - `permission`: required permission (null = visible to all authenticated users)
 * - `routeName`: Ziggy route name; item is hidden if the route is not registered,
 *   so navigation stays valid while modules are rolled out incrementally.
 */
export const navigation = [
    {
        section: null,
        items: [
            {
                label: 'Dashboard',
                routeName: 'dashboard',
                icon: LayoutDashboard,
                permission: null,
            },
        ],
    },
    {
        section: 'Academics',
        items: [
            {
                label: 'Academic Sessions',
                routeName: 'academic-sessions.index',
                icon: CalendarRange,
                permission: 'academic-sessions.view',
            },
            {
                label: 'Classes',
                routeName: 'classes.index',
                icon: School,
                permission: 'classes.view',
            },
            {
                label: 'Sections',
                routeName: 'sections.index',
                icon: Layers,
                permission: 'sections.view',
            },
            {
                label: 'Subjects',
                routeName: 'subjects.index',
                icon: BookOpen,
                permission: 'subjects.view',
            },
            {
                label: 'Attendance',
                routeName: 'attendance.index',
                icon: ClipboardCheck,
                permission: null,
                excludeRoles: ['Parent', 'Student'],
            },
            {
                label: 'Tests',
                routeName: 'tests.index',
                icon: FileText,
                permission: 'tests.view',
            },
            {
                label: 'Special Requests',
                routeName: 'special-requests.index',
                icon: MessageSquareText,
                permission: null,
            },
        ],
    },
    {
        section: 'People',
        items: [
            {
                label: 'Teachers',
                routeName: 'teachers.index',
                icon: Library,
                permission: 'teachers.view',
            },
            {
                label: 'Subject Assignments',
                routeName: 'teacher-assignments.index',
                icon: UserCog,
                permission: 'teacher-assignments.view',
            },
            {
                label: 'Teacher Report',
                routeName: 'teacher-reports.index',
                icon: BarChart3,
                permission: 'teacher-assignments.view',
            },
            {
                label: 'Students',
                routeName: 'students.index',
                icon: GraduationCap,
                permission: 'students.view',
            },
            {
                label: 'Parents',
                routeName: 'parents.index',
                icon: UsersRound,
                permission: 'parents.view',
            },
        ],
    },
    {
        section: 'Fees',
        items: [
            {
                label: 'Fee Structures',
                routeName: 'fee-structures.index',
                icon: Receipt,
                permission: 'fee-structures.view',
            },
            {
                label: 'Invoices',
                routeName: 'fee-invoices.index',
                icon: Wallet,
                permission: 'fee-invoices.view',
            },
            {
                label: 'Concessions',
                routeName: 'fee-concessions.index',
                icon: Users,
                permission: 'fee-concessions.view',
            },
            {
                label: 'Reports',
                routeName: 'fee-reports.index',
                icon: BarChart3,
                permission: 'fee-invoices.view',
            },
            {
                label: 'Attendance Report',
                routeName: 'attendance.report',
                icon: ClipboardCheck,
                permission: null,
            },
        ],
    },
    {
        section: 'Administration',
        items: [
            {
                label: 'Users',
                routeName: 'users.index',
                icon: Users,
                permission: 'users.view',
            },
            {
                label: 'Roles & Permissions',
                routeName: 'roles.index',
                icon: ShieldCheck,
                permission: 'roles.view',
            },
            {
                label: 'School Settings',
                routeName: 'school-settings.edit',
                icon: Settings,
                permission: 'school-settings.view',
            },
            {
                label: 'Landing Page',
                routeName: 'landing-page.edit',
                icon: LayoutDashboard,
                permission: 'school-settings.view',
            },
            {
                label: 'Audit Logs',
                routeName: 'activity-logs.index',
                icon: ScrollText,
                permission: null,
                roles: ['Super Admin'],
            },
        ],
    },
];

export function visibleNavigation(can, roles = []) {
    return navigation
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) =>
                    (item.permission === null || can(item.permission)) &&
                    (!item.roles || item.roles.some((r) => roles.includes(r))) &&
                    (!item.excludeRoles || !item.excludeRoles.some((r) => roles.includes(r))) &&
                    route().has(item.routeName),
            ),
        }))
        .filter((group) => group.items.length > 0);
}
