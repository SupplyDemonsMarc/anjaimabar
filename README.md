# 📱 Aplikasi Absensi Sekolah

Aplikasi web absensi sekolah — bisa langsung dipakai di browser/HP, dan bisa
diubah jadi file **.apk** untuk di-install di Android.

## Isi folder
```
absensi-sekolah/
├── index.html          → halaman utama aplikasi
├── manifest.json        → identitas aplikasi (untuk APK)
├── service-worker.js    → supaya aplikasi bisa dipakai offline
├── css/style.css        → tampilan
├── js/app.js             → logika aplikasi (data tersimpan di HP/browser)
└── assets/               → logo & icon aplikasi
```

## Fitur yang sudah ada
- 🔐 Login admin (default **admin** / **admin123**, bisa diganti di Pengaturan)
- 🏫 Atur nama sekolah, alamat, dan **upload logo sendiri**
- 🎨 Atur warna tema aplikasi
- 📝 Input absensi massal per kelas/tanggal (Hadir / Izin / Sakit / Alpha)
- 📩 Form absensi mandiri untuk siswa (tanpa perlu login admin)
- 📊 Ringkasan kehadiran harian otomatis
- 📅 Rekap absensi dengan filter tanggal & kelas, bisa **export ke CSV/Excel**
- 👥 Kelola data siswa (tambah, cari, hapus)
- 📱 Tampilan otomatis menyesuaikan HP (responsive)
- 💾 Semua data tersimpan otomatis di HP (localStorage) — tidak butuh internet/server

---

# 🖥️ Cara Mencoba di Komputer (Windows) Dulu

1. Download/copy folder `absensi-sekolah` ke komputer.
2. Buka file `index.html` dua kali klik → akan terbuka di browser (Chrome/Edge).
3. Coba login dengan **admin** / **admin123**, lalu jelajahi menu Pengaturan untuk
   ganti nama sekolah dan upload logo.

> Catatan: cara ini sudah cukup untuk dipakai sehari-hari di laptop/PC sekolah,
> tanpa perlu dijadikan APK sama sekali — tinggal buka `index.html` dari Chrome.

---

# 📦 Cara Membuat File APK di Windows

Ada 2 cara. **Cara 1 direkomendasikan** karena resmi dari Google, hasilnya ringan
dan stabil. **Cara 2** lebih cepat tapi pakai aplikasi pihak ketiga.

## ✅ Cara 1: PWA Builder (paling mudah, tanpa install software berat)

Ini cara termudah karena dilakukan lewat website, tidak perlu install Android Studio.

### Langkah 1 — Upload aplikasi ke hosting gratis
APK butuh aplikasi diakses lewat alamat web (URL), bukan dari file lokal. Pakai
hosting gratis seperti **Netlify** atau **GitHub Pages**:

**Pakai Netlify (paling simpel):**
1. Buka https://app.netlify.com/drop di browser.
2. Login dengan akun gratis.
3. Buka folder `absensi-sekolah` di File Explorer, lalu **drag seluruh folder**
   itu ke halaman Netlify Drop.
4. Tunggu beberapa detik, Netlify akan memberi alamat seperti:
   `https://nama-acak-123.netlify.app`
5. Buka alamat itu di browser untuk pastikan aplikasi muncul dengan benar.

### Langkah 2 — Generate APK dari PWA Builder
1. Buka https://www.pwabuilder.com
2. Masukkan URL Netlify tadi (`https://nama-acak-123.netlify.app`) ke kolom yang
   tersedia, klik **Start**.
3. PWA Builder akan menganalisis aplikasi (akan menemukan `manifest.json` dan
   `service-worker.js` yang sudah disiapkan di proyek ini).
4. Klik tombol **Package For Stores** → pilih **Android**.
5. Isi nama paket, contoh: `com.sekolahanda.absensi`
6. Klik **Generate** → file `.apk` (atau `.aab`) akan otomatis terdownload.
7. Pindahkan file `.apk` ke HP Android (lewat kabel USB, Google Drive, atau WhatsApp),
   lalu install seperti aplikasi biasa (aktifkan dulu "Izinkan dari sumber tidak dikenal"
   di pengaturan HP jika diminta).

