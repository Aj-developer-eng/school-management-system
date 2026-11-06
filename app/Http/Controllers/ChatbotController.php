<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Services\OllamaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatbotController extends Controller
{
    protected OllamaService $ollama;

    public function __construct(OllamaService $ollama)
    {
        $this->ollama = $ollama;
    }

    public function index(): Response
    {
        $messages = auth()->user()
            ? ChatMessage::forUser(auth()->id())->take(50)->get()->sortBy('created_at')
            : collect();

        return Inertia::render('Chatbot', [
            'messages' => $messages,
            'model' => $this->ollama->getModel(),
        ]);
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:4000',
        ]);

        $user = auth()->user();

        // Persist user message
        $userMessage = ChatMessage::create([
            'user_id' => $user?->id,
            'role' => 'user',
            'content' => $validated['message'],
        ]);

        // Build conversation history for Ollama
        $history = ChatMessage::forUser($user?->id ?? 0)
            ->take(20)
            ->get()
            ->sortBy('created_at')
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->values()
            ->all();

        // Append the current user message (ensures it's included)
        $last = end($history);
        if ($last === false || $last['content'] !== $validated['message']) {
            $history[] = ['role' => 'user', 'content' => $validated['message']];
        }

        $reply = $this->ollama->chat($history);

        // Persist assistant message
        ChatMessage::create([
            'user_id' => $user?->id,
            'role' => 'assistant',
            'content' => $reply,
        ]);

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $userMessage->id,
                'role' => 'user',
                'content' => $validated['message'],
                'created_at' => $userMessage->created_at,
            ],
            'reply' => [
                'role' => 'assistant',
                'content' => $reply,
            ],
        ]);
    }
}