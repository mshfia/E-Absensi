<?php

namespace App\Controllers;

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

class StudentBarcode extends BaseController
{
    public function show(string $nisn)
    {
        if (preg_match('/\A\d{10}\z/', $nisn) !== 1) {
            return $this->response->setStatusCode(404);
        }

        $options = new QROptions(['outputBase64' => false]);
        $svg = (new QRCode($options))->render($nisn);

        return $this->response
            ->setContentType('image/svg+xml')
            ->setHeader('Cache-Control', 'no-store')
            ->setBody($svg);
    }
}