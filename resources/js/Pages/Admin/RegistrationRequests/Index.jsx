import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router } from '@inertiajs/react';

export default function Index({ requests = [], users = [] }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Registration Requests</h2>}>
            <div className="space-y-4">
                {requests.map((r) => (
                    <div key={r.id} className="rounded border p-4">
                        
                        <p>{r.name} - {r.email} - {r.status}</p>
                        <p className="text-sm">Assigned: {r.assigned_user?.name || 'Unassigned'}</p>
                        <div className="mt-2 flex gap-2 items-center">
                            <select value={r.assigned_user_id || ''} onChange={(e) => router.patch(route('registration-requests.assign', r.id), { assigned_user_id: e.target.value || null })}>
                                <option value="">Unassigned</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            {r.assigned_user_id && (
                                <button onClick={() => router.patch(route('registration-requests.approve', r.id))} className="text-green-600">Approve</button>
                            )}
                            <button onClick={() => router.patch(route('registration-requests.reject', r.id))} className="text-red-600">Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
