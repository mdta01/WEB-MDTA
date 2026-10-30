# 📱 Admin Panel APK — Setup Guide

Admin panel MDTA Miftahul Ulum 01 sekarang bisa diinstall sebagai **APK Android** (native app) menggunakan **Trusted Web Activity (TWA)** + GitHub Actions.

## 🎯 Cara Pakai

### 1. Trigger Build APK via GitHub Actions

1. Buka **https://github.com/mdta01/WEB-MDTA/actions**
2. Pilih workflow **"Build Admin APK"** (di sidebar kiri)
3. Klik tombol **"Run workflow"** (kanan atas)
4. Isi parameter:
   - **site_url**: `https://mdta-tawangsari.vercel.app` (default, sudah benar)
   - **app_name**: `MDTA Admin` (default)
   - **app_version**: `1.0.0` (naikkan versi untuk update: 1.0.1, 1.0.2, dll)
5. Klik **"Run workflow"** (tombol hijau)
6. Tunggu build selesai (~5-10 menit)

### 2. Download APK

1. Setelah build selesai (status: ✅ green), klik run yang baru selesai
2. Scroll ke bagian **"Artifacts"** di paling bawah
3. Klik artifact `mdta-admin-apk-1.0.0` untuk download ZIP
4. Extract ZIP → dapat:
   - `app-release-signed.apk` ← **APK file untuk install di Android**
   - `twa-manifest.json` ← konfigurasi TWA (debug)
   - `android.keystore` ← signing key (simpan baik-baik untuk update nanti)

### 3. Install di Android

1. Transfer `app-release-signed.apk` ke HP Android:
   - USB cable
   - Google Drive / Dropbox
   - Download langsung dari HP (buka GitHub di Chrome Android)
2. Buka file APK di Android (dengan File Manager atau Downloads)
3. Android akan minta izin **"Install unknown apps"** → Allow
4. Klik **Install** → tunggu proses selesai
5. Buka app **MDTA Admin** dari app drawer
6. Login: `mdta01` / `mdta@01`

### 4. Update APK (Versi Baru)

Untuk rilis versi baru (mis. fix bug, tambah fitur):

1. Update code di repo → push ke GitHub (Vercel auto-deploy)
2. Trigger workflow lagi dengan version baru (mis. `1.0.1`)
3. Download APK baru → install ulang di HP (auto-replace versi lama)

## 🔄 Auto-Update assetlinks.json

Setiap kali workflow run, GitHub Actions akan:
1. Generate signing keypair (keystore)
2. Compute SHA256 fingerprint dari keypair
3. Update file `public/.well-known/assetlinks.json` dengan fingerprint yang benar
4. Commit ke repo → Vercel auto-deploy

Ini penting supaya APK bisa koneksi ke website **tanpa address bar browser** (Trusted Web Activity). Setelah deploy Vercel (~1 menit), APK siap dipakai.

**Catatan**: Kalau SHA256 fingerprint berubah (mis. signing key baru), APK lama tidak bisa koneksi tanpa address bar. Solusi: re-run workflow, download APK baru.

## 🛠️ Komponen yang Dibuat

| File | Fungsi |
|------|--------|
| `public/admin-manifest.webmanifest` | PWA manifest khusus admin (name, icons, shortcuts) |
| `public/admin-sw.js` | Service worker untuk offline caching + PWA criteria |
| `public/icons/admin/*.png` | Icons PWA (192, 512, 512 maskable, apple-touch, favicon) |
| `public/.well-known/assetlinks.json` | Digital asset links untuk TWA (APK trust) |
| `src/app/admin/layout.tsx` | Layout admin dengan manifest link + SW registration |
| `src/components/admin/AdminSWRegister.tsx` | Component register SW admin |
| `.github/workflows/build-admin-apk.yml` | GitHub Actions workflow build APK |

## 📋 PWA Features yang Didapat

Admin panel sekarang PWA yang **installable** (Add to Home Screen):

- ✅ **Installable** di Android Chrome, Edge, Firefox (tap "Install app")
- ✅ **Standalone mode** (no browser address bar saat dibuka dari home screen)
- ✅ **Offline support** — admin shell cached, bisa buka tanpa internet (data ter-cache)
- ✅ **Splash screen** dengan logo & warna madrasah
- ✅ **App shortcuts** — long-press icon → akses cepat Dashboard, Berita, Push Notif, Settings
- ✅ **Theme color** — status bar Android pakai warna emerald (#003527)
- ✅ **APK native** (via Bubblewrap TWA) — bisa distribusi ke admin lain

## 🔐 Keamanan

- ✅ APK signed dengan keystore yang di-generate di workflow
- ✅assetlinks.json memastikan hanya APK dengan fingerprint yang cocok yang bisa akses tanpa address bar
- ✅ Admin login tetap required (cookie session, 7 hari expiry)
- ✅ Tidak ada perubahan pada logic autentikasi yang ada

## 🐛 Troubleshooting

### Build gagal di GitHub Actions
- Cek log: klik run yang failed → expand step yang merah
- Common issue: Bubblewrap init butuh PWA live → pastikan `mdta-tawangsari.vercel.app/admin` accessible
- Coba re-run: klik "Re-run all jobs"

### APK tidak bisa koneksi (blank screen)
- assetlinks.json belum ter-update → cek Vercel deploy terbaru
- Cek `/admin-manifest.webmanifest` accessible: buka `https://mdta-tawangsari.vercel.app/admin-manifest.webmanifest` di browser
- Tunggu 1-2 menit setelah workflow selesai (Vercel butuh waktu deploy)

### APK ter-install tapi tidak bisa login
- Pastikan HP ada koneksi internet
- Buka `https://mdta-tawangsari.vercel.app/admin` di Chrome Android → coba login
- Kalau bisa login di Chrome tapi tidak di APK → cek assetlinks.json (SHA256 fingerprint)

### Tidak bisa upload ke Play Store
- Play Store butuh **production signing key** (bukan debug)
- Untuk awal, APK signed dengan debug key cukup untuk sideload install
- Untuk Play Store, set `ANDROID_KEYSTORE_BASE64` sebagai GitHub Secret & update workflow

## 📞 Cara Cek Status

```bash
# Cek workflow runs
https://github.com/mdta01/WEB-MDTA/actions

# Cek PWA manifest
https://mdta-tawangsari.vercel.app/admin-manifest.webmanifest

# Cek service worker
https://mdta-tawangsari.vercel.app/admin-sw.js

# Cek assetlinks.json
https://mdta-tawangsari.vercel.app/.well-known/assetlinks.json

# Test PWA installability
# Buka Chrome DevTools → Application → Manifest (harus "Installable")
```

## 🎨 Customization

Untuk ganti nama app, icon, atau warna:
1. Edit `public/admin-manifest.webmanifest` (name, short_name, theme_color)
2. Replace icons di `public/icons/admin/` (generate dari logo dengan sharp)
3. Edit `src/app/admin/layout.tsx` (viewport.themeColor)
4. Push ke GitHub → Vercel auto-deploy
5. Re-run workflow untuk build APK baru

---

**Catatan**: Fitur ini **tidak mengubah** kode admin yang ada. PWA setup dan workflow bersifat additive — admin panel tetap bisa diakses via browser seperti biasa. APK hanya cara alternatif untuk akses yang lebih native.
