import { Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useAuth } from '@/utils/authorization';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { formatDate } from '@/utils/format';

export default function Index({ conversations, unreadCount }) {
    const { user } = useAuth();
    const page = usePage();
    const flash = page.props.session?.success ?? page.props.flash?.success;

    return (
        <AuthenticatedLayout
            title="Messages"
            breadcrumbs={[
                { label: 'Dashboard', href: route('dashboard') },
                { label: 'Messages' },
            ]}
        >
            <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
                {flash && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {flash}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Conversations with your children&rsquo;s teachers
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-sm font-semibold text-white shadow-sm shadow-rose-500/30">
                            <MessageCircle size={14} /> {unreadCount} unread
                        </span>
                    )}
                </div>

                {conversations.length === 0 && (
                    <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800">
                        <div className="px-8 py-12 text-center">
                            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No messages yet</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                You haven&rsquo;t exchanged any messages with teachers yet.
                            </p>
                        </div>
                    </div>
                )}

                {conversations.length > 0 && (
                    <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Conversations
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {conversations.map((conv) => (
                                <Link
                                    key={conv.teacher_id}
                                    href={route('parent.messages.teacher', conv.teacher_id)}
                                    className="group flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-base font-medium">
                                                {conv.teacher_name?.charAt(0) ?? '?'}
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {conv.teacher_name}
                                            </p>
                                            {conv.child && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {conv.child.name} &bull; {conv.child.admission_number ?? ''}
                                                </p>
                                            )}
                                            {conv.unread_count > 0 && (
                                                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-[10px] font-semibold">
                                                    {conv.unread_count} new
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-4 hidden sm:block">
                                        {conv.last_message ? (
                                            <div className="text-right">
                                                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]">
                                                    {conv.last_message.is_mine ? 'You: ' : ''}{conv.last_message.body}
                                                </p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    {formatDate(conv.last_message.created_at)}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 dark:text-gray-500">No messages</p>
                                        )}
                                    </div>
                                    <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-500 ml-2 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}