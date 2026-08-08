import { usePage } from '@inertiajs/react';

export function useAuth() {
    const { auth } = usePage().props;

    const roles = auth?.user?.roles ?? [];
    const permissions = auth?.user?.permissions ?? [];
    const isSuperAdmin = roles.includes('Super Admin');

    const can = (permission) =>
        isSuperAdmin || permissions.includes(permission);

    const canAny = (list) => isSuperAdmin || list.some((p) => permissions.includes(p));

    const hasRole = (role) => roles.includes(role);

    return { user: auth?.user ?? null, roles, permissions, can, canAny, hasRole, isSuperAdmin };
}
