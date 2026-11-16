import { Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { useAuth } from '@/utils/authorization';
import { Send, Check, CheckCheck as Check2Icon } from 'lucide-react';

export default function Index({ schoolClass, student, parent, messages, teacher, isParent }) {
    const { user } = useAuth();
    const teacherId = user?.id;
    const page = usePage();
    const flash = page.props.session?.success ?? page.props.flash?.success;

    const { data, setData, post, processing, errors, reset } = useForm({
        body: '',
    });

    const isMine = (message) => message.sender_id === teacherId;
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const sendMessage = (event) => {
        event.preventDefault();
        const routeName = isParent
            ? route('parent.messages.teacher.store', teacher?.id)
            : route('classes.students.chat.store', [schoolClass.id, student.id]);
        post(routeName, {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const otherPartyName = isParent ? (teacher?.name ?? 'Teacher') : (parent?.name ?? student.name);
    const pageTitle = isParent ? `Chat with ${otherPartyName}` : `Chat with ${parent?.name ?? student.name}`;
    const headerTitle = isParent ? 'Chat with Teacher' : 'Chat with Parent';
    const headerSubtitle = isParent
        ? `${teacher?.name ?? 'Teacher'} &middot; ${student.admission_number ?? ''}`
        : `${parent?.name ?? 'No parent linked'} &middot; ${student.admission_number ?? ''}`;

    return (
        <AuthenticatedLayout
            title={pageTitle}
            breadcrumbs={[
                { label: 'Classes', href: route('dashboard') },
                {
                    label: schoolClass?.name ?? 'Class',
                    href: route('classes.show', schoolClass.id),
                },
                { label: student.name },
                { label: headerTitle },
            ]}
        >
            <div className="max-w-3xl mx-auto space-y-4 p-4 sm:p-6">
                {flash && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {flash}
                    </div>
                )}

                {/* Conversation header */}
                <Card>
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {headerTitle}
                                </h2>
                                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                                    {headerSubtitle}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 text-right sm:text-left">
                                {parent?.phone && (
                                    <Link
                                        href={`tel:${parent.phone}`}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <span className="text-[12px]">&#128222;</span>{' '}
                                        {parent.phone}
                                    </Link>
                                )}
                                {parent?.email && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {parent.email}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
                {/* Message list */}
                <Card className="flex-1 min-h-[50vh] flex flex-col">
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 [& > * + *]:mt-3">
                        {messages.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No messages yet. Start the conversation.
                            </p>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${
                                        isMine(message) ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap shadow-sm ${
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
                            ))
                        )}
                    </div>
                </Card>

                {/* Compose area */}
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

