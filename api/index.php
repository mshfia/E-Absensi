<?php

use CodeIgniter\Boot;
use Config\Paths;

$baseUrl        = getenv('APP_BASE_URL');
$encryptionKey  = getenv('ENCRYPTION_KEY');
$ciEnvironment = getenv('CI_ENVIRONMENT') ?: 'production';

if ($baseUrl === false || $encryptionKey === false || trim($encryptionKey) === '') {
    http_response_code(503);
    exit('Deployment environment is not configured.');
}

$baseUrlParts = parse_url($baseUrl);

if (
    $baseUrlParts === false
    || !isset($baseUrlParts['scheme'], $baseUrlParts['host'])
    || !in_array($baseUrlParts['scheme'], ['http', 'https'], true)
    || ($ciEnvironment === 'production' && $baseUrlParts['scheme'] !== 'https')
) {
    http_response_code(503);
    exit('Deployment environment is not configured.');
}

$decodedEncryptionKey = match (true) {
    str_starts_with($encryptionKey, 'base64:') => base64_decode(substr($encryptionKey, 7), true),
    str_starts_with($encryptionKey, 'hex2bin:') => hex2bin(substr($encryptionKey, 8)),
    default => $encryptionKey,
};

if (!is_string($decodedEncryptionKey) || strlen($decodedEncryptionKey) < 32) {
    http_response_code(503);
    exit('Deployment environment is not configured.');
}

$baseUrl = rtrim($baseUrl, '/') . '/';

$publicDirectory = realpath(dirname(__DIR__) . '/public');

if ($publicDirectory === false) {
    http_response_code(500);
    exit('Application public directory is missing.');
}

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestPath   = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if (in_array($requestMethod, ['GET', 'HEAD'], true) && is_string($requestPath) && $requestPath !== '/') {
    $relativePath = rawurldecode(ltrim($requestPath, '/'));
    $segments     = explode('/', $relativePath);
    $hasHiddenSegment = false;

    foreach ($segments as $segment) {
        if (str_starts_with($segment, '.')) {
            $hasHiddenSegment = true;
            break;
        }
    }

    if (!$hasHiddenSegment && !str_contains($relativePath, "\0")) {
        $filePath = realpath($publicDirectory . DIRECTORY_SEPARATOR . $relativePath);
        $publicPrefix = rtrim($publicDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;

        if (
            $filePath !== false
            && str_starts_with($filePath, $publicPrefix)
            && is_file($filePath)
        ) {
            $contentTypes = [
                'css'         => 'text/css; charset=utf-8',
                'ico'         => 'image/vnd.microsoft.icon',
                'js'          => 'application/javascript; charset=utf-8',
                'png'         => 'image/png',
                'svg'         => 'image/svg+xml',
                'txt'         => 'text/plain; charset=utf-8',
                'webmanifest' => 'application/manifest+json; charset=utf-8',
            ];
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

            if (isset($contentTypes[$extension])) {
                header('Content-Type: ' . $contentTypes[$extension]);
                header('X-Content-Type-Options: nosniff');
                header($extension === 'js' && basename($filePath) === 'service-worker.js'
                    ? 'Cache-Control: no-cache, max-age=0, must-revalidate'
                    : 'Cache-Control: public, max-age=3600');
                header('Content-Length: ' . filesize($filePath));

                if ($requestMethod !== 'HEAD') {
                    readfile($filePath);
                }

                exit;
            }
        }
    }
}

define('FCPATH', $publicDirectory . DIRECTORY_SEPARATOR);
$_SERVER['DOCUMENT_ROOT']  = FCPATH;
$_SERVER['SCRIPT_FILENAME'] = FCPATH . 'index.php';
$_SERVER['SCRIPT_NAME']     = '/index.php';
$_SERVER['PHP_SELF']        = '/index.php';

$_ENV['app_baseURL'] = $baseUrl;
$_SERVER['app_baseURL'] = $baseUrl;
$_ENV['encryption_key'] = $encryptionKey;
$_SERVER['encryption_key'] = $encryptionKey;

putenv('CI_ENVIRONMENT=' . $ciEnvironment);
$_ENV['CI_ENVIRONMENT'] = $ciEnvironment;
$_SERVER['CI_ENVIRONMENT'] = $ciEnvironment;

chdir(FCPATH);
require FCPATH . '../app/Config/Paths.php';

$paths = new Paths();

if (getenv('VERCEL') !== false) {
    $paths->writableDirectory = sys_get_temp_dir() . '/e-absensi-writable';

    foreach (['cache', 'debugbar', 'logs', 'session', 'uploads'] as $directory) {
        $path = $paths->writableDirectory . DIRECTORY_SEPARATOR . $directory;

        if (!is_dir($path)) {
            mkdir($path, 0700, true);
        }
    }
}

require $paths->systemDirectory . '/Boot.php';

exit(Boot::bootWeb($paths));