---

## 🛠️ Cara 2: Bubblewrap CLI (lebih teknis, hasil lebih bisa dikustomisasi)

Gunakan ini jika Cara 1 tidak cocok atau ingin kontrol penuh atas APK (misalnya
untuk upload ke Google Play Store).

### Yang perlu di-install di Windows dulu:
1. **Node.js** (versi LTS) → download di https://nodejs.org lalu install seperti biasa.
2. **Java JDK 17** → download di https://adoptium.net (pilih versi 17, Windows x64 `.msi`).
3. **Android Studio TIDAK wajib**, tapi Bubblewrap akan otomatis download Android SDK
   saat pertama kali dipakai (butuh koneksi internet & sedikit waktu).

### Langkah-langkah (jalankan di Command Prompt / PowerShell):

```bash
# 1. Install Bubblewrap CLI secara global
npm install -g @bubblewrap/cli

# 2. Upload dulu folder absensi-sekolah ke hosting (sama seperti Cara 1, 
#    pakai Netlify Drop) supaya punya URL manifest.json, contoh:
#    https://nama-acak-123.netlify.app/manifest.json

# 3. Buat folder baru khusus untuk proses build, lalu masuk ke folder itu
mkdir build-apk-absensi
cd build-apk-absensi

# 4. Inisialisasi proyek dari manifest yang sudah online
bubblewrap init --manifest=https://nama-acak-123.netlify.app/manifest.json
```

Saat proses `init`, Bubblewrap akan bertanya beberapa hal lewat terminal — tinggal
tekan **Enter** untuk pakai nilai default, atau isi sesuai keinginan:
- **Domain** → otomatis terisi dari URL
- **Application name** → "Absensi Sekolah"
- **Package ID** → contoh `com.sekolahanda.absensi`
- Untuk **signing key**, biarkan Bubblewrap generate otomatis (catat passwordnya,
  akan ditampilkan di akhir proses — simpan baik-baik untuk update APK di masa depan)

```bash
# 5. Setelah init selesai, build APK-nya
bubblewrap build
```

Setelah selesai, file APK akan ada di dalam folder `build-apk-absensi` dengan nama
seperti `app-release-signed.apk`. Tinggal pindahkan ke HP dan install.

---

## ❓ Pertanyaan Umum

**Q: Datanya tersimpan di mana? Apakah perlu internet?**
A: Semua data (siswa, absensi, pengaturan) tersimpan langsung di HP/komputer
masing-masing (di dalam aplikasi/browser). Tidak butuh internet maupun server
sama sekali setelah aplikasi ter-install. Jika ingin data bisa diakses dari
banyak perangkat sekaligus (misalnya guru-guru input dari HP berbeda dan datanya
nyambung), itu butuh pengembangan lanjutan dengan database online — beri tahu
saya jika ingin saya bantu kembangkan ke arah situ.

**Q: Kalau HP-nya ganti atau aplikasi di-uninstall, datanya hilang?**
A: Ya, karena data tersimpan lokal di perangkat. Gunakan tombol **Export CSV**
di menu Rekap Absensi secara rutin untuk mencadangkan data ke file Excel.

**Q: Bisa ganti logo aplikasi (icon di home screen HP) selain logo sekolah di dalam app?**
A: Bisa. Ganti file `assets/icon-192.png` dan `assets/icon-512.png` dengan logo
sekolah (ukuran persegi, 192x192 dan 512x512 piksel), lalu ulangi proses upload
ke hosting + generate APK.

**Q: Apakah wajib pakai Netlify?**
A: Tidak, bisa pakai hosting gratis lain seperti GitHub Pages, Vercel, atau Firebase
Hosting — intinya aplikasi perlu bisa diakses lewat URL https sebelum di-generate
jadi APK.
