import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Send, Bot, Copy } from 'lucide-react';

export default function Chatbot() {
    const { messages, model } = usePage().props;
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [newMessageId, setNewMessageId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, newMessageId]);

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;
        setSending(true);
        const tempId = 'temp-' + Date.now();
        setNewMessageId(tempId);
        router.post(route('chatbot.store'), { message: input }, {
            onSuccess: () => {
                setInput('');
                setSending(false);
                setNewMessageId(null);
            },
            onError: () => {
                setSending(false);
            },
            preserveState: true,
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <AuthenticatedLayout title="AI Chatbot">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            AI Chatbot
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Powered by Ollama <span className="font-medium">{model}</span>
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800 overflow-hidden flex flex-col h-[600px]">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 focus:outline-none" tabIndex={0}>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bot size={48} className="mb-3 text-gray-400 dark:text-gray-500" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Start a conversation with your AI assistant
                                </p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${
                                    msg.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        {msg.role === 'assistant' && (
                                            <div className="shrink-0 rounded-full bg-indigo-100 p-1.5 dark:bg-indigo-900/30">
                                                <Bot size={14} className="text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-indigo-600 text-white dark:bg-indigo-500 ml-auto'
                                                : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {msg.role === 'assistant' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => copyText(msg.content)}
                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 transition-colors"
                                                    aria-label="Copy message"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTime(msg.created_at)}
                                                </span>
                                            </>
                                        )}
                                        {msg.role === 'user' && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                                                {formatTime(msg.created_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {newMessageId && (
                            <div ref={messagesEndRef} className="flex gap-3 flex-row-reverse">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="shrink-0 rounded-full bg-gray-100 p-1.5 dark:bg-gray-700">
                                            <Plus size={14} className="text-gray-500 dark:text-gray-400 animate-spin" />
                                        </div>
                                    </div>
                                    <div className="bg-indigo-600 text-white rounded-xl p-3 text-sm leading-relaxed ml-auto animate-pulse">
                                        Typing…
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message…"
                                rows={1}
                                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm leading-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={sending || !input.trim()}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {sending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </form>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            AI responses may be inaccurate. Verify important information.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}