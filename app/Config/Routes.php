<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');
$routes->get('student/barcode/(:segment)', 'StudentBarcode::show/$1');
