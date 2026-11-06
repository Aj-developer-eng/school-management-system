<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected string $host;
    protected string $model;

    public function __construct()
    {
        $this->host = rtrim(config('services.ollama.host', env('OLLAMA_HOST', 'http://localhost:11434')), '/');
        $this->model = config('services.ollama.model', env('OLLAMA_MODEL', 'llama3.2'));
    }

    /**
     * Send a chat message to Ollama and return the assistant's reply.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return string
     */
    public function chat(array $messages): string
    {
        try {
            $response = Http::timeout(120)->post("{$this->host}/api/chat", [
                'model' => $this->model,
                'messages' => $messages,
                'stream' => false,
            ]);

            if ($response->failed()) {
                Log::error('Ollama API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return "Sorry, I'm unable to process your request at the moment. Please try again later.";
            }

            $data = $response->json();

            return $data['message']['content'] ?? "Sorry, I couldn't generate a response.";
        } catch (\Throwable $e) {
            Log::error('Ollama service exception: '.$e->getMessage());

            return "Sorry, I'm unable to connect to the AI service. Please make sure Ollama is running.";
        }
    }

    /**
     * Get the currently configured model name.
     */
    public function getModel(): string
    {
        return $this->model;
    }
}