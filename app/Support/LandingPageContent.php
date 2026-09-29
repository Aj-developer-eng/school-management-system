<?php

namespace App\Support;

use App\Models\AcademicSession;
use App\Models\LandingPageSetting;
use App\Models\SchoolSetting;

/**
 * Normalises the CMS-driven landing page content — with the same fallbacks the
 * React page (resources/js/Pages/Landing.jsx) uses — so it can be rendered
 * server-side for crawlers and reused for the SEO meta tags / JSON-LD.
 */
class LandingPageContent
{
    /**
     * Search engines display roughly 920px of description, which is about 140
     * characters, so longer text is truncated where it is rendered.
     */
    public const DESCRIPTION_LIMIT = 140;

    private const DEFAULT_DESCRIPTION = 'Global pathways from O/A Levels, SAT, BTEC and IELTS to UK university graduation — online and on-site.';

    private const DEFAULT_KEYWORDS = 'school, education, O levels, A levels, BTEC, SAT, Cambridge, international school';

    private const DEFAULT_PROGRAMS = [
        ['title' => 'O/A Level Coaching', 'description' => 'Structured Cambridge and Pearson O/A Level preparation with subject specialists, mock exams and progress tracking.', 'badge' => 'Cambridge · Pearson'],
        ['title' => 'O/A Level Homeschooling', 'description' => 'Personalized homeschooling plan with a clear roadmap toward Ivy League and top-tier UK university admissions.', 'badge' => 'Personalized'],
        ['title' => 'SAT Coaching', 'description' => 'Comprehensive SAT preparation covering math, evidence-based reading and writing, with timed practice tests and score tracking.', 'badge' => 'Test prep'],
        ['title' => 'BTEC Pearson Level 3', 'description' => 'Practical, career-focused qualification that builds the skills universities and employers value.', 'badge' => 'Career-focused'],
        ['title' => 'Pearson Level 5 Extended Diploma', 'description' => 'Advanced diploma pathways in Business, Law and Information Technology — stepping stones to UK top-up degrees.', 'badge' => 'Advanced diploma'],
        ['title' => 'IELTS Coaching', 'description' => 'Targeted training in reading, writing, listening and speaking to help you hit your target band score.', 'badge' => 'Band targets'],
    ];

