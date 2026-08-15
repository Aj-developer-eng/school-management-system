FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
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

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
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

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-dev --no-interaction

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN composer dump-autoload --optimize --no-dev

RUN npm run build

COPY docker/nginx.conf /etc/nginx/sites-enabled/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /var/log/supervisor

RUN { \
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
} > /usr/local/etc/php-fpm.d/www.conf

RUN { \
    echo 'upload_max_filesize = 25M'; \
    echo 'post_max_size = 30M'; \
    echo 'memory_limit = 256M'; \
    echo 'max_execution_time = 120'; \
} > /usr/local/etc/php/conf.d/uploads.ini

RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

EXPOSE 80

# Lets Coolify (and Docker itself) know when the container is actually
# ready to serve traffic — entrypoint.sh runs migrations/cache-warming
# before nginx starts, so without this Coolify's proxy can route requests
# to the new container before it's listening, causing a brief 502 during
# redeploys. start-period gives the entrypoint room to finish that work
# before failed checks count against the container.
HEALTHCHECK --interval=5s --timeout=3s --start-period=60s --retries=5 \
    CMD curl -fs http://127.0.0.1/up || exit 1

CMD ["/entrypoint.sh"]
