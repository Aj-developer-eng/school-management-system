import { Head } from '@inertiajs/react';
import { useState } from 'react';
import FlashMessages from '@/Components/FlashMessages';
import Breadcrumbs from '@/Components/Layout/Breadcrumbs';
import Sidebar from '@/Components/Layout/Sidebar';
import Topbar from '@/Components/Layout/Topbar';

export default function AuthenticatedLayout({ title, breadcrumbs = [], actions, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {title && <Head title={title} />}

            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    {(title || breadcrumbs.length > 0 || actions) && (
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1.5">
                                <Breadcrumbs items={breadcrumbs} />
                                {title && (
                                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                        {title}
                                    </h1>
                                )}
                            </div>
                            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
                        </div>
                    )}

                    {children}
                </main>
            </div>

            <FlashMessages />
        </div>
    );
}
