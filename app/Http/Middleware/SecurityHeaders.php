<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds the security headers that scanners look for (HSTS, CSP and friends).
 *
 * These live in the app rather than in docker/nginx.conf so that they also apply
 * behind the Coolify/Traefik proxy and in local development, where responses do
 * not pass through the container's nginx.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // HSTS is sent on every response: browsers only honour it over HTTPS, so
        // it is inert on plain HTTP (e.g. local development) but means HTTPS
        // visitors are covered from the very first response.
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        if (! $response->headers->has('Content-Security-Policy')) {
            $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy());
        }

        return $response;
    }

    /**
     * The app is a single-page React client, so the policy has to allow the
     * inline bootstrap/Ziggy scripts and the CMS-provided remote images.
     * The Vite dev server (separate origin, HMR websocket) is only allowed
     * while running locally.
     */
    private function contentSecurityPolicy(): string
    {
        $local = app()->environment('local');

        $devOrigins = $local ? ' http://localhost:* http://127.0.0.1:* http://[::1]:*' : '';
        $devSockets = $local ? ' ws://localhost:* ws://127.0.0.1:*' : '';
        $unsafeEval = $local ? " 'unsafe-eval'" : '';

        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'{$unsafeEval}{$devOrigins}",
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net{$devOrigins}",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data: https://fonts.bunny.net",
            "connect-src 'self'{$devOrigins}{$devSockets}",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "object-src 'none'",
        ]);
    }
}
