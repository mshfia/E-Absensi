FROM composer:2 AS dependencies

WORKDIR /build
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --classmap-authoritative \
    --no-scripts

FROM php:8.3-fpm-alpine

RUN apk add --no-cache nginx icu-libs oniguruma supervisor \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev oniguruma-dev \
    && docker-php-ext-install intl mbstring mysqli opcache \
    && sed -i 's/^;clear_env = yes/clear_env = no/' /usr/local/etc/php-fpm.d/www.conf \
    && apk del .build-deps

WORKDIR /var/www/html

COPY . .
COPY --from=dependencies /build/vendor ./vendor
COPY docker/nginx.conf.template /etc/nginx/http.d/default.conf.template
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/container-entrypoint
COPY docker/php-production.ini /usr/local/etc/php/conf.d/99-production.ini

RUN mkdir -p /run/nginx /var/log/supervisor \
    writable/cache writable/logs writable/session writable/uploads writable/debugbar \
    && chown -R www-data:www-data writable \
    && chmod 755 /usr/local/bin/container-entrypoint

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/container-entrypoint"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]