#!/bin/bash
set -e

# Start Ollama in the background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
for i in $(seq 1 30); do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "Ollama is ready!"
        break
    fi
    sleep 1
done

# Pull the llama3.2 model if not already present
if ! curl -s http://localhost:11434/api/tags | grep -q "llama3.2"; then
    echo "Pulling llama3.2 model (this may take a few minutes)..."
    ollama pull llama3.2
fi

# Run database migrations
echo "Running migrations..."
php artisan migrate --force

# Start Laravel development server in the background
echo "Starting Laravel on port 8000..."
php artisan serve --host=0.0.0.0 --port=8000 &
LARAVEL_PID=$!

# Start Vite dev server in the background (for hot-reloading during development)
# Comment this out in production if you prefer serving pre-built assets
echo "Starting Vite dev server on port 5173..."
npm run dev -- --host &
VITE_PID=$!

# Wait for any process to exit (keeps container running)
echo "All services started. Container is running."
wait -n