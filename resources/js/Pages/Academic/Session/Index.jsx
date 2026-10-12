import { router } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import StatusBadge from '@/Components/Ui/StatusBadge';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';
import { confirmAction } from '@/utils/swal';

export default function Index({ sessions, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('academic-sessions.index');
    const [selectedIds, setSelectedIds] = useState([]);

    const canBulkUpdate = can('academic-sessions.update');

    const rows = sessions?.data ?? [];
    const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

    const toggleRow = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const toggleAll = () =>
        setSelectedIds(allSelected ? [] : rows.map((row) => row.id));

    const bulkActivation = async (action) => {
        if (selectedIds.length === 0) return;

        const confirmed = await confirmAction({
            title: `${action === 'activate' ? 'Activate' : 'Deactivate'} ${selectedIds.length} session(s)?`,
            text:
                action === 'activate'
                    ? 'Multiple category sessions can be active at the same time.'
                    : 'Selected category sessions will be marked inactive.',
            icon: 'question',
            confirmColor: action === 'activate' ? '#059669' : '#dc2626',
            confirmButtonText: action === 'activate' ? 'Activate' : 'Deactivate',
        });

        if (!confirmed) return;

        router.post(
            route('academic-sessions.bulk-activation'),
            { ids: selectedIds, action, _method: 'patch' },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedIds([]),
            },
        );
    };

    const columns = [
        ...(canBulkUpdate
            ? [
                  {
                      key: 'select',
                      label: (
                          <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleAll}
                              aria-label="Select all sessions"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                      ),
                      width: '40px',
                      render: (row) => (
                          <input
                              type="checkbox"
                              checked={selectedIds.includes(row.id)}
                              onChange={() => toggleRow(row.id)}
                              aria-label={`Select ${row.name}`}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                      ),
                  },
              ]
            : []),
        { key: 'name', label: 'Name' },
        {
            key: 'start_date',
            label: 'Duration',
            render: (row) => {
                const fmt = (d) => {
                    if (!d) return '—';
                    const date = new Date(d);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                };
                return `${fmt(row.start_date)} — ${fmt(row.end_date)}`;
            },
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <StatusBadge active={row.is_active} label={row.is_active ? 'Active' : 'Inactive'} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '120px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {can('academic-sessions.update') && <EditLink routeName="academic-sessions.edit" params={row.id} />}
                    {can('academic-sessions.delete') && <DeleteButton routeName="academic-sessions.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Category Session"
            breadcrumbs={[{ label: 'Category Session' }]}
            actions={can('academic-sessions.create') && <CreateButton routeName="academic-sessions.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name…" />
                </div>
                {canBulkUpdate && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 pb-4 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedIds.length} session(s) selected
                        </span>
                        <div className="flex items-center gap-2">
                            <PrimaryButton
                                className="gap-2"
                                disabled={selectedIds.length === 0}
                                onClick={() => bulkActivation('activate')}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Activate Selected</span>
                            </PrimaryButton>
                            <button
                                type="button"
                                disabled={selectedIds.length === 0}
                                onClick={() => bulkActivation('deactivate')}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <XCircle className="h-4 w-4" />
                                <span>Deactivate Selected</span>
                            </button>
                        </div>
                    </div>
                )}
                <DataTable columns={columns} rows={sessions} />
                <Pagination {...sessions} />
            </Card>
        </AuthenticatedLayout>
    );
}
