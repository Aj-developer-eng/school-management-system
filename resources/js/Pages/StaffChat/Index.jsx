import { Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { useAuth } from '@/utils/authorization';
import { Send, Check, CheckCheck as Check2Icon } from 'lucide-react';
                <Card>
                    <div className="p-4 sm:p-6">
                        <form onSubmit={sendMessage} className="flex gap-2">
                            <InputLabel value="Message" />
                            <div className="flex-1 relative">
                                <textarea
                                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-transparent focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-green-400"
                                    value={data.body}
                                    onChange={(event) => setData('body', event.target.value)}
                                    placeholder="Type a message…"
                                    rows={1}
                                    disabled={processing}
                                />
                                <InputError message={errors.body} className="mt-1" />
                            </div>
                            <PrimaryButton
                                disabled={processing || !data.body.trim()}
                                className="ml-1"
                            >
                                {processing ? 'Sending…' : (
                                    <>
                                        <Send size={17} />{' '}
                                        Send
                                    </>
                                )}
                            </PrimaryButton>
                        </form>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
                <Card>
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col-reverse">
                            {messages.length === 0 ? (
                                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                                    No messages yet. Start the conversation below.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${
                                                isMine(message)
                                                    ? 'justify-end'
                                                    : 'justify-start'
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap break-words shadow-sm ${
                                                    isMine(message)
                                                        ? 'bg-green-400 text-white rounded-tl-none'
                                                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-tr-none'
                                                }`}
                                            >
                                                {message.body}
                                                <div className="flex items-center justify-end mt-1 gap-1">
                                                    <span className="text-[10px] opacity-70">
                                                        {formatTime(message.created_at)}
                                                    </span>
                                                    {isMine(message) && (
                                                        <>
                                                            {message.read_at ? (
                                                                <Check2Icon
                                                                    size={13}
                                                                    strokeWidth={1.6}
                                                                    className="opacity-90"
                                                                />
                                                            ) : (
                                                                <Check size={13} strokeWidth={1.6} className="opacity-90" />
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {headerTitle}
                                </h2>
                                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                                    {otherUser.name} &middot; {otherUser.role}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
    return (
        <AuthenticatedLayout
            title={pageTitle}
            breadcrumbs={[
                { label: 'Dashboard', href: route('dashboard') },
                { label: 'Messages', href: route('staff.messages') },
                { label: otherUser.name },
                { label: headerTitle },
            ]}
        >
            <div className="max-w-3xl mx-auto space-y-4 p-4 sm:p-6">
                {flash && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {flash}
                    </div>
                )}

export default function Index({ otherUser, messages }) {
    const { user } = useAuth();
    const staffId = user?.id;
    const page = usePage();
    const flash = page.props.session?.success ?? page.props.flash?.success;

    const { data, setData, post, processing, errors, reset } = useForm({
        body: '',
    });

    const isMine = (message) => message.sender_id === staffId;
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const sendMessage = (event) => {
        event.preventDefault();
        post(route('staff.messages.thread.store', otherUser.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const pageTitle = `Chat with ${otherUser.name}`;
    const headerTitle = `Chat with ${otherUser.role}`;