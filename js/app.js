/* ============================================================
   ABSENSI SEKOLAH — app.js
   Penyimpanan data memakai localStorage (offline, tanpa server)
   ============================================================ */

const DB_KEY = "absensi_db_v1";

const defaultDB = {
  setting: {
    namaSekolah: "Nama Sekolah Anda",
    alamat: "",
    logo: "",          // base64 image
    warnaTema: "#2563eb"
  },
  admin: {
    username: "admin",
    password: "admin123"
  },
  siswa: [
    // {id, nama, kelas, nis}
  ],
  absensi: [
    // {id, tanggal:'YYYY-MM-DD', siswaId, nama, kelas, status, waktu}
  ]
};

function loadDB(){
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(!raw) return structuredClone(defaultDB);
    const parsed = JSON.parse(raw);
    // merge supaya field baru tetap ada kalau db lama belum punya
    return { ...structuredClone(defaultDB), ...parsed,
      setting: { ...defaultDB.setting, ...(parsed.setting||{}) },
      admin: { ...defaultDB.admin, ...(parsed.admin||{}) }
    };
  }catch(e){
    console.error("Gagal load DB, pakai default.", e);
    return structuredClone(defaultDB);
  }
}
function saveDB(){
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

let db = loadDB();

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
function todayStr(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}
function formatTanggalIndo(isoDate){
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const [y,m,d] = isoDate.split('-').map(Number);
  return `${d} ${bulan[m-1]} ${y}`;
}

/* ============================================================
   THEME / IDENTITY RENDERING
   ============================================================ */
function applyTheme(){
  document.documentElement.style.setProperty('--c-primary', db.setting.warnaTema);
  // hitung versi gelap sederhana untuk hover/gradient
  document.documentElement.style.setProperty('--c-primary-dark', shadeColor(db.setting.warnaTema, -15));
}
function shadeColor(hex, percent){
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, Math.max(0, Math.round(r + (percent/100)*255)));
  g = Math.min(255, Math.max(0, Math.round(g + (percent/100)*255)));
  b = Math.min(255, Math.max(0, Math.round(b + (percent/100)*255)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function renderIdentity(){
  const { namaSekolah, logo } = db.setting;
  document.title = namaSekolah + " — Absensi";
  document.getElementById('loginSchoolName').textContent = namaSekolah;
  document.getElementById('sideSchoolName').textContent = namaSekolah;

  const imgs = [
    {img: document.getElementById('loginLogoImg'), fb: document.getElementById('loginLogoFallback')},
    {img: document.getElementById('sideLogoImg'),  fb: document.getElementById('sideLogoFallback')},
    {img: document.getElementById('settingLogoImg'),fb: document.getElementById('settingLogoFallback')},
  ];
  imgs.forEach(({img, fb})=>{
    if(logo){
      img.src = logo;
      img.classList.remove('hidden');
      fb.classList.add('hidden');
    }else{
      img.classList.add('hidden');
      fb.classList.remove('hidden');
    }
  });
  applyTheme();
}

/* ============================================================
   NAVIGASI VIEW UTAMA (login <-> dashboard)
   ============================================================ */
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ============================================================
   LOGIN ADMIN
   ============================================================ */
document.getElementById('formLoginAdmin').addEventListener('submit', e=>{
  e.preventDefault();
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  const errEl = document.getElementById('loginError');
  if(u === db.admin.username && p === db.admin.password){
    errEl.classList.add('hidden');
    document.getElementById('formLoginAdmin').reset();
    enterDashboard();
  }else{
    errEl.classList.remove('hidden');
  }
});

document.getElementById('btnLogout').addEventListener('click', ()=>{
  showView('view-login');
});

function enterDashboard(){
  showView('view-dashboard');
  renderRingkasan();
  renderInputAbsensiPage();
  renderRekapPage();
  renderSiswaPage();
  renderPengaturanForm();
  goToPage('page-ringkasan');
}

/* Tabs di halaman login (admin / absen siswa) */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector(`.tab-pane[data-pane="${btn.dataset.tab}"]`).classList.add('active');
    if(btn.dataset.tab === 'absen') renderAbsenSiswaSelect();
  });
});

/* ============================================================
   ABSENSI CEPAT DARI HALAMAN LOGIN (untuk siswa, tanpa login admin)
   ============================================================ */
