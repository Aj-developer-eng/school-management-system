# Multi-stage build. The point of the split is deploy speed: PHP-only pushes
# (the common case) reuse the cached `vendor` and `assets` stages entirely, so
# a redeploy only re-runs `COPY . .` + dump-autoload instead of re-installing
# composer/npm packages and re-running vite on every commit.

# ---------------------------------------------------------------------------
# base — OS packages + PHP extensions + composer binary.
# Shared by the vendor and final stages so apt/docker-php-ext work happens once.
# ---------------------------------------------------------------------------
FROM php:8.4-fpm AS base

# -qq keeps this quiet on purpose. Coolify streams every build log line into a
# JSON column in its own postgres and rewrites the whole blob per line, so a
# chatty apt run (the "Reading database ... 45%" spam) costs real CPU on the
# host and slows the build it is reporting on.
RUN DEBIAN_FRONTEND=noninteractive apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    git \
    curl \
    libpng-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions. gd needs to be explicitly configured with WebP
# support (--with-webp) — without it, docker-php-ext-install builds GD
# against libgd but omits imagewebp(), which is what ImageOptimizer
# (app/Services/ImageOptimizer.php) calls on every photo upload via
# Intervention Image's WebP encoder. Plain `docker-php-ext-install gd`
# silently succeeds either way, so this only surfaces at upload time as
# "Call to undefined function ... imagewebp()".
RUN docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip intl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# ---------------------------------------------------------------------------
# vendor — composer dependencies only. Cache key is composer.json/composer.lock,
# so this stage is skipped unless one of those two files actually changes.
# ---------------------------------------------------------------------------
FROM base AS vendor

COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/tmp/composer-cache \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    composer install --no-scripts --no-autoloader --no-dev --no-interaction --prefer-dist --quiet

# ---------------------------------------------------------------------------
# assets — vite/tailwind build. Runs on node (no node in the final image) and
# only copies the files vite and tailwind.config.js actually read, so touching
# app/, routes/ or database/ does NOT invalidate the frontend build.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS assets

WORKDIR /app

# package-lock.jso[n] is a glob, not a typo: it makes the lockfile optional so
# the build doesn't hard-fail when the repo has none (it was deleted in
# bb0fc67). `npm install` — not `npm ci` — is deliberate: it re-resolves
# platform-specific optional deps (e.g. @rollup/rollup-linux-x64-musl for this
# alpine stage), which a lockfile generated on Windows does not contain and
# `npm ci` will not add.
COPY package.json package-lock.jso[n] ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund --loglevel=warn

COPY vite.config.js postcss.config.js tailwind.config.js ./
COPY resources ./resources
# tailwind.config.js scans Laravel's own pagination blade views for classes.
COPY --from=vendor /var/www/vendor/laravel/framework/src/Illuminate/Pagination/resources/views \
    ./vendor/laravel/framework/src/Illuminate/Pagination/resources/views

RUN npm run build

# ---------------------------------------------------------------------------
# final image
# ---------------------------------------------------------------------------
FROM base AS app

# Static config first — these layers never change on an app-code push, so they
# stay cached below the `COPY . .` invalidation point.
COPY docker/nginx.conf /etc/nginx/sites-enabled/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
    && mkdir -p /var/log/supervisor \
    && { \
    echo '[www]'; \
    echo 'user = www-data'; \
    echo 'group = www-data'; \
    echo 'listen = 0.0.0.0:9000'; \
    echo 'listen.owner = www-data'; \
    echo 'listen.group = www-data'; \
    echo 'pm = dynamic'; \
    echo 'pm.max_children = 10'; \
    echo 'pm.start_servers = 2'; \
    echo 'pm.min_spare_servers = 1'; \
    echo 'pm.max_spare_servers = 3'; \
    echo 'clear_env = no'; \
    } > /usr/local/etc/php-fpm.d/www.conf \
    && { \
    echo 'upload_max_filesize = 25M'; \
    echo 'post_max_size = 30M'; \
    echo 'memory_limit = 256M'; \
    echo 'max_execution_time = 120'; \
    } > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=vendor /var/www/vendor ./vendor

COPY . .

RUN composer dump-autoload --optimize --no-dev

COPY --from=assets /app/public/build ./public/build

RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

EXPOSE 80

# Lets Coolify (and Docker itself) know when the container is actually
# ready to serve traffic — entrypoint.sh runs migrations/cache-warming
# before nginx starts, so without this Coolify's proxy can route requests
# to the new container before it's listening, causing a brief 502 during
# redeploys. start-period gives the entrypoint room to finish that work
# before failed checks count against the container.
#
# interval is 30s, not the 5s you might reach for first: /up boots the whole
# Laravel framework on every hit, and each check also costs a `docker exec`
# (process + cgroup setup) on the host. At 5s that was ~17k framework boots a
# day per container — on this shared box the health probes were costing more
# CPU than the real traffic. 30s still detects a dead container well inside
# Coolify's rollout window.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
    CMD curl -fs http://127.0.0.1/up || exit 1

# build-cache smoke test (2026-08-29): confirms apt/composer/npm layers stay
# cached now that Coolify's nightly forced cleanup is off — remove once verified.
CMD ["/entrypoint.sh"]
