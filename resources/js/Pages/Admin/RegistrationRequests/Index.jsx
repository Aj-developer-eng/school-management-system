import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router } from '@inertiajs/react';

export default function Index({ requests = [] }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Registration Requests</h2>}>
            <div className="space-y-4">
                {requests.map((r) => (
                    <div key={r.id} className="rounded border p-4">
                        <p>{r.name} - {r.email} - {r.status}</p>
                        <div className="mt-2 flex gap-2">
                            <button onClick={() => router.patch(route('registration-requests.approve', r.id))} className="text-green-600">Approve</button>
                            <button onClick={() => router.patch(route('registration-requests.reject', r.id))} className="text-red-600">Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