function renderAbsenSiswaSelect(){
  const sel = document.getElementById('absenSiswaSelect');
  sel.innerHTML = db.siswa.length
    ? db.siswa.map(s=>`<option value="${s.id}">${escapeHtml(s.nama)} — ${escapeHtml(s.kelas)}</option>`).join('')
    : `<option value="">Belum ada data siswa</option>`;
}
document.querySelectorAll('.status-pick').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const siswaId = document.getElementById('absenSiswaSelect').value;
    const msg = document.getElementById('absenMsg');
    if(!siswaId){
      msg.textContent = "Tidak ada siswa untuk diabsen.";
      msg.classList.remove('hidden');
      return;
    }
    const siswa = db.siswa.find(s=>s.id === siswaId);
    const tgl = todayStr();
    // hapus entry sebelumnya di hari yang sama untuk siswa ini
    db.absensi = db.absensi.filter(a => !(a.siswaId === siswaId && a.tanggal === tgl));
    db.absensi.push({
      id: uid(), tanggal: tgl, siswaId, nama: siswa.nama, kelas: siswa.kelas,
      status: btn.dataset.status, waktu: new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})
    });
    saveDB();
    msg.textContent = `Absensi "${siswa.nama}" tercatat: ${btn.dataset.status}. Terima kasih!`;
    msg.classList.remove('hidden');
  });
});

/* ============================================================
   SIDEBAR NAV (mobile + page switching)
   ============================================================ */
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    goToPage(btn.dataset.page);
    closeSidebar();
  });
});
function goToPage(pageId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-page="${pageId}"]`).classList.add('active');
  const titles = {
    'page-ringkasan':'Ringkasan', 'page-absensi':'Input Absensi',
    'page-rekap':'Rekap Absensi', 'page-siswa':'Data Siswa', 'page-pengaturan':'Pengaturan'
  };
  document.getElementById('pageTitle').textContent = titles[pageId] || '';
}

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
document.getElementById('btnMenu').addEventListener('click', ()=>{
  sidebar.classList.add('open');
  overlay.classList.add('show');
});
overlay.addEventListener('click', closeSidebar);
function closeSidebar(){
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

/* set tanggal hari ini di topbar */
function renderTopbarDate(){
  document.getElementById('topbarDate').textContent = formatTanggalIndo(todayStr());
}

/* ============================================================
   PAGE: RINGKASAN
   ============================================================ */
function renderRingkasan(){
  renderTopbarDate();
  const tgl = todayStr();
  const todayData = db.absensi.filter(a => a.tanggal === tgl);

  document.getElementById('statTotalSiswa').textContent = db.siswa.length;
  document.getElementById('statHadir').textContent = todayData.filter(a=>a.status==='Hadir').length;
  document.getElementById('statIzinSakit').textContent = todayData.filter(a=>a.status==='Izin'||a.status==='Sakit').length;
  document.getElementById('statAlpha').textContent = todayData.filter(a=>a.status==='Alpha').length;

  document.getElementById('todayDateBadge').textContent = formatTanggalIndo(tgl);

  const tbody = document.querySelector('#tableHariIni tbody');
  tbody.innerHTML = '';
  if(todayData.length === 0){
    document.getElementById('emptyHariIni').classList.remove('hidden');
  }else{
    document.getElementById('emptyHariIni').classList.add('hidden');
    todayData.forEach(a=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(a.nama)}</td><td>${escapeHtml(a.kelas)}</td>
        <td><span class="pill pill-${a.status}">${a.status}</span></td><td>${a.waktu||'-'}</td>`;
      tbody.appendChild(tr);
    });
  }
}

/* ============================================================
   PAGE: INPUT ABSENSI (massal per kelas/tanggal)
   ============================================================ */
function uniqueKelas(){
  return [...new Set(db.siswa.map(s=>s.kelas))].sort();
}
function fillKelasSelect(selectEl, withAllOption=true){
  const kelasList = uniqueKelas();
  selectEl.innerHTML = (withAllOption ? `<option value="">Semua Kelas</option>` : '') +
    kelasList.map(k=>`<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
}

function renderInputAbsensiPage(){
  const tglInput = document.getElementById('absensiTanggal');
  if(!tglInput.value) tglInput.value = todayStr();
  fillKelasSelect(document.getElementById('filterKelasAbsensi'));
  renderTableInputAbsensi();
}
document.getElementById('absensiTanggal').addEventListener('change', renderTableInputAbsensi);
document.getElementById('filterKelasAbsensi').addEventListener('change', renderTableInputAbsensi);

function renderTableInputAbsensi(){
  const tgl = document.getElementById('absensiTanggal').value || todayStr();
  const kelasFilter = document.getElementById('filterKelasAbsensi').value;
  const tbody = document.querySelector('#tableInputAbsensi tbody');
  tbody.innerHTML = '';

  let list = db.siswa;
  if(kelasFilter) list = list.filter(s=>s.kelas === kelasFilter);

  if(list.length === 0){
    document.getElementById('emptySiswaAbsensi').classList.remove('hidden');
    return;
  }
  document.getElementById('emptySiswaAbsensi').classList.add('hidden');

  list.forEach(s=>{
    const existing = db.absensi.find(a=>a.siswaId===s.id && a.tanggal===tgl);
    const currentStatus = existing ? existing.status : null;
    const tr = document.createElement('tr');
    tr.dataset.siswaId = s.id;
    const statuses = ['Hadir','Izin','Sakit','Alpha'];
    const icons = {Hadir:'✓', Izin:'I', Sakit:'S', Alpha:'A'};
    tr.innerHTML = `
      <td>${escapeHtml(s.nama)}</td>
      <td>${escapeHtml(s.kelas)}</td>
      ${statuses.map(st => `<td><button type="button" class="status-mini ${currentStatus===st?'on-'+st:''}" data-status="${st}" data-siswa="${s.id}">${icons[st]}</button></td>`).join('')}
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.status-mini').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tr = btn.closest('tr');
      tr.querySelectorAll('.status-mini').forEach(b=>{
        b.classList.remove('on-Hadir','on-Izin','on-Sakit','on-Alpha');
      });
      btn.classList.add('on-'+btn.dataset.status);
      tr.dataset.selectedStatus = btn.dataset.status;
    });
  });
}

