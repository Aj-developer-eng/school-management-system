<?php

namespace App\Support;

/**
 * Detects crawler / bot user agents.
 *
 * The React landing page is client-rendered, so anything that fetches the HTML
 * without executing JavaScript (search engines that don't render, social
 * scrapers, AI crawlers, SEO audits) sees an empty page. Those requests are
 * served a server-rendered version of the same content instead.
 */
class CrawlerDetector
{
    /**
     * Substrings that identify a non-interactive client. Real browser user
     * agents (Chrome, Safari, Firefox, Edge) contain none of these.
     *
     * @var list<string>
     */
    private const TOKENS = [
        // Generic
        'bot', 'crawl', 'spider', 'slurp', 'sitemap', 'feedfetcher', 'webpreview',
        'headlesschrome', 'lighthouse', 'pagespeed', 'preview',
        // Search engines
        'googleother', 'bingpreview', 'duckduckgo', 'yandex', 'baidu', 'sogou',
        'exabot', 'ia_archiver', 'mj12bot', 'dotbot', 'seznam', 'naver', 'qwant',
        'petalbot', 'applebot', 'ahrefs', 'semrush', 'seoptimer', 'screamingfrog',
        // AI crawlers
        'gptbot', 'oai-searchbot', 'chatgpt', 'claudebot', 'anthropic', 'perplexity',
        'ccbot', 'bytespider',
        // Social / link previews
        'facebookexternalhit', 'twitterbot', 'linkedinbot', 'telegrambot',
        'whatsapp', 'discordbot', 'slackbot', 'embedly', 'pinterest', 'vkbot',
        // HTTP clients, monitors and audits
        'python-requests', 'python-urllib', 'curl', 'wget', 'go-http-client',
        'okhttp', 'node-fetch', 'axios', 'java/', 'libwww', 'http_request',
        'monitor', 'uptime', 'pingdom', 'statuscake', 'site24x7', 'nagios',
        'datadog', 'newrelic', 'zabbix', 'insomnia', 'postmanruntime',
    ];

    /**
     * Determine whether the given user agent is a crawler.
     */
    public static function matches(?string $userAgent): bool
    {
        if ($userAgent === null || trim($userAgent) === '') {
            return false;
        }

        // Tokens are quoted so that characters such as the slash in "java/"
        // cannot terminate the pattern.
        $tokens = array_map(static fn (string $token): string => preg_quote($token, '~'), self::TOKENS);

        return preg_match('~('.implode('|', $tokens).')~i', $userAgent) === 1;
    }
}
