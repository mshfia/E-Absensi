<!doctype html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#163b32">
    <meta name="description" content="Sistem e-absensi MTsS Darul Ulum II dengan Chain-Attendance.">
    <title>e-Absensi · MTsS Darul Ulum II</title>
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="icon" href="/pwa-icon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/app.css">
</head>
<body>
    <div class="app-shell">
        <aside class="sidebar" id="sidebar">
            <a class="brand" href="/" aria-label="e-Absensi beranda">
                <span class="brand-mark" aria-hidden="true">e</span>
                <span class="brand-copy"><strong>e-Absensi</strong><small>SEKOLAH</small></span>
            </a>

            <div class="school-switcher">
                <span class="school-emblem">DU</span>
                <span><strong>MTsS Darul Ulum II</strong><small>Tahun ajaran 2026/2027</small></span>
                <span class="chevron" aria-hidden="true">⌄</span>
            </div>

            <div class="nav-label">MENU UTAMA</div>
            <nav id="primaryNav" class="primary-nav" aria-label="Navigasi utama"></nav>

            <div class="sidebar-bottom">
                <div class="prototype-note"><span class="pulse-dot"></span><span><strong>Mode prototype</strong><small>Data contoh di perangkat ini</small></span></div>
                <button class="sidebar-help" type="button" data-action="reset-demo">↻ <span>Reset data demo</span></button>
            </div>
        </aside>

        <div class="workspace">
            <header class="topbar">
                <button class="icon-button menu-button" type="button" id="menuButton" aria-label="Buka navigasi">☰</button>
                <div class="breadcrumb"><span>MTsS Darul Ulum II</span><span aria-hidden="true">/</span><strong id="breadcrumbCurrent">Ringkasan</strong></div>
                <div class="topbar-actions">
                    <span class="today-label" id="todayLabel"></span>
                    <label class="role-select-label" for="roleSelect">Mode demo</label>
                    <select id="roleSelect" class="role-select" aria-label="Pilih peran untuk demo">
                        <option value="admin">Administrator</option>
                        <option value="teacher">Guru</option>
                    </select>
                    <label class="teacher-select-label" id="teacherIdentityLabel" for="teacherIdentity" hidden>Identitas</label>
                    <select id="teacherIdentity" class="role-select teacher-identity" aria-label="Pilih identitas guru demo" hidden>
                        <option value="Ahmad Fauzan">Ahmad Fauzan</option>
                        <option value="Budi Santoso">Budi Santoso</option>
                        <option value="Rina Kartika">Rina Kartika</option>
                        <option value="Dedi Firmansyah">Dedi Firmansyah</option>
                    </select>
                    <span class="install-app" id="installAppContainer"><button class="button button-primary" id="installApp" type="button">Pasang aplikasi</button></span>
                    <button class="avatar-button" type="button" aria-label="Profil demo">AR</button>
                </div>
            </header>

            <main class="main-content" id="appView" aria-live="polite"></main>
        </div>
    </div>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="prototype-ribbon">PROTOTYPE · Data bukan catatan absensi resmi</div>

    <script src="/pwa.js" defer></script>
    <script src="/app.js" defer></script>
</body>
</html>