document.getElementById('btnSimpanAbsensi').addEventListener('click', ()=>{
  const tgl = document.getElementById('absensiTanggal').value || todayStr();
  const rows = document.querySelectorAll('#tableInputAbsensi tbody tr');
  let count = 0;
  const now = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});

  rows.forEach(tr=>{
    const siswaId = tr.dataset.siswaId;
    const activeBtn = tr.querySelector('.status-mini[class*="on-"]');
    if(!activeBtn) return; // belum dipilih statusnya, skip
    const status = activeBtn.dataset.status;
    const siswa = db.siswa.find(s=>s.id===siswaId);
    if(!siswa) return;

    db.absensi = db.absensi.filter(a => !(a.siswaId === siswaId && a.tanggal === tgl));
    db.absensi.push({ id: uid(), tanggal: tgl, siswaId, nama: siswa.nama, kelas: siswa.kelas, status, waktu: now });
    count++;
  });
  saveDB();
  const msg = document.getElementById('simpanMsg');
  msg.textContent = count > 0 ? `Berhasil menyimpan absensi untuk ${count} siswa.` : `Pilih status kehadiran minimal satu siswa sebelum menyimpan.`;
  msg.classList.remove('hidden');
  if(count>0){
    renderRingkasan();
    setTimeout(()=> msg.classList.add('hidden'), 3500);
  }
});

/* ============================================================
   PAGE: REKAP ABSENSI
   ============================================================ */
function renderRekapPage(){
  const dari = document.getElementById('rekapDari');
  const sampai = document.getElementById('rekapSampai');
  if(!dari.value) dari.value = todayStr();
  if(!sampai.value) sampai.value = todayStr();
  fillKelasSelect(document.getElementById('rekapKelas'));
  renderTableRekap();
}
document.getElementById('btnFilterRekap').addEventListener('click', renderTableRekap);

