(() => {
  const storageKey = "e-absensi-prototype-v3";
  const students = [
    {
      id: "S-001",
      nisn: "0065748391",
      name: "Ahmad Fauzan",
      className: "XII RPL 1",
    },
    {
      id: "S-002",
      nisn: "0065748392",
      name: "Budi Santoso",
      className: "XII RPL 1",
    },
    {
      id: "S-003",
      nisn: "0065748393",
      name: "Citra Maharani",
      className: "XII RPL 1",
    },
    {
      id: "S-004",
      nisn: "0065748394",
      name: "Dimas Pratama",
      className: "XII RPL 1",
    },
    {
      id: "S-005",
      nisn: "0065748395",
      name: "Eko Saputra",
      className: "XII RPL 1",
    },
    {
      id: "S-006",
      nisn: "0065748396",
      name: "Nadia Putri",
      className: "XII RPL 1",
    },
  ];
  const sessions = [
    {
      id: 1,
      time: "07:00 - 08:00",
      subject: "Matematika",
      teacher: "Ahmad Fauzan, S.Pd.",
      room: "Lab RPL",
    },
    {
      id: 2,
      time: "08:00 - 09:00",
      subject: "Bahasa Indonesia",
      teacher: "Budi Santoso, S.Pd.",
      room: "Ruang 12",
    },
    {
      id: 3,
      time: "09:00 - 10:00",
      subject: "Pemrograman",
      teacher: "Rina Kartika, S.Kom.",
      room: "Lab RPL",
    },
    {
      id: 4,
      time: "10:15 - 11:15",
      subject: "Basis Data",
      teacher: "Ahmad Fauzan, S.Pd.",
      room: "Lab RPL",
    },
  ];
  const statusOptions = [
    "Hadir",
    "Terlambat",
    "Keluar Kelas",
    "Sakit",
    "Izin",
    "Alfa",
  ];
  const roleMenus = {
    admin: [
      ["dashboard", "▦", "Ringkasan"],
      ["barcode", "▦", "Scan QR"],
      ["monitoring", "◷", "Pemantauan"],
      ["classes", "▤", "Kelas & Rantai"],
      ["teachers", "♙", "Guru"],
      ["students", "♧", "Siswa"],
      ["schedule", "▦", "Jadwal Pelajaran"],
      ["report", "▤", "Rekap Absensi"],
      ["delegations", "⇄", "Delegasi"],
      ["settings", "⚙", "Pengaturan Absensi"],
      ["audit", "≡", "Audit Log"],
    ],
    teacher: [
      ["dashboard", "▦", "Dashboard"],
      ["schedule", "▦", "Jadwal Hari Ini"],
      ["report", "▤", "Rekap Absensi"],
      ["profile", "♙", "Profil"],
    ],
  };
  const screenTitles = {
    dashboard: "Ringkasan",
    barcode: "Scan QR Siswa",
    monitoring: "Pemantauan Hari Ini",
    classes: "Kelas & Rantai Kehadiran",
    teachers: "Data Guru",
    students: "Data Siswa",
    "student-profile": "Profil Siswa",
    report: "Rekap Absensi Guru",
    schedule: "Jadwal Pelajaran",
    delegations: "Delegasi Guru Pengganti",
    settings: "Pengaturan Absensi",
    audit: "Audit Log",
    history: "Riwayat Absensi",
    profile: "Profil Saya",
    session: "Verifikasi Absensi",
  };
  const initialStatuses = {
    1: ["Hadir", "Hadir", "Terlambat", "Hadir", "Hadir", "Belum Scan"],
    2: ["Hadir", "Hadir", "Terlambat", "Hadir", "Hadir", "Belum Scan"],
    3: ["Hadir", "Hadir", "Terlambat", "Hadir", "Hadir", "Belum Scan"],
    4: ["Hadir", "Hadir", "Terlambat", "Hadir", "Hadir", "Belum Scan"],
  };
  const initialState = () => ({
    role: "admin",
    settings: {
      opens: "06:00",
      starts: "07:00",
      lateLimit: "07:30",
      closes: "07:30",
      autoPass: 30,
    },
    attendance: structuredClone(initialStatuses),
    morningAttendance: Object.fromEntries(
      students.map((student, index) => [student.id, initialStatuses[1][index]]),
    ),
    studentPhotos: {},
    lastScan: null,
    locked: [],
    autoPassed: [],
    activity: [
      {
        who: "Sistem",
        action: "Baseline gerbang tersedia",
        detail: "XII RPL 1 · status awal untuk Sesi 1",
        time: "07.00",
      },
    ],
    delegations: [],
    teacherIdentity: "Ahmad Fauzan",
  });
  let state = loadState();
  let screen = "dashboard";
  let activeSession = 2;
  let selectedStudentId = students[0].id;
  let toastTimer;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return saved && saved.settings && saved.attendance
        ? saved
        : initialState();
    } catch {
      return initialState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      showToast(
        "Penyimpanan lokal tidak tersedia; perubahan hanya berlaku sementara.",
      );
    }
  }

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  function initials(name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function statusClass(status) {
    return (
      {
        Hadir: "status-present",
        Terlambat: "status-late",
        "Keluar Kelas": "status-left",
        Sakit: "status-sick",
        Izin: "status-excused",
        Alfa: "status-absent",
        "Belum Scan": "status-neutral",
        Terverifikasi: "status-verified",
        "Menunggu Verifikasi": "status-waiting",
        "Belum Dimulai": "status-neutral",
        "Auto-Pass": "status-late",
      }[status] || "status-neutral"
    );
  }

  function pill(status) {
    return `<span class="status-pill ${statusClass(status)}">${escapeHtml(status)}</span>`;
  }

  function logAction(who, action, detail) {
    const now = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    state.activity.unshift({ who, action, detail, time: now });
    state.activity = state.activity.slice(0, 12);
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2800);
  }

  function dateLabel() {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  function initialsAvatar(name) {
    return `<span class="person-avatar">${escapeHtml(initials(name))}</span>`;
  }

  function heading(title, subtitle, actions = "") {
    return `<div class="page-heading"><div><p class="eyebrow">${state.role === "teacher" ? "RUANG GURU" : "MTsS DARUL ULUM II"}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ""}</div>`;
  }

  function banner(
    text = "Data contoh tersimpan hanya di browser ini. Prototype ini belum terhubung ke akun atau server sekolah.",
  ) {
    return `<div class="demo-banner"><span class="banner-tag">DEMO</span><span>${text}</span></div>`;
  }

  function sessionState(sessionId) {
    if (state.autoPassed.includes(sessionId)) return "Auto-Pass";
    if (state.locked.includes(sessionId)) return "Terverifikasi";
    if (sessionCanStart(sessionId)) return "Menunggu Verifikasi";
    return "Belum Dimulai";
  }

  function sessionCanStart(sessionId) {
    return (
      sessionId === 1 ||
      state.locked.includes(sessionId - 1) ||
      state.autoPassed.includes(sessionId - 1)
    );
  }

  function teacherCanAccess(sessionId) {
    const session = sessions.find((item) => item.id === sessionId);
    return (
      session.teacher.startsWith(state.teacherIdentity) ||
      state.delegations.some(
        (delegation) =>
          delegation.substitute === state.teacherIdentity &&
          delegation.sessionId === sessionId,
      )
    );
  }

  function availableTeacherSessions() {
    return sessions.filter((item) => teacherCanAccess(item.id));
  }

  function renderNav() {
    const nav = roleMenus[state.role]
      .map(
        ([id, icon, label]) => `
      <button class="nav-link ${screen === id || (screen === "session" && id === "schedule") ? "active" : ""}" type="button" data-screen="${id}">
        <span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span>${id === "monitoring" && state.role === "admin" ? `<span class="nav-count">1</span>` : ""}
      </button>`,
      )
      .join("");
    document.getElementById("primaryNav").innerHTML = nav;
    document.getElementById("roleSelect").value = state.role;
    const identitySelect = document.getElementById("teacherIdentity");
    const identityLabel = document.getElementById("teacherIdentityLabel");
    identitySelect.hidden = state.role !== "teacher";
    identityLabel.hidden = state.role !== "teacher";
    identitySelect.value = state.teacherIdentity;
    document.getElementById("breadcrumbCurrent").textContent =
      screenTitles[screen] || "Ringkasan";
    document.getElementById("todayLabel").textContent = dateLabel();
  }

  function activityPanel() {
    return `<section class="panel"><div class="panel-header"><div><h2>Aktivitas Terbaru</h2><p>Perubahan pada prototype ini</p></div><button class="text-link" data-screen="audit">Lihat audit →</button></div><div class="activity-list">${state.activity
      .slice(0, 4)
      .map(
        (item) =>
          `<div class="activity-item"><span class="activity-mark"></span><div class="activity-copy"><strong>${escapeHtml(item.who)}</strong> · ${escapeHtml(item.action)}<small>${escapeHtml(item.detail)} · ${escapeHtml(item.time)}</small></div></div>`,
      )
      .join("")}</div></section>`;
  }

  function chainPanel() {
    return `<section class="panel"><div class="panel-header"><div><h2>Rantai Kehadiran</h2><p>XII RPL 1 · Hari ini</p></div><button class="text-link" data-screen="classes">Semua kelas →</button></div><div class="chain-list">${sessions
      .map((item, index) => {
        const current = sessionState(item.id);
        const completed =
          current === "Terverifikasi" || current === "Auto-Pass";
        const progress = completed
          ? 100
          : current === "Menunggu Verifikasi"
            ? 42
            : 0;
        const progressClass = completed
          ? "progress-done"
          : progress
            ? "progress-current"
            : "progress-empty";
        return `<div class="chain-row ${completed ? "is-done" : ""}"><span class="chain-number">${String(index + 1).padStart(2, "0")}</span><span class="chain-name"><strong>${escapeHtml(item.subject)}</strong><small>${item.time} · ${item.teacher.split(",")[0]}</small></span><span class="chain-progress"><span class="${progressClass}"></span></span>${pill(current)}</div>`;
      })
      .join("")}</div></section>`;
  }

  function statusSummary() {
    const lastCompleted = [...sessions]
      .reverse()
      .find(
        (item) =>
          state.locked.includes(item.id) || state.autoPassed.includes(item.id),
      );
    const latest = state.attendance[lastCompleted ? lastCompleted.id : 1];
    const totals = { Hadir: 0, Terlambat: 0, Sakit: 0, Lainnya: 0 };
    latest.forEach((status) => {
      if (status === "Hadir") totals.Hadir++;
      else if (status === "Terlambat") totals.Terlambat++;
      else if (status === "Sakit") totals.Sakit++;
      else totals.Lainnya++;
    });
    const denominator = latest.length || 1;
    const present = Math.round(
      ((totals.Hadir + totals.Terlambat) / denominator) * 100,
    );
    const band = Math.min(100, Math.max(0, Math.round(present / 10) * 10));
    return `<section class="panel"><div class="panel-header"><div><h2>Ringkasan Kehadiran</h2><p>Data sesi terverifikasi</p></div><span class="status-pill status-neutral">XII RPL 1</span></div><div class="attendance-summary"><div class="donut band-${band}"><div class="donut-label"><strong>${present}%</strong><small>kehadiran</small></div></div><div class="legend"><div class="legend-row"><span class="legend-swatch green"></span>Hadir<strong>${totals.Hadir}</strong></div><div class="legend-row"><span class="legend-swatch amber"></span>Terlambat<strong>${totals.Terlambat}</strong></div><div class="legend-row"><span class="legend-swatch blue"></span>Sakit / Izin<strong>${totals.Sakit}</strong></div><div class="legend-row"><span class="legend-swatch gray"></span>Belum hadir<strong>${totals.Lainnya}</strong></div></div></div></section>`;
  }

  function studentTable() {
    const statuses = state.attendance[1];
    return `<section class="panel"><div class="panel-header"><div><h2>Absensi Sesi 1</h2><p>Baseline dari scan barcode oleh admin</p></div><button class="text-link" data-screen="monitoring">Buka pemantauan →</button></div><div class="table-wrap"><table><thead><tr><th>SISWA</th><th>NISN</th><th>KELAS</th><th>SCAN PAGI</th><th>SESI 1</th></tr></thead><tbody>${students
      .slice(0, 5)
      .map(
        (student, index) =>
          `<tr><td><div class="person">${initialsAvatar(student.name)}<span><strong>${student.name}</strong><small>${student.id}</small></span></div></td><td>${student.nisn}</td><td>${student.className}</td><td>${pill(state.morningAttendance[student.id])}</td><td>${pill(statuses[index])}</td></tr>`,
      )
      .join("")}</tbody></table></div></section>`;
  }

  function adminDashboard() {
    const actions = `<button class="button button-secondary" data-screen="report">Rekap Excel</button><button class="button button-primary" data-screen="barcode">▥ Scan barcode</button>`;
    return `${heading("Selamat pagi, Administrator", "Pantau kehadiran dan progres sesi sekolah hari ini.", actions)}${banner()}<div class="metric-grid">
      <article class="metric-card"><div class="metric-top"><span>Total siswa</span><span class="metric-icon">♧</span></div><div class="metric-value">1.284</div><div class="metric-foot"><span class="up">↑ 24</span> dari semester lalu</div></article>
      <article class="metric-card"><div class="metric-top"><span>Guru aktif</span><span class="metric-icon">♙</span></div><div class="metric-value">56</div><div class="metric-foot">4 sesi dijadwalkan pagi ini</div></article>
      <article class="metric-card"><div class="metric-top"><span>Kelas berjalan</span><span class="metric-icon">▤</span></div><div class="metric-value">32</div><div class="metric-foot">Tahun ajaran 2026/2027</div></article>
      <article class="metric-card"><div class="metric-top"><span>Kehadiran hari ini</span><span class="metric-icon">◷</span></div><div class="metric-value">93,4%</div><div class="metric-foot"><span class="up">+2,1%</span> dibanding kemarin</div></article>
    </div><div class="dashboard-grid">${chainPanel()}${statusSummary()}</div><div class="subgrid">${studentTable()}${activityPanel()}</div>`;
  }

  function teacherDashboard() {
    const assigned = availableTeacherSessions();
    const identity = state.teacherIdentity;
    const greeting = identity.startsWith("Ahmad")
      ? "Pak Ahmad"
      : identity.startsWith("Budi")
        ? "Pak Budi"
        : identity.startsWith("Dedi")
          ? "Pak Dedi"
          : "Bu Rina";
    const isSubstitute = state.delegations.some(
      (entry) => entry.substitute === identity,
    );
    const cards = assigned
      .map((item) => {
        const locked = state.locked.includes(item.id);
        const ready = sessionCanStart(item.id);
        const substitute = state.delegations.some(
          (entry) =>
            entry.substitute === identity && entry.sessionId === item.id,
        );
        const action = locked
          ? "Sesi terkunci"
          : ready
            ? "Buka absensi →"
            : "Menunggu sesi sebelumnya";
        return `<article class="schedule-card"><div class="schedule-time">${item.time}</div><h3>${item.subject}</h3><p>XII RPL 1 · ${item.room}${substitute ? " · Pengganti" : ""}</p><div class="schedule-meta"><span>6 siswa demo</span>${pill(sessionState(item.id))}</div><button class="button button-primary open-session schedule-action" data-session="${item.id}" ${locked || !ready ? "disabled" : ""}>${action}</button></article>`;
      })
      .join("");
    return `${heading(`Selamat pagi, ${greeting}`, "Jadwal mengajar dan sesi yang perlu diverifikasi.", `<span class="status-pill status-ready">${isSubstitute ? "GURU · PENGGANTI" : "GURU"}</span>`)}${banner("Anda hanya dapat membuka sesi yang ditugaskan kepada identitas guru demo ini. Status hanya tersimpan di browser.")}<section class="panel teacher-schedule-panel"><div class="panel-header"><div><h2>Jadwal Hari Ini</h2><p>${assigned.length} sesi tersedia · XII RPL 1</p></div><button class="text-link" data-screen="report">Rekap absensi →</button></div><div class="schedule-grid">${cards || `<div class="empty-state">Belum ada sesi yang ditugaskan untuk identitas ini.</div>`}</div></section>${activityPanel()}`;
  }

  function sessionScreen() {
    const item = sessions.find((entry) => entry.id === activeSession);
    const values = state.attendance[activeSession];
    const locked = state.locked.includes(activeSession);
    const correctionPanel =
      state.role === "admin" && locked
        ? `<section class="panel correction-panel"><div class="panel-header"><div><h2>Koreksi Administrator</h2><p>Sesi terkunci tidak dibuka kembali; perubahan tercatat terpisah.</p></div></div><form class="correction-form" id="correctionForm"><div class="form-field"><label for="correctionStudent">Siswa</label><select id="correctionStudent">${students.map((student, index) => `<option value="${index}">${student.name}</option>`).join("")}</select></div><div class="form-field"><label for="correctionStatus">Status koreksi</label><select id="correctionStatus">${statusOptions.map((status) => `<option>${status}</option>`).join("")}</select></div><div class="form-field"><label for="correctionReason">Alasan wajib</label><input id="correctionReason" required maxlength="160" placeholder="Contoh: surat izin diterima"></div><button class="button button-warning" type="submit">Simpan koreksi</button></form></section>`
        : "";
    return `${heading(`${item.subject} · XII RPL 1`, `Sesi ${item.id} · ${item.time} · ${item.room}`, `<button class="button button-secondary" data-screen="schedule">← Kembali ke jadwal</button>`)}${banner("Status awal diwarisi dari sesi sebelumnya. Koreksi hanya mengganti kondisi siswa pada sesi ini.")}<div class="session-layout"><section class="panel"><div class="session-toolbar"><p><strong>${students.length} siswa</strong> · Status awal dari ${activeSession === 1 ? "gerbang pagi" : `Sesi ${activeSession - 1}`}</p>${pill(locked ? "Terverifikasi" : "Menunggu Verifikasi")}</div><div class="attendance-list">${students.map((student, index) => `<div class="attendance-row"><span class="row-number">${String(index + 1).padStart(2, "0")}</span><span class="person">${initialsAvatar(student.name)}<span><strong>${student.name}</strong><small>${student.id}</small></span></span><select aria-label="Status ${student.name}" data-attendance-index="${index}" ${locked || state.role === "admin" ? "disabled" : ""}>${[...new Set([...statusOptions, values[index]])].map((status) => `<option ${status === values[index] ? "selected" : ""}>${status}</option>`).join("")}</select></div>`).join("")}</div><div class="session-footer"><small>${locked ? "Sesi terkunci. Koreksi memerlukan alasan administrator." : "Pastikan daftar sudah diperiksa sebelum dikunci."}</small><button class="button button-primary" data-action="verify-session" ${locked || state.role === "admin" ? "disabled" : ""}>✓ Verifikasi & Kunci</button></div></section><aside class="panel"><div class="session-info"><h3>Detail Sesi</h3><div class="info-line"><span>Pengajar</span><strong>${item.teacher.split(",")[0]}</strong></div><div class="info-line"><span>Mata pelajaran</span><strong>${item.subject}</strong></div><div class="info-line"><span>Kelas</span><strong>XII RPL 1</strong></div><div class="info-line"><span>Status</span>${pill(locked ? "Terverifikasi" : "Menunggu Verifikasi")}</div><div class="inherit-note">Setelah dikunci, status sesi ini menjadi status awal untuk sesi berikutnya. Riwayat sesi sebelumnya tidak berubah.</div></div></aside></div>${correctionPanel}`;
  }

  function monitoringScreen() {
    return `${heading("Pemantauan Hari Ini", "Pantau kondisi sesi dan rantai kehadiran per kelas.", `<button class="button button-warning" data-action="simulate-auto-pass">Simulasikan Auto-Pass</button>`)}${banner("Auto-Pass dihitung dari waktu mulai jadwal + durasi pengaturan. Tombol di sini hanya simulasi alur, bukan proses otomatis server.")}<div class="dashboard-grid">${chainPanel()}${statusSummary()}</div>${studentTable()}`;
  }

  function genericTable(title, subtitle, headers, rows, action = "") {
    return `${heading(title, subtitle, action)}${banner()}<section class="panel"><div class="panel-header"><div><h2>${title}</h2><p>${rows.length} data contoh</p></div><input class="search-field" type="search" placeholder="Cari..." aria-label="Cari data"></div><div class="table-wrap"><table><thead><tr>${headers.map((head) => `<th>${head}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div></section>`;
  }

  function classesScreen() {
    return `${heading("Kelas & Rantai Kehadiran", "Pilih kelas untuk melihat status berantai setiap sesi.")}${banner()}<div class="dashboard-grid">${chainPanel()}${statusSummary()}</div>${genericTable(
      "Daftar Kelas",
      "Kelas aktif tahun ajaran ini",
      ["KELAS", "WALI KELAS", "JUMLAH SISWA", "PROGRES RANTAI"],
      ["XII RPL 1", "XII RPL 2", "XI RPL 1", "XI TKJ 1"].map(
        (name, index) =>
          `<tr><td><strong>${name}</strong></td><td>${["Siti Rahma, S.Pd.", "Dedi Firmansyah, S.Kom.", "Rina Kartika, S.Kom.", "Nina Lestari, S.Pd."][index]}</td><td>${[32, 31, 34, 30][index]} siswa</td><td>${pill(index === 0 ? "Menunggu Verifikasi" : "Belum Dimulai")}</td></tr>`,
      ),
    )}`;
  }

  function teachersScreen() {
    return genericTable(
      "Data Guru",
      "Pengelolaan akun guru · kata sandi asli tidak dapat dilihat",
      ["NAMA GURU", "MATA PELAJARAN", "SESI HARI INI", "STATUS AKUN"],
      [
        "Ahmad Fauzan, S.Pd.",
        "Budi Santoso, S.Pd.",
        "Rina Kartika, S.Kom.",
        "Dedi Firmansyah, S.Kom.",
      ].map(
        (name, index) =>
          `<tr><td><div class="person">${initialsAvatar(name)}<strong>${name}</strong></div></td><td>${["Matematika", "Bahasa Indonesia", "Pemrograman", "Basis Data"][index]}</td><td>${index + 1} sesi</td><td>${pill("Hadir")}</td></tr>`,
      ),
      `<button class="button button-primary" data-action="demo-add">＋ Tambah guru</button>`,
    );
  }

  function studentsScreen() {
    const rows = students.map(
      (student) =>
        `<tr data-student-row="${student.id}"><td data-label="Siswa"><div class="person">${initialsAvatar(student.name)}<strong>${student.name}</strong></div></td><td data-label="NISN">${student.nisn}</td><td data-label="Kelas">${student.className}</td><td data-label="Scan pagi">${pill(state.morningAttendance[student.id])}</td><td data-label="Kartu"><button class="button button-secondary" data-student-profile="${student.id}">Profil & QR</button></td></tr>`,
    );
    return `${heading("Data Siswa", "Profil siswa, NISN, kelas, dan QR identitas.", `<button class="button button-primary" data-action="demo-add">＋ Tambah siswa</button>`)}${banner("Data contoh tersimpan lokal. Foto yang diunggah hanya disimpan pada browser ini.")}<section class="panel"><div class="panel-header"><div><h2>Daftar Siswa</h2><p>${students.length} profil contoh</p></div><input class="search-field" type="search" id="studentSearch" placeholder="Cari nama atau NISN..." aria-label="Cari siswa"></div><div class="table-wrap student-table-wrap"><table class="student-list-table"><thead><tr><th>NAMA SISWA</th><th>NISN</th><th>KELAS</th><th>SCAN PAGI</th><th>KARTU</th></tr></thead><tbody>${rows.join("")}</tbody></table></div></section>`;
  }

  function barcodeScreen() {
    const scan = state.lastScan;
    const currentTime =
      state.scanClock ||
      (() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      })();
    return `${heading("Scan QR Siswa", "Admin mencatat kehadiran pagi dari QR Code pada kartu siswa.")}${banner("Gunakan scanner QR 2D USB yang mengirim hasil sebagai ketikan, lalu arahkan fokus ke kolom NISN. Isi QR adalah NISN 10 digit.")}<div class="scan-layout"><section class="panel scan-panel"><div class="panel-header"><div><h2>Pemindai Kehadiran</h2><p>QR Code 2D · NISN 10 digit</p></div><span class="status-pill status-ready">ADMIN</span></div><form id="barcodeForm" class="barcode-form"><label for="barcodeInput">NISN dari QR Code</label><div class="barcode-input-row"><input id="barcodeInput" name="nisn" type="text" inputmode="numeric" autocomplete="off" pattern="[0-9]{10}" maxlength="10" placeholder="Scan QR atau masukkan NISN" required autofocus><button class="button button-primary" type="submit">Catat hadir</button></div><div class="scan-options"><label for="scanClock">Waktu scan</label><input id="scanClock" type="time" value="${currentTime}"><span>Buka ${state.settings.opens} · mulai ${state.settings.starts} · setelah mulai = terlambat</span></div></form>${scan ? `<div class="last-scan"><div class="last-scan-avatar">${initials(scan.name)}</div><div><span class="eyebrow">SCAN TERAKHIR · ${escapeHtml(scan.time)}</span><strong>${escapeHtml(scan.name)}</strong><small>NISN ${escapeHtml(scan.nisn)} · ${escapeHtml(scan.className)}</small></div><div class="last-scan-status">${pill(scan.status)}</div></div>` : `<div class="scan-empty"><span class="scan-symbol">▦</span><strong>Siap memindai</strong><small>Hasil scan akan muncul di sini.</small></div>`}</section><aside class="panel scan-rules"><div class="panel-header"><div><h2>Aturan kehadiran</h2></div></div><div class="session-info"><div class="info-line"><span>Absensi dibuka</span><strong>${state.settings.opens}</strong></div><div class="info-line"><span>Hadir sebelum mulai</span><strong>${state.settings.starts}</strong></div><div class="info-line"><span>Setelah mulai</span><strong>Terlambat</strong></div><div class="info-line"><span>Setelah tutup normal</span><strong>Tetap dicatat terlambat</strong></div><div class="inherit-note">Scan menjadi baseline Sesi 1 selama sesi belum dikunci. Data demo tidak tersinkron ke server.</div></div></aside></div>`;
  }

  function studentProfileScreen() {
    const student =
      students.find((entry) => entry.id === selectedStudentId) || students[0];
    const photo = state.studentPhotos[student.id];
    const barcodeUrl = `/student/barcode/${student.nisn}`;
    return `${heading("Profil Siswa", "Kartu identitas siswa dengan QR Code 2D untuk dicetak.", `<button class="button button-secondary" data-screen="students">← Kembali ke siswa</button>`)}${banner("QR Code berisi NISN siswa. Sisakan ruang putih di sekeliling kode saat mencetak.")}<article class="student-profile-card"><div class="profile-card-brand"><span class="brand-mark" aria-hidden="true">e</span><span><strong>MTsS Darul Ulum II</strong><small>KARTU IDENTITAS SISWA</small></span></div><div class="profile-card-main"><div class="profile-photo-wrap">${photo ? `<img class="profile-photo" src="${escapeHtml(photo)}" alt="Foto ${escapeHtml(student.name)}">` : `<div class="profile-photo-placeholder">${initials(student.name)}<small>FOTO SISWA</small></div>`}<label class="button button-secondary upload-photo-button" for="studentPhotoInput">Pilih foto</label><input id="studentPhotoInput" class="visually-hidden" type="file" accept="image/*"></div><div class="profile-details"><p class="eyebrow">DATA SISWA</p><h2>${escapeHtml(student.name)}</h2><div class="profile-data-row"><span>NISN</span><strong>${student.nisn}</strong></div><div class="profile-data-row"><span>Kelas</span><strong>${escapeHtml(student.className)}</strong></div><div class="profile-data-row"><span>ID internal</span><strong>${escapeHtml(student.id)}</strong></div></div></div><div class="profile-barcode"><img src="${barcodeUrl}" alt="QR Code untuk NISN ${student.nisn}"><strong>${student.nisn}</strong><small>QR CODE 2D · SCAN UNTUK ABSENSI</small></div><div class="student-profile-actions"><button class="button button-primary" data-action="print-student">Cetak kartu</button></div></article>`;
  }

  function reportScreen() {
    const reportSessions = sessions.filter(
      (item) => state.role !== "teacher" || teacherCanAccess(item.id),
    );
    const reportRows = reportSessions.flatMap((session) =>
      students.map(
        (student, index) =>
          `<tr><td>${session.time.split(" - ")[0]}</td><td>${escapeHtml(session.teacher.split(",")[0])}</td><td>${escapeHtml(session.subject)}</td><td>XII RPL 1</td><td>${student.nisn}</td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(state.attendance[session.id][index])}</td><td>${escapeHtml(sessionState(session.id))}</td></tr>`,
      ),
    );
    const action = `<button class="button button-primary" data-action="export-report">Unduh Excel (.csv)</button>`;
    return `${heading("Rekap Absensi Guru", "Rekap status siswa per guru, mata pelajaran, sesi, dan NISN.", action)}${banner("File CSV memakai UTF-8 dan pemisah titik koma agar dapat langsung dibuka di Microsoft Excel. Data yang diekspor berasal dari prototype lokal.")}<section class="panel"><div class="panel-header"><div><h2>Rekap Hari Ini</h2><p>${reportSessions.length} sesi · ${reportRows.length} baris absensi</p></div><span class="status-pill status-neutral">${state.role === "teacher" ? "SESI SAYA" : "SEMUA GURU"}</span></div><div class="table-wrap"><table><thead><tr><th>WAKTU</th><th>GURU</th><th>MAPEL</th><th>KELAS</th><th>NISN</th><th>NAMA SISWA</th><th>STATUS</th><th>STATUS SESI</th></tr></thead><tbody>${reportRows.map((row) => row).join("")}</tbody></table></div></section>`;
  }

  function csvCell(value) {
    let text = String(value);
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportReport() {
    const reportSessions = sessions.filter(
      (item) => state.role !== "teacher" || teacherCanAccess(item.id),
    );
    const rows = [
      [
        "Waktu",
        "Guru",
        "Mata Pelajaran",
        "Kelas",
        "NISN",
        "Nama Siswa",
        "Status Kehadiran",
        "Status Sesi",
      ],
    ];
    reportSessions.forEach((session) => {
      students.forEach((student, index) => {
        rows.push([
          session.time.split(" - ")[0],
          session.teacher.split(",")[0],
          session.subject,
          student.className,
          student.nisn,
          student.name,
          state.attendance[session.id][index],
          sessionState(session.id),
        ]);
      });
    });
    const csv = `\uFEFFsep=;\r\n${rows
      .map((row, rowIndex) =>
        row
          .map((value, columnIndex) => {
            if (
              rowIndex > 0 &&
              columnIndex === 4 &&
              /^\d{10}$/.test(String(value))
            ) {
              return `="${value}"`;
            }
            return csvCell(value);
          })
          .join(";"),
      )
      .join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-absensi-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Rekap Excel-compatible berhasil diunduh.");
  }

  function scheduleScreen() {
    return `${heading("Jadwal Pelajaran", "XII RPL 1 · Senin, 27 September 2026", `<button class="button button-secondary" data-action="demo-add">＋ Tambah jadwal</button>`)}${banner()}<section class="panel"><div class="table-wrap"><table><thead><tr><th>SESI</th><th>WAKTU</th><th>MATA PELAJARAN</th><th>KELAS</th><th>GURU</th><th>STATUS</th><th>DETAIL</th></tr></thead><tbody>${sessions.map((item) => `<tr><td>Sesi ${item.id}</td><td>${item.time}</td><td><strong>${item.subject}</strong></td><td>XII RPL 1</td><td>${item.teacher.split(",")[0]}</td><td>${pill(sessionState(item.id))}</td><td><button class="button button-secondary" data-admin-session="${item.id}">Lihat sesi</button></td></tr>`).join("")}</tbody></table></div></section>`;
  }

  function delegationScreen() {
    const rows = state.delegations
      .map(
        (entry) =>
          `<tr><td>${escapeHtml(entry.substitute)}</td><td>${escapeHtml(entry.subject)}</td><td>${escapeHtml(entry.session)}</td><td>${pill("Hadir")}</td></tr>`,
      )
      .join("");
    return `${heading("Delegasi Guru Pengganti", "Tetapkan pengganti untuk sesi tertentu menggunakan akun masing-masing.")}${banner("Pengganti hanya dapat mengakses sesi yang didelegasikan. Tidak ada berbagi akun atau kata sandi.")}<div class="subgrid"><section class="panel"><div class="panel-header"><div><h2>Buat delegasi</h2><p>Semua pilihan hanya data demo</p></div></div><form id="delegationForm"><div class="form-grid"><div class="form-field"><label for="substituteName">Guru pengganti</label><select id="substituteName"><option>Budi Santoso</option><option>Rina Kartika</option><option>Dedi Firmansyah</option></select></div><div class="form-field"><label for="delegationSession">Sesi</label><select id="delegationSession">${sessions.map((item) => `<option value="${item.id}">Sesi ${item.id} · ${item.subject}</option>`).join("")}</select></div><div class="form-field"><label for="originalTeacher">Guru berhalangan</label><select id="originalTeacher"><option>Ahmad Fauzan</option><option>Budi Santoso</option><option>Rina Kartika</option></select></div><div class="form-field"><label for="delegationDate">Tanggal</label><input id="delegationDate" type="date" value="2026-09-27"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Simpan delegasi</button></div></form></section><section class="panel"><div class="panel-header"><div><h2>Delegasi aktif</h2><p>${state.delegations.length} sesi didelegasikan</p></div></div><div class="table-wrap"><table><thead><tr><th>PENGGANTI</th><th>MAPEL</th><th>SESI</th><th>STATUS</th></tr></thead><tbody>${rows || `<tr><td colspan="4" class="empty-state">Belum ada delegasi aktif.</td></tr>`}</tbody></table></div></section></div>`;
  }

  function settingsScreen() {
    return `${heading("Pengaturan Absensi", "Atur batas waktu sekolah dan durasi Auto-Pass.")}${banner("Perubahan ini hanya mengubah demonstrasi lokal. Aturan produksi harus divalidasi sebelum digunakan.")}<section class="panel"><div class="panel-header"><div><h2>Aturan waktu pagi</h2><p>Jam menggunakan waktu lokal sekolah</p></div></div><form id="settingsForm"><div class="form-grid"><div class="form-field"><label for="opens">Absensi dibuka</label><input id="opens" type="time" value="${state.settings.opens}" required></div><div class="form-field"><label for="starts">Jam mulai sekolah</label><input id="starts" type="time" value="${state.settings.starts}" required></div><div class="form-field"><label for="lateLimit">Batas terlambat</label><input id="lateLimit" type="time" value="${state.settings.lateLimit}" required></div><div class="form-field"><label for="closes">Jam tutup normal</label><input id="closes" type="time" value="${state.settings.closes}" required></div><div class="form-field"><label for="autoPass">Auto-Pass setelah jadwal</label><select id="autoPass">${[15, 30, 45, 60].map((minute) => `<option value="${minute}" ${Number(state.settings.autoPass) === minute ? "selected" : ""}>${minute} menit</option>`).join("")}</select></div></div><div class="form-actions"><button class="button button-primary" type="submit">Simpan pengaturan demo</button></div></form></section>`;
  }

  function auditScreen() {
    return genericTable(
      "Audit Log",
      "Jejak aktivitas prototype untuk demonstrasi",
      ["WAKTU", "PELAKU", "TINDAKAN", "KETERANGAN"],
      state.activity.map(
        (entry) =>
          `<tr><td>${escapeHtml(entry.time)}</td><td><strong>${escapeHtml(entry.who)}</strong></td><td>${escapeHtml(entry.action)}</td><td>${escapeHtml(entry.detail)}</td></tr>`,
      ),
    );
  }

  function historyScreen() {
    return `${heading("Riwayat Absensi", "Riwayat sesi yang ditugaskan kepada Anda.")}${banner()}<section class="panel"><div class="table-wrap"><table><thead><tr><th>TANGGAL</th><th>SESI</th><th>KELAS</th><th>MATA PELAJARAN</th><th>STATUS</th></tr></thead><tbody>${
      sessions
        .filter((item) => state.role !== "teacher" || teacherCanAccess(item.id))
        .filter(
          (item) =>
            state.locked.includes(item.id) ||
            state.autoPassed.includes(item.id),
        )
        .map(
          (item) =>
            `<tr><td>27 Sep 2026</td><td>Sesi ${item.id}</td><td>XII RPL 1</td><td>${item.subject}</td><td>${pill(sessionState(item.id))}</td></tr>`,
        )
        .join("") ||
      `<tr><td colspan="5" class="empty-state">Belum ada sesi selesai.</td></tr>`
    }</tbody></table></div></section>`;
  }

  function profileScreen() {
    const name = state.teacherIdentity;
    const email = `${name.toLocaleLowerCase("id-ID").replaceAll(" ", ".")}@sekolah.sch.id`;
    const substitute = state.delegations.some(
      (entry) => entry.substitute === name,
    );
    return `${heading("Profil Saya", "Informasi akun prototype guru.")}${banner("Akun dan autentikasi belum diaktifkan pada prototype UI ini.")}<section class="panel session-info"><div class="person">${initialsAvatar(name)}<div><strong>${escapeHtml(name)}</strong><small>Guru · Jadwal sesuai penugasan</small></div></div><div class="info-line"><span>Email</span><strong>${escapeHtml(email)}</strong></div><div class="info-line"><span>Peran</span><strong>${substitute ? "Guru · Pengganti" : "Guru"}</strong></div><div class="info-line"><span>Akses delegasi</span><strong>Sesuai penugasan</strong></div></section>`;
  }

  function render() {
    renderNav();
    const screens = {
      dashboard: state.role === "teacher" ? teacherDashboard : adminDashboard,
      barcode: barcodeScreen,
      monitoring: monitoringScreen,
      classes: classesScreen,
      teachers: teachersScreen,
      students: studentsScreen,
      "student-profile": studentProfileScreen,
      report: reportScreen,
      schedule: state.role === "teacher" ? teacherDashboard : scheduleScreen,
      delegations: delegationScreen,
      settings: settingsScreen,
      audit: auditScreen,
      history: historyScreen,
      profile: profileScreen,
      session: sessionScreen,
    };
    document.getElementById("appView").innerHTML = (
      screens[screen] || screens.dashboard
    )();
    if (screen === "barcode") {
      document.getElementById("barcodeInput")?.focus();
    }
  }

  function verifySession() {
    if (state.locked.includes(activeSession)) return;
    if (state.role !== "teacher" || !teacherCanAccess(activeSession)) {
      showToast("Identitas guru ini tidak ditugaskan ke sesi tersebut.");
      screen = "schedule";
      render();
      return;
    }
    if (!sessionCanStart(activeSession)) {
      showToast(
        "Sesi belum dapat diverifikasi sebelum sesi sebelumnya selesai.",
      );
      return;
    }
    const item = sessions.find((entry) => entry.id === activeSession);
    if (
      !window.confirm(
        `Verifikasi dan kunci ${item.subject} · Sesi ${activeSession}? Perubahan normal setelah ini tidak diizinkan.`,
      )
    )
      return;
    state.locked.push(activeSession);
    state.autoPassed = state.autoPassed.filter((id) => id !== activeSession);
    if (activeSession < sessions.length)
      state.attendance[activeSession + 1] = [
        ...state.attendance[activeSession],
      ];
    logAction(
      state.teacherIdentity,
      "Verifikasi & kunci",
      `XII RPL 1 · Sesi ${activeSession}`,
    );
    saveState();
    screen = "schedule";
    render();
    showToast(
      `Sesi ${activeSession} terkunci. Status diteruskan ke sesi berikutnya.`,
    );
  }

  document.addEventListener("click", (event) => {
    const navButton = event.target.closest("[data-screen]");
    if (navButton) {
      screen = navButton.dataset.screen;
      document.getElementById("sidebar").classList.remove("open");
      render();
      return;
    }
    const sessionButton = event.target.closest(".open-session");
    if (sessionButton) {
      activeSession = Number(sessionButton.dataset.session);
      if (state.role === "teacher" && !teacherCanAccess(activeSession)) {
        showToast("Sesi ini tidak ditugaskan ke identitas guru demo.");
        return;
      }
      if (state.role === "teacher" && !sessionCanStart(activeSession)) {
        showToast("Sesi menunggu sesi sebelumnya selesai.");
        return;
      }
      screen = "session";
      render();
      return;
    }
    const adminSessionButton = event.target.closest("[data-admin-session]");
    if (adminSessionButton && state.role === "admin") {
      activeSession = Number(adminSessionButton.dataset.adminSession);
      screen = "session";
      render();
      return;
    }
    const studentProfileButton = event.target.closest("[data-student-profile]");
    if (studentProfileButton) {
      selectedStudentId = studentProfileButton.dataset.studentProfile;
      screen = "student-profile";
      render();
      return;
    }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "verify-session") verifySession();
    if (action === "print-student") window.print();
    if (action === "export-report") exportReport();
    if (action === "reset-demo") {
      if (window.confirm("Reset seluruh perubahan prototype di browser ini?")) {
        localStorage.removeItem(storageKey);
        state = initialState();
        screen = "dashboard";
        render();
        showToast("Data demo dikembalikan ke kondisi awal.");
      }
    }
    if (action === "simulate-auto-pass") {
      const nextSession = sessions.find(
        (item) =>
          !state.locked.includes(item.id) &&
          !state.autoPassed.includes(item.id),
      );
      if (!nextSession) return showToast("Semua sesi contoh sudah selesai.");
      if (
        !window.confirm(
          `Simulasikan Auto-Pass Sesi ${nextSession.id}? Status terakhir akan diteruskan tanpa mengubah sesi sebelumnya.`,
        )
      )
        return;
      state.autoPassed.push(nextSession.id);
      if (nextSession.id < sessions.length)
        state.attendance[nextSession.id + 1] = [
          ...state.attendance[nextSession.id],
        ];
      logAction(
        "SISTEM (SIMULASI)",
        "Auto-Pass",
        `XII RPL 1 · Sesi ${nextSession.id}`,
      );
      saveState();
      render();
      showToast(`Auto-Pass Sesi ${nextSession.id} disimulasikan.`);
    }
    if (action === "demo-add")
      showToast("Form tambah data belum termasuk dalam prototype ini.");
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "roleSelect") {
      state.role = event.target.value;
      screen = "dashboard";
      saveState();
      render();
    }
    if (event.target.id === "teacherIdentity") {
      state.teacherIdentity = event.target.value;
      screen = "dashboard";
      saveState();
      render();
    }
    if (event.target.id === "studentPhotoInput") {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > 512 * 1024) {
        showToast("Pilih file gambar berukuran maksimal 512 KB.");
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        state.studentPhotos[selectedStudentId] = reader.result;
        saveState();
        render();
        showToast("Foto demo disimpan di browser ini.");
      });
      reader.readAsDataURL(file);
    }
    const index = event.target.dataset.attendanceIndex;
    if (index !== undefined && !state.locked.includes(activeSession)) {
      state.attendance[activeSession][Number(index)] = event.target.value;
      saveState();
      showToast(
        `${students[Number(index)].name}: status diperbarui untuk sesi ini.`,
      );
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id !== "studentSearch") return;
    const query = event.target.value.trim().toLocaleLowerCase("id-ID");
    document.querySelectorAll("[data-student-row]").forEach((row) => {
      row.hidden = !row.textContent.toLocaleLowerCase("id-ID").includes(query);
    });
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "barcodeForm") {
      event.preventDefault();
      if (state.role !== "admin") {
        showToast("Pemindaian barcode hanya tersedia untuk administrator.");
        return;
      }
      const code = document.getElementById("barcodeInput").value.trim();
      const time = document.getElementById("scanClock").value;
      const student = students.find((entry) => entry.nisn === code);
      if (!student) {
        showToast("Barcode tidak dikenali. Pastikan NISN siswa terdaftar.");
        document.getElementById("barcodeInput").select();
        return;
      }
      if (time < state.settings.opens) {
        showToast(`Absensi belum dibuka. Mulai ${state.settings.opens}.`);
        return;
      }
      const status = time <= state.settings.starts ? "Hadir" : "Terlambat";
      state.scanClock = time;
      state.morningAttendance[student.id] = status;
      if (!state.locked.includes(1)) {
        state.attendance[1] = students.map(
          (entry) => state.morningAttendance[entry.id],
        );
      }
      state.lastScan = {
        nisn: student.nisn,
        name: student.name,
        className: student.className,
        status,
        time,
      };
      logAction(
        "Administrator",
        "Scan barcode absensi",
        `${student.name} · ${status} · ${time}`,
      );
      saveState();
      render();
      document.getElementById("barcodeInput")?.focus();
      showToast(`${student.name} tercatat ${status.toLowerCase()}.`);
      return;
    }
    if (event.target.id === "settingsForm") {
      event.preventDefault();
      const nextSettings = {
        opens: document.getElementById("opens").value,
        starts: document.getElementById("starts").value,
        lateLimit: document.getElementById("lateLimit").value,
        closes: document.getElementById("closes").value,
        autoPass: Number(document.getElementById("autoPass").value),
      };
      if (
        nextSettings.opens >= nextSettings.starts ||
        nextSettings.starts > nextSettings.lateLimit ||
        nextSettings.lateLimit > nextSettings.closes
      ) {
        showToast(
          "Urutan waktu: buka < mulai sekolah ≤ batas terlambat ≤ tutup normal.",
        );
        return;
      }
      state.settings = nextSettings;
      logAction(
        "Administrator",
        "Ubah pengaturan waktu",
        `Auto-Pass ${state.settings.autoPass} menit`,
      );
      saveState();
      showToast("Pengaturan demo disimpan di browser ini.");
    }
    if (event.target.id === "delegationForm") {
      event.preventDefault();
      const sessionId = Number(
        document.getElementById("delegationSession").value,
      );
      const item = sessions.find((entry) => entry.id === sessionId);
      const substitute = document.getElementById("substituteName").value;
      state.delegations.push({
        substitute,
        subject: item.subject,
        session: `Sesi ${item.id} · XII RPL 1`,
        sessionId: item.id,
      });
      logAction(
        "Administrator",
        "Delegasi sesi",
        `${item.subject} · ${substitute}`,
      );
      saveState();
      render();
      showToast("Delegasi demo ditambahkan.");
    }
    if (event.target.id === "correctionForm") {
      event.preventDefault();
      if (state.role !== "admin" || !state.locked.includes(activeSession))
        return;
      const studentIndex = Number(
        document.getElementById("correctionStudent").value,
      );
      const correctedStatus = document.getElementById("correctionStatus").value;
      const reason = document.getElementById("correctionReason").value.trim();
      if (!reason) return showToast("Alasan koreksi wajib diisi.");
      state.attendance[activeSession][studentIndex] = correctedStatus;
      logAction(
        "Administrator",
        "Koreksi sesi terkunci",
        `${students[studentIndex].name} · ${correctedStatus} · Alasan: ${reason}`,
      );
      saveState();
      render();
      showToast("Koreksi tersimpan dan tercatat di audit.");
    }
  });

  document.getElementById("menuButton").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });
  render();
})();