    /**
     * Build the full landing page content used by the crawler-facing view.
     *
     * @return array<string, mixed>
     */
    public static function build(): array
    {
        $cms = LandingPageSetting::first();
        $school = SchoolSetting::first();
        $activeSession = AcademicSession::active()->first();

        $schoolName = $school?->school_name ?: 'EdSkills Global';
        $heroSubtitle = $cms?->hero_subtitle ?: self::DEFAULT_DESCRIPTION;

        return [
            'school' => self::schoolSection($school, $schoolName),
            'hero' => self::heroSection($cms, $activeSession, $heroSubtitle),
            'programs' => self::programsSection($cms),
            'locations' => self::locationsSection($cms),
            'dashboard' => self::dashboardSection($cms),
            'why_us' => self::whyUsSection($cms),
            'testimonials' => self::testimonialsSection($cms),
            'cta' => self::ctaSection($cms),
            'footer' => self::footerSection($cms),
            'seo' => self::seo($cms, $school, $schoolName, $heroSubtitle),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function schoolSection(?SchoolSetting $school, string $schoolName): array
    {
        return [
            'name' => $schoolName,
            'address' => $school?->address,
            'city' => $school?->city,
            'country' => $school?->country,
            'phone' => $school?->phone,
            'email' => $school?->email,
            'logo' => $school?->logoUrl(),
            'footer_text' => $school?->footer_text ?: $schoolName,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function heroSection(?LandingPageSetting $cms, ?AcademicSession $activeSession, string $subtitle): array
    {
        return [
            'badge' => $cms?->hero_badge_text ?: ($activeSession ? 'Admissions Open for '.$activeSession->name : 'Online & on-site · Pakistan · Dubai · UK'),
            'title' => $cms?->hero_title ?: 'Global pathways to',
            'highlight' => $cms?->hero_title_highlight ?: 'world-class',
            'suffix' => $cms?->hero_title_suffix ?: 'degrees.',
            'subtitle' => $subtitle,
            'button_text' => $cms?->hero_button_text ?: 'Open my dashboard',
            'button_link' => $cms?->hero_button_link ?: route('login'),
            'secondary_button_text' => $cms?->hero_secondary_button_text ?: 'Explore programs',
            'secondary_button_link' => $cms?->hero_secondary_button_link ?: '#programs',
            'stats' => $cms?->hero_stats ?: [
                ['label' => 'Programs', 'value' => '7+'],
                ['label' => 'Countries', 'value' => '3'],
                ['label' => 'Progression rate', 'value' => '94%'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function programsSection(?LandingPageSetting $cms): array
    {
        return [
            'title' => $cms?->programs_title ?: 'Every pathway, from school entrance to',
            'highlight' => $cms?->programs_title_highlight ?: 'UK graduation',
            'items' => $cms?->programs ?: self::DEFAULT_PROGRAMS,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function locationsSection(?LandingPageSetting $cms): array
    {
        return [
            'title' => $cms?->locations_title ?: 'Study online, on-site or',
            'highlight' => $cms?->locations_title_highlight ?: 'across borders',
            'description' => $cms?->locations_description ?: 'All programs are delivered online and on-site, with offices in Pakistan, Dubai and the UK to support admissions, mentoring and university placement.',
            'items' => $cms?->locations ?: [
                ['title' => 'Pakistan', 'description' => 'On-site campuses and study centers'],
                ['title' => 'Dubai', 'description' => 'Face-to-face and blended learning hub'],
                ['title' => 'United Kingdom', 'description' => 'University pathway coordination office'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function dashboardSection(?LandingPageSetting $cms): array
    {
        return [
            'title' => $cms?->dashboard_title ?: 'Your academic journey, in',
            'highlight' => $cms?->dashboard_title_highlight ?: 'one view',
            'description' => $cms?->dashboard_description ?: 'Track assessment scores, attendance, IELTS mock bands, BTEC unit progress and your UK university pathway — all updated in real time.',
            'features' => $cms?->dashboard_features ?: [
                'Course-by-course progress across O/A Levels, SAT, BTEC and diplomas',
                'Assessment trends with target tracking for IELTS, SAT and Pearson units',
                'Monthly attendance for online and on-site sessions',
                'Personal mentor notes and university pathway milestones',
            ],
            'button_text' => $cms?->dashboard_button_text ?: 'Open my dashboard',
            'button_link' => $cms?->dashboard_button_link ?: route('login'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function whyUsSection(?LandingPageSetting $cms): array
    {
        return [
            'title' => $cms?->why_us_title ?: 'A different kind of',
            'highlight' => $cms?->why_us_title_highlight ?: 'education partner',
            'items' => $cms?->why_us ?: [
                ['title' => 'Pearson-aligned delivery', 'description' => 'BTEC and Pearson diploma content taught by certified trainers who understand examiner expectations.'],
                ['title' => 'UK university network', 'description' => "Direct top-up degree pathways with UK university partners for graduation and master's programs."],
                ['title' => 'Global + local support', 'description' => 'Online classes backed by on-site offices in Pakistan, Dubai and the UK for admissions and mentoring.'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function testimonialsSection(?LandingPageSetting $cms): array
    {
        return [
            'title' => $cms?->testimonials_title ?: 'Results, in their',
            'highlight' => $cms?->testimonials_title_highlight ?: 'own words',
            'items' => $cms?->testimonials ?: [
                ['name' => 'Ayesha R.', 'program' => 'SAT Coaching', 'location' => 'Lahore', 'quote' => 'The dashboard kept me honest. I could see my SAT practice scores climbing every week, and my mentor adjusted the plan whenever I plateaued.'],
                ['name' => 'Omar K.', 'program' => 'BTEC Pearson Level 3', 'location' => 'Dubai', 'quote' => 'BTEC Level 3 gave me a direct route into a UK top-up degree. The unit tracking meant I always knew exactly what was left.'],
                ['name' => 'Fatima S.', 'program' => 'IELTS Coaching', 'location' => 'Online', 'quote' => 'I went from a 6.0 to a 7.5 IELTS band in four months. The mock band tracking and speaking practice made all the difference.'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function ctaSection(?LandingPageSetting $cms): array
    {
        return [
            'title' => $cms?->cta_title ?: 'Your future deserves a partner that takes it',
            'highlight' => $cms?->cta_title_highlight ?: 'seriously',
            'description' => $cms?->cta_description ?: 'Create your student account in seconds, explore your sample dashboard, and talk to admissions about the right pathway.',
            'button_text' => $cms?->cta_button_text ?: 'Create student account',
            'button_link' => $cms?->cta_button_link ?: route('login'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function footerSection(?LandingPageSetting $cms): array
    {
        return [
            'description' => $cms?->footer_description ?: 'Global pathways from O/A Levels, SAT, BTEC and IELTS to UK university graduation — online and on-site.',
            'tagline' => $cms?->footer_tagline ?: "Crafted for tomorrow's leaders.",
        ];
    }

    /**
     * SEO meta values shared by the server-rendered page and the React <Head>.
     *
     * @return array<string, string|null>
     */
    public static function seo(
        ?LandingPageSetting $cms = null,
        ?SchoolSetting $school = null,
        ?string $schoolName = null,
        ?string $description = null
    ): array {
        $cms ??= LandingPageSetting::first();
        $school ??= SchoolSetting::first();
        $schoolName ??= $school?->school_name ?: 'EdSkills Global';

        return [
            'title' => $cms?->meta_title ?: $schoolName.' — O/A Levels, BTEC, SAT & UK',
            'description' => self::limit($cms?->meta_description ?: ($description ?: $cms?->hero_subtitle ?: self::DEFAULT_DESCRIPTION)),
            'keywords' => $cms?->meta_keywords ?: self::DEFAULT_KEYWORDS,
            'canonical' => $cms?->canonical_url ?: url('/'),
            'og_image' => $cms?->og_image_url ?: ($cms?->banner_image_url ?: $school?->logoUrl()),
            'robots' => ($cms && ! $cms->robots_indexing) ? 'noindex, nofollow' : 'index, follow',
        ];
    }

    /**
     * schema.org JSON-LD so search engines and AI crawlers can parse the school
     * and its programmes without executing JavaScript.
     *
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    public static function schema(array $content): array
    {
        $school = $content['school'];
        $seo = $content['seo'];
        $base = rtrim($seo['canonical'] ?: url('/'), '/');

        $organization = array_filter([
            '@type' => 'EducationalOrganization',
            '@id' => $base.'#organization',
            'name' => $school['name'],
            'url' => $base,
            'description' => $seo['description'],
            'logo' => $seo['og_image'],
            'image' => $seo['og_image'],
            'email' => $school['email'],
            'telephone' => $school['phone'],
            'address' => array_filter([
                '@type' => 'PostalAddress',
                'streetAddress' => $school['address'],
                'addressLocality' => $school['city'],
                'addressCountry' => $school['country'],
            ]),
            'hasOfferCatalog' => $content['programs']['items'] ? [
                '@type' => 'OfferCatalog',
                'name' => trim($content['programs']['title'].' '.$content['programs']['highlight']),
                'itemListElement' => array_map(fn (array $program): array => array_filter([
                    '@type' => 'Course',
                    'name' => $program['title'] ?? null,
                    'description' => $program['description'] ?? null,
                ]), $content['programs']['items']),
            ] : null,
        ]);

        return [
            '@context' => 'https://schema.org',
            '@graph' => [
                $organization,
                array_filter([
                    '@type' => 'WebSite',
                    '@id' => $base.'#website',
                    'url' => $base,
                    'name' => $school['name'],
                    'description' => $seo['description'],
                    'inLanguage' => str_replace('_', '-', app()->getLocale()),
                    'publisher' => ['@id' => $base.'#organization'],
                ]),
            ],
        ];
    }

    /**
     * Collapse whitespace and truncate on a word boundary so search snippets
     * are not cut off mid-word.
     */
    public static function limit(?string $text, int $limit = self::DESCRIPTION_LIMIT): string
    {
        $text = trim(preg_replace('/\s+/', ' ', (string) $text));

        if (mb_strlen($text) <= $limit) {
            return $text;
        }

        $cut = rtrim(mb_substr($text, 0, $limit), ' ,.;:-');
        $lastSpace = mb_strrpos($cut, ' ');

        if ($lastSpace !== false) {
            $cut = mb_substr($cut, 0, $lastSpace);
        }

        return rtrim($cut, ' ,.;:-').'…';
    }
}