function renderTableRekap(){
  const dari = document.getElementById('rekapDari').value;
  const sampai = document.getElementById('rekapSampai').value;
  const kelas = document.getElementById('rekapKelas').value;

  let data = db.absensi.filter(a => a.tanggal >= dari && a.tanggal <= sampai);
  if(kelas) data = data.filter(a => a.kelas === kelas);
  data = data.slice().sort((a,b)=> b.tanggal.localeCompare(a.tanggal) || a.nama.localeCompare(b.nama));

  const tbody = document.querySelector('#tableRekap tbody');
  tbody.innerHTML = '';
  if(data.length === 0){
    document.getElementById('emptyRekap').classList.remove('hidden');
  }else{
    document.getElementById('emptyRekap').classList.add('hidden');
    data.forEach(a=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${formatTanggalIndo(a.tanggal)}</td><td>${escapeHtml(a.nama)}</td>
        <td>${escapeHtml(a.kelas)}</td><td><span class="pill pill-${a.status}">${a.status}</span></td>`;
      tbody.appendChild(tr);
    });
  }
  window._rekapCache = data;
}

document.getElementById('btnExportRekap').addEventListener('click', ()=>{
  const data = window._rekapCache || [];
  if(data.length === 0){ alert('Tidak ada data untuk diekspor.'); return; }
  let csv = 'Tanggal,Nama,Kelas,Status\n';
  data.forEach(a=>{
    csv += `${a.tanggal},"${a.nama}","${a.kelas}",${a.status}\n`;
  });
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekap-absensi-${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ============================================================
   PAGE: DATA SISWA
   ============================================================ */
document.getElementById('formSiswa').addEventListener('submit', e=>{
  e.preventDefault();
  const nama = document.getElementById('inputNamaSiswa').value.trim();
  const kelas = document.getElementById('inputKelasSiswa').value.trim();
  const nis = document.getElementById('inputNisSiswa').value.trim();
  if(!nama || !kelas) return;

  db.siswa.push({ id: uid(), nama, kelas, nis });
  saveDB();
  document.getElementById('formSiswa').reset();
  renderSiswaPage();
  renderInputAbsensiPage();
  renderRekapPage();
});

function renderSiswaPage(searchTerm=''){
  const tbody = document.querySelector('#tableSiswa tbody');
  tbody.innerHTML = '';
  let list = db.siswa.slice().sort((a,b)=> a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
  if(searchTerm){
    const q = searchTerm.toLowerCase();
    list = list.filter(s => s.nama.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q));
  }
  if(list.length === 0){
    document.getElementById('emptySiswa').classList.remove('hidden');
  }else{
    document.getElementById('emptySiswa').classList.add('hidden');
    list.forEach(s=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(s.nama)}</td><td>${escapeHtml(s.kelas)}</td><td>${escapeHtml(s.nis||'-')}</td>
        <td><button class="row-del" data-id="${s.id}" title="Hapus siswa">🗑️</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.row-del').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(confirm('Hapus siswa ini? Data absensi terkait tetap tersimpan di riwayat.')){
          db.siswa = db.siswa.filter(s=>s.id !== btn.dataset.id);
          saveDB();
          renderSiswaPage(document.getElementById('searchSiswa').value);
          renderInputAbsensiPage();
          renderRekapPage();
          renderRingkasan();
        }
      });
    });
  }
}
document.getElementById('searchSiswa').addEventListener('input', e=>{
  renderSiswaPage(e.target.value);
});

/* ============================================================
   PAGE: PENGATURAN
   ============================================================ */
function renderPengaturanForm(){
  document.getElementById('inputNamaSekolah').value = db.setting.namaSekolah;
  document.getElementById('inputAlamatSekolah').value = db.setting.alamat;
  document.getElementById('inputWarnaTema').value = db.setting.warnaTema;
}

document.getElementById('btnPilihLogo').addEventListener('click', ()=>{
  document.getElementById('inputLogo').click();
});
document.getElementById('inputLogo').addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 1.5 * 1024 * 1024){
    alert('Ukuran logo maksimal 1.5MB ya, biar aplikasi tetap ringan.');
    return;
  }
  const reader = new FileReader();
  reader.onload = ev=>{
    db.setting.logo = ev.target.result;
    saveDB();
    renderIdentity();
  };
  reader.readAsDataURL(file);
});
document.getElementById('btnHapusLogo').addEventListener('click', ()=>{
  db.setting.logo = '';
  saveDB();
  renderIdentity();
});

document.getElementById('btnSimpanSetting').addEventListener('click', ()=>{
  const nama = document.getElementById('inputNamaSekolah').value.trim();
  if(!nama){ alert('Nama sekolah tidak boleh kosong.'); return; }
  db.setting.namaSekolah = nama;
  db.setting.alamat = document.getElementById('inputAlamatSekolah').value.trim();
  db.setting.warnaTema = document.getElementById('inputWarnaTema').value;
  saveDB();
  renderIdentity();
  const msg = document.getElementById('settingMsg');
  msg.textContent = 'Pengaturan berhasil disimpan.';
  msg.classList.remove('hidden');
  setTimeout(()=>msg.classList.add('hidden'), 3000);
});

document.getElementById('formPassword').addEventListener('submit', e=>{
  e.preventDefault();
  const newU = document.getElementById('newUsername').value.trim();
  const newP = document.getElementById('newPassword').value;
  if(!newU && !newP){ return; }
  if(newU) db.admin.username = newU;
  if(newP) db.admin.password = newP;
  saveDB();
  document.getElementById('formPassword').reset();
  const msg = document.getElementById('passwordMsg');
  msg.textContent = 'Kredensial admin berhasil diperbarui.';
  msg.classList.remove('hidden');
  setTimeout(()=>msg.classList.add('hidden'), 3000);
});

document.getElementById('btnResetData').addEventListener('click', ()=>{
  if(confirm('Yakin ingin menghapus SEMUA data siswa dan riwayat absensi? Tindakan ini permanen.')){
    db.siswa = [];
    db.absensi = [];
    saveDB();
    renderSiswaPage();
    renderInputAbsensiPage();
    renderRekapPage();
    renderRingkasan();
    alert('Semua data siswa dan absensi telah dihapus.');
  }
});

/* ============================================================
   UTIL
   ============================================================ */
function escapeHtml(str){
  if(str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

/* ============================================================
   INIT
   ============================================================ */
function init(){
  renderIdentity();
  renderAbsenSiswaSelect();
  showView('view-login');
}
init();
