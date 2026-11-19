# Conferti — Modern Web Media Optimizer

> **Platform Konversi & Optimasi Media Gambar & Video ke WebP, AVIF, dan WebM Berkecepatan Tinggi, 100% Client-Side di Browser Anda.**

Conferti adalah perkakas web modern yang dirancang khusus untuk mempermudah web developer, desainer UI/UX, dan pemilik situs web dalam mengoptimalkan aset media digital guna mencapai performa terbaik pada **Google Core Web Vitals** dan **PageSpeed**.

---

## ✨ Fitur Unggulan

- 🛡️ **100% Client-Side Privacy (Zero-Upload):** Seluruh proses kompresi berjalan langsung di memori peramban Anda. Tidak ada satu berkas pun yang diunggah ke internet atau server pihak ketiga.
- 🖼️ **Konversi Gambar ke WebP & AVIF:** Mengompresi format JPG, PNG, GIF, BMP, dan SVG menjadi WebP atau AVIF dengan penghematan ukuran 25% hingga 85% tanpa mengorbankan ketajaman visual.
- 🎬 **Konversi Video Web (WebM):** Mengubah format MP4, MOV, MKV menjadi Web Video WebM lengkap dengan audio jernih (Opus 64 kbps) dan durasi utuh.
- 🎞️ **Animasi WebP Looping (Pengganti GIF):** Membuat animasi WebP berputar tanpa henti tanpa suara, jauh lebih ringan dan mulus daripada GIF tradisional.
- 🖼️ **Poster Frame Thumbnail:** Mengambil satu frame cuplikan video menjadi gambar sampul poster WebP berkualitas tinggi.
- 🧠 **Kompresi Cerdas & Adaptif:** Mengukur bitrate bawaan file asli secara dinamis agar ukuran file hasil konversi dijamin selalu berkurang dan tidak pernah membengkak.
- ⚡ **Batch Antrean Sekuensial & Tahan >1 GB:** Menangani puluhan hingga ratusan file serta berkas raksasa (>1 GB) secara stabil berkat pembebasan memori canvas GPU/VRAM yang agresif.
- ⏱️ **Estimasi Waktu Selesai (ETA Dinamis):** Menampilkan sisa waktu konversi dan kecepatan rata-rata per berkas secara real-time.
- 🔢 **Penomoran Urut & Tampilan Rapi:** Penomoran otomatis (#1, #2, dst.) dengan area gulir internal (*scrollable*) agar tampilan tetap ringkas dan tidak memanjang ke bawah.
- 📦 **Metode Pengunduhan Fleksibel:** Pilihan unduh seluruh file dalam satu paket arsip ZIP atau unduh langsung file-per-file secara berurutan ke folder penyimpanan lokal.

---

## 📁 Struktur Berkas

```
conferti/
├── index.html       # Aplikasi utama konverter media, modal interaktif, dan navigasi
├── index.js         # Logika konversi (Canvas, MediaRecorder, WebAssembly, JSZip, ETA)
├── about.html       # Halaman dokumentasi lengkap tentang misi & arsitektur Conferti
├── faq.html         # Halaman tanya jawab seputar penggunaan dan panduan teknis
├── LICENSE          # Berkas lisensi resmi perangkat lunak terbuka
└── README.md        # Dokumentasi panduan proyek
```

---

## 🚀 Cara Menjalankan

Conferti dirancang secara *zero-dependency* di sisi server:

1. **Buka Langsung:**
   Cukup klik dua kali berkas `index.html` untuk membukanya di peramban web modern (Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari).

2. **Menggunakan Local Server (Opsional):**
   Untuk performa optimal saat memuat modul WebAssembly eksternal:
   ```bash
   # Menggunakan Python
   python -m http.server 3000

   # Atau menggunakan Node.js npx serve
   npx serve .
   ```
   Buka peramban di `http://localhost:3000`.

---

## 🛠️ Teknologi yang Digunakan

- **HTML5 & CSS3** dengan **Tailwind CSS** via CDN
- **Vanilla JavaScript (ES6+ Modules)**
- **WebAssembly (Wasm)** — `@jsquash/avif` untuk pengkodean AVIF performa tinggi
- **HTML5 Canvas & ImageBitmap API** untuk pemrosesan citra cepat
- **MediaStream & MediaRecorder API** untuk perekaman video WebM VP9/VP8
- **JSZip 3.10.1** untuk kompresi arsip ZIP langsung di browser

---

## 👨‍💻 Pengembang

Dikembangkan dengan dedikasi oleh **Muhammad Syaiful Mukmin**.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi terbuka [MIT License](LICENSE). Bebas digunakan untuk keperluan pribadi maupun komersial.
