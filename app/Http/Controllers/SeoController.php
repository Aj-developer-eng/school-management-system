<?php

namespace App\Http\Controllers;

use App\Models\LandingPageSetting;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    /**
     * Generate dynamic robots.txt file.
     */
    public function robots(): Response
    {
        $cms = LandingPageSetting::first();

        if ($cms && ! empty(trim($cms->custom_robots_txt ?? ''))) {
            $content = trim($cms->custom_robots_txt);
        } elseif ($cms && ! $cms->robots_indexing) {
            $content = "User-agent: *\nDisallow: /";
        } else {
            $content = "User-agent: *\nDisallow: /admin\nDisallow: /dashboard\nAllow: /";
        }

        if ($cms && $cms->sitemap_enabled !== false) {
            $content .= "\n\nSitemap: " . url('/sitemap.xml');
        }

        return response($content, 200, [
            'Content-Type' => 'text/plain',
        ]);
    }

    /**
     * Generate dynamic XML sitemap.
     */
    public function sitemap(): Response
    {
        $cms = LandingPageSetting::first();

        if ($cms && $cms->sitemap_enabled === false) {
            abort(404);
        }

        $urls = [
            [
                'loc' => url('/'),
                'lastmod' => ($cms?->updated_at ?? now())->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '1.0',
            ],
            [
                'loc' => url('/login'),
                'lastmod' => now()->startOfMonth()->toAtomString(),
                'changefreq' => 'monthly',
                'priority' => '0.5',
            ],
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($urls as $u) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>' . htmlspecialchars($u['loc'], ENT_XML1, 'UTF-8') . "</loc>\n";
            $xml .= '    <lastmod>' . $u['lastmod'] . "</lastmod>\n";
            $xml .= '    <changefreq>' . $u['changefreq'] . "</changefreq>\n";
            $xml .= '    <priority>' . $u['priority'] . "</priority>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }
}
