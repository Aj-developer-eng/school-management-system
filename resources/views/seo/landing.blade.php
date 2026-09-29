<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $content['seo']['title'] }}</title>
    <meta name="description" content="{{ $content['seo']['description'] }}">
    <meta name="keywords" content="{{ $content['seo']['keywords'] }}">
    <meta name="robots" content="{{ $content['seo']['robots'] }}">
    <link rel="canonical" href="{{ $content['seo']['canonical'] }}">
    <link rel="icon" href="/favicon.ico" sizes="any">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ $content['seo']['canonical'] }}">
    <meta property="og:title" content="{{ $content['seo']['title'] }}">
    <meta property="og:description" content="{{ $content['seo']['description'] }}">
    @if($content['seo']['og_image'])
    <meta property="og:image" content="{{ $content['seo']['og_image'] }}">
    @endif

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $content['seo']['title'] }}">
    <meta name="twitter:description" content="{{ $content['seo']['description'] }}">
    @if($content['seo']['og_image'])
    <meta name="twitter:image" content="{{ $content['seo']['og_image'] }}">
    @endif

    <script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>

    <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0 1.25rem 3rem; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height: 1.65; color: #1f2937; background: #ffffff; }
        .wrap { max-width: 70rem; margin: 0 auto; }
        header { padding: 1.5rem 0; border-bottom: 1px solid #e5e7eb; }
        h1 { font-size: 2rem; line-height: 1.2; margin: 2rem 0 1rem; }
        h2 { font-size: 1.375rem; margin: 2.5rem 0 0.75rem; }
        h3 { font-size: 1rem; margin: 1.25rem 0 0.25rem; }
        .lede { font-size: 1.125rem; color: #4b5563; }
        ul, ol { padding-left: 1.25rem; }
        .cards { list-style: none; padding: 0; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); }
        .cards > li { border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem; }
        .badge { display: inline-block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0; }
        .stats { list-style: none; display: flex; flex-wrap: wrap; gap: 1.5rem; padding: 0; }
        .stats strong { display: block; font-size: 1.25rem; }
        .cta { display: inline-block; margin: 0.5rem 0.75rem 0.5rem 0; padding: 0.65rem 1.25rem; border-radius: 999px; background: #1e3a8a; color: #ffffff; text-decoration: none; font-weight: 600; }
        .cta.secondary { background: #f3f4f6; color: #1f2937; }
        nav a { margin-right: 1rem; color: #1e3a8a; }
        blockquote { margin: 1rem 0; border-left: 3px solid #d1d5db; padding-left: 1rem; }
        blockquote footer { font-size: 0.875rem; color: #6b7280; }
        address { font-style: normal; }
        footer.site { margin-top: 3rem; border-top: 1px solid #e5e7eb; padding-top: 1.5rem; font-size: 0.875rem; color: #6b7280; }
    </style>
</head>
<body>
    <div class="wrap">
        <header>
            <p><strong>{{ $content['school']['name'] }}</strong></p>
            <nav aria-label="Section navigation">
                <a href="#programs">Programs</a>
                <a href="#locations">Locations</a>
                <a href="#dashboard">Student dashboard</a>
                <a href="#why-us">Why us</a>
                <a href="#contact">Contact</a>
            </nav>
        </header>

        <main>
            <section id="hero">
                <p class="badge">{{ $content['hero']['badge'] }}</p>
                <h1>{{ $content['hero']['title'] }} {{ $content['hero']['highlight'] }} {{ $content['hero']['suffix'] }}</h1>
                <p class="lede">{{ $content['hero']['subtitle'] }}</p>
                <p>
                    <a class="cta" href="{{ $content['hero']['button_link'] }}">{{ $content['hero']['button_text'] }}</a>
                    <a class="cta secondary" href="{{ $content['hero']['secondary_button_link'] }}">{{ $content['hero']['secondary_button_text'] }}</a>
                </p>
                <ul class="stats">
                    @foreach($content['hero']['stats'] as $stat)
                    <li><strong>{{ $stat['value'] ?? '' }}</strong> {{ $stat['label'] ?? '' }}</li>
                    @endforeach
                </ul>
            </section>

            <section id="programs">
                <h2>{{ $content['programs']['title'] }} {{ $content['programs']['highlight'] }}</h2>
                <ul class="cards">
                    @foreach($content['programs']['items'] as $program)
                    <li>
                        <h3>{{ $program['title'] ?? '' }}</h3>
                        @if(!empty($program['badge']))<p class="badge">{{ $program['badge'] }}</p>@endif
                        <p>{{ $program['description'] ?? '' }}</p>
                    </li>
                    @endforeach
                </ul>
            </section>

            <section id="why-us">
                <h2>{{ $content['why_us']['title'] }} {{ $content['why_us']['highlight'] }}</h2>
                <ul class="cards">
                    @foreach($content['why_us']['items'] as $reason)
                    <li>
                        <h3>{{ $reason['title'] ?? '' }}</h3>
                        <p>{{ $reason['description'] ?? '' }}</p>
                    </li>
                    @endforeach
                </ul>
            </section>

            <section id="locations">
                <h2>{{ $content['locations']['title'] }} {{ $content['locations']['highlight'] }}</h2>
                <p>{{ $content['locations']['description'] }}</p>
                <ul class="cards">
                    @foreach($content['locations']['items'] as $location)
                    <li>
                        <h3>{{ $location['title'] ?? '' }}</h3>
                        <p>{{ $location['description'] ?? '' }}</p>
                    </li>
                    @endforeach
                </ul>
            </section>

            <section id="dashboard">
                <h2>{{ $content['dashboard']['title'] }} {{ $content['dashboard']['highlight'] }}</h2>
                <p>{{ $content['dashboard']['description'] }}</p>
                <ul>
                    @foreach($content['dashboard']['features'] as $feature)
                    <li>{{ $feature }}</li>
                    @endforeach
                </ul>
                <p><a class="cta" href="{{ $content['dashboard']['button_link'] }}">{{ $content['dashboard']['button_text'] }}</a></p>
            </section>

            <section id="testimonials">
                <h2>{{ $content['testimonials']['title'] }} {{ $content['testimonials']['highlight'] }}</h2>
                @foreach($content['testimonials']['items'] as $testimonial)
                <blockquote>
                    <p>{{ $testimonial['quote'] ?? '' }}</p>
                    <footer>
                        {{ implode(', ', array_filter([$testimonial['name'] ?? null, $testimonial['program'] ?? null, $testimonial['location'] ?? null])) }}
                    </footer>
                </blockquote>
                @endforeach
            </section>

            <section id="admissions">
                <h2>{{ $content['cta']['title'] }} {{ $content['cta']['highlight'] }}</h2>
                <p>{{ $content['cta']['description'] }}</p>
                <p><a class="cta" href="{{ $content['cta']['button_link'] }}">{{ $content['cta']['button_text'] }}</a></p>
            </section>

            <section id="contact">
                <h2>Contact {{ $content['school']['name'] }}</h2>
                <address>
                    @if($content['school']['address']){{ $content['school']['address'] }}<br>@endif
                    @if($content['school']['city']){{ $content['school']['city'] }}@if($content['school']['country']), {{ $content['school']['country'] }}@endif<br>@endif
                    @if($content['school']['phone'])Phone: <a href="tel:{{ preg_replace('/[^0-9+]/', '', $content['school']['phone']) }}">{{ $content['school']['phone'] }}</a><br>@endif
                    @if($content['school']['email'])Email: <a href="mailto:{{ $content['school']['email'] }}">{{ $content['school']['email'] }}</a>@endif
                </address>
            </section>
        </main>

        <footer class="site">
            <p>{{ $content['footer']['description'] }}</p>
            <p>{{ $content['footer']['tagline'] }}</p>
            <p>&copy; {{ now()->year }} {{ $content['school']['footer_text'] }}</p>
        </footer>
    </div>
</body>
</html>
