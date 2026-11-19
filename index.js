// Conferti - Konverter Gambar & Video ke WebP & AVIF untuk Website
// Dioptimalkan untuk performa tinggi (ratusan file sekaligus, hemat RAM, pembaruan DOM O(1))

// Referensi Elemen DOM
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const qualityDescription = document.getElementById('qualityDescription');
const presetExtreme = document.getElementById('presetExtreme');
const presetBalanced = document.getElementById('presetBalanced');
const presetHigh = document.getElementById('presetHigh');
const imageMaxDimSelect = document.getElementById('imageMaxDimSelect');
const imageFormatSelect = document.getElementById('imageFormatSelect');
const videoModeSelect = document.getElementById('videoModeSelect');
const videoExtraSettings = document.getElementById('videoExtraSettings');
const videoFpsSelect = document.getElementById('videoFpsSelect');
const videoDurationSelect = document.getElementById('videoDurationSelect');
const videoScaleSelect = document.getElementById('videoScaleSelect');
const convertBtn = document.getElementById('convertBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const downloadDirectTopBtn = document.getElementById('downloadDirectTopBtn');
const downloadSection = document.getElementById('downloadSection');
const completedCountText = document.getElementById('completedCountText');
const totalSavedText = document.getElementById('totalSavedText');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const downloadDirectBtn = document.getElementById('downloadDirectBtn');
const bottomDownloadBar = document.getElementById('bottomDownloadBar');
const bottomDownloadZipBtn = document.getElementById('bottomDownloadZipBtn');
const bottomDownloadDirectBtn = document.getElementById('bottomDownloadDirectBtn');
const clearBtn = document.getElementById('clearBtn');
const summaryBar = document.getElementById('summaryBar');
const fileCountText = document.getElementById('fileCountText');
const globalPercentText = document.getElementById('globalPercentText');
const globalProgressContainer = document.getElementById('globalProgressContainer');
const globalProgressBar = document.getElementById('globalProgressBar');
const globalStatusDot = document.getElementById('globalStatusDot');
const fileList = document.getElementById('fileList');
const toastContainer = document.getElementById('toastContainer');
const uploadRequirementHint = document.getElementById('uploadRequirementHint');

// State Antrean File
let filesQueue = [];
let isConverting = false;
let lastBatchDurationText = '';

// Sistem Notifikasi Toast Profesional
function showToast(title, message, type = 'success', duration = 4500) {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto transform transition-all duration-300 ease-out translate-y-3 opacity-0 flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border shadow-xl backdrop-blur-md ${
    type === 'success'
      ? 'bg-slate-900/95 border-emerald-500/50 text-slate-100 shadow-emerald-500/10'
      : type === 'warning'
      ? 'bg-slate-900/95 border-amber-500/50 text-slate-100 shadow-amber-500/10'
      : 'bg-slate-900/95 border-rose-500/50 text-slate-100 shadow-rose-500/10'
  }`;

  const iconSvg = type === 'success'
    ? `<div class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
       </div>`
    : type === 'warning'
    ? `<div class="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
       </div>`
    : `<div class="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
       </div>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="flex-1 min-w-0 pt-0.5">
      <p class="text-xs font-bold ${type === 'success' ? 'text-emerald-400' : type === 'warning' ? 'text-amber-400' : 'text-rose-400'}">${title}</p>
      <div class="text-xs text-slate-300 mt-0.5 leading-relaxed">${message}</div>
    </div>
    <button class="toast-close text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  `;

  toastContainer.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  });

  const removeToast = () => {
    toast.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', removeToast);

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

// Cache modul AVIF jika user memilih AVIF
let avifEncodeModule = null;

const videoModeExplainer = document.getElementById('videoModeExplainer');
const imageSettingsBox = document.getElementById('imageSettingsBox');
const videoSettingsBox = document.getElementById('videoSettingsBox');

// Format note helper
function getFormatNote(item) {
  if (item.type === 'image') {
    const ext = imageFormatSelect.value.toUpperCase();
    return `<span class="text-[11px] text-indigo-400 font-medium">(${ext})</span>`;
  } else {
    const mode = videoModeSelect.value;
    if (mode === 'webm') {
      return `<span class="text-[11px] text-sky-400 font-medium">(Video Web dengan Suara)</span>`;
    } else if (mode === 'animated_webp') {
      return `<span class="text-[11px] text-indigo-400 font-medium">(Animasi WebP Looping)</span>`;
    } else if (mode === 'poster_webp') {
      return `<span class="text-[11px] text-emerald-400 font-medium">(Cover Poster WebP)</span>`;
    }
  }
  return '';
}

// Tampilkan/sembunyikan opsi video ekstra (FPS, Durasi, Skala) & penjelasan mode
function updateVideoSettingsVisibility() {
  const mode = videoModeSelect.value;
  if (mode === 'animated_webp') {
    videoExtraSettings.classList.remove('hidden');
    videoExtraSettings.classList.add('flex');
    if (videoModeExplainer) {
      videoModeExplainer.textContent = 'Format animasi looping (.webp) tanpa suara. Ideal untuk pengganti GIF, klip pendek, atau hero banner.';
    }
  } else if (mode === 'poster_webp') {
    videoExtraSettings.classList.remove('flex');
    videoExtraSettings.classList.add('hidden');
    if (videoModeExplainer) {
      videoModeExplainer.textContent = 'Mengambil 1 frame cuplikan video menjadi gambar WebP tajam untuk cover poster video di web.';
    }
  } else {
    videoExtraSettings.classList.remove('flex');
    videoExtraSettings.classList.add('hidden');
    if (videoModeExplainer) {
      videoModeExplainer.textContent = 'Format video web Google dengan suara & durasi penuh. Sangat cocok untuk video rapat atau presentasi.';
    }
  }
}

videoModeSelect.addEventListener('change', () => {
  updateVideoSettingsVisibility();
  refreshQueueFilenames();
});

imageFormatSelect.addEventListener('change', () => {
  refreshQueueFilenames();
});

// Fungsi pembaruan label & deskripsi kualitas
function updateQualityDisplay(val) {
  qualityRange.value = val;
  qualityValue.textContent = `${val}%`;
  if (!qualityDescription) return;

  if (val <= 55) {
    qualityDescription.textContent = 'Kompresi Ekstrem (Paling Ringan)';
    qualityDescription.className = 'text-[11px] text-amber-400 font-semibold';
  } else if (val <= 74) {
    qualityDescription.textContent = 'Keseimbangan Web (Ideal)';
    qualityDescription.className = 'text-[11px] text-emerald-400 font-semibold';
  } else {
    qualityDescription.textContent = 'Kualitas Tinggi (Ketajaman Penuh)';
    qualityDescription.className = 'text-[11px] text-indigo-400 font-semibold';
  }
}

// Update label kualitas slider
qualityRange.addEventListener('input', (e) => {
  updateQualityDisplay(parseInt(e.target.value, 10));
});

// Event listener preset tombol cepat
if (presetExtreme) {
  presetExtreme.addEventListener('click', () => updateQualityDisplay(55));
}
if (presetBalanced) {
  presetBalanced.addEventListener('click', () => updateQualityDisplay(70));
}
if (presetHigh) {
  presetHigh.addEventListener('click', () => updateQualityDisplay(80));
}

// Hitung nama target berdasarkan format yang dipilih
function computeTargetFilename(item) {
  const baseName = item.file.name.replace(/\.[^/.]+$/, '');
  if (item.type === 'image') {
    const ext = imageFormatSelect.value; // 'webp' atau 'avif'
    return `${baseName}.${ext}`;
  } else {
    const mode = videoModeSelect.value;
    if (mode === 'animated_webp') {
      return `${baseName}.webp`;
    } else if (mode === 'poster_webp') {
      return `${baseName}-poster.webp`;
    } else if (mode === 'webm') {
      return `${baseName}.webm`;
    }
    return `${baseName}.webp`;
  }
}

// Perbarui nama target file yang belum selesai jika user mengubah format dropdown
function refreshQueueFilenames() {
  filesQueue.forEach(item => {
    if (item.status !== 'done') {
      item.newName = computeTargetFilename(item);
      const row = document.getElementById(`row-${item.id}`);
      if (row) {
        const targetEl = row.querySelector('.target-name');
        if (targetEl) targetEl.textContent = item.newName;
        const noteEl = row.querySelector('.target-note');
        if (noteEl) noteEl.innerHTML = getFormatNote(item);
      }
    }
  });
}

// Event Dropzone & File Input
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('border-indigo-500', 'bg-slate-800/80');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('border-indigo-500', 'bg-slate-800/80');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('border-indigo-500', 'bg-slate-800/80');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = ''; // Reset agar file yang sama bisa dipilih ulang jika dihapus
});

// Hapus semua daftar
clearBtn.addEventListener('click', () => {
  if (isConverting) {
    if (!confirm('Proses konversi sedang berjalan. Yakin ingin membatalkan dan menghapus semua antrean?')) {
      return;
    }
  }
  filesQueue = [];
  lastBatchDurationText = '';
  const etaBox = document.getElementById('etaBox');
  if (etaBox) etaBox.classList.add('hidden');
  renderFullList();
  updateGlobalStats();
});

// -------------------------------------------------------------
// SISTEM DETEKSI BERKAS MENDALAM (MAGIC HEADER, DIMENSI, METADATA)
// -------------------------------------------------------------

// Deteksi binary header signature (Magic Bytes) asli dari file
async function detectRealFileFormat(file) {
  try {
    const slice = file.slice(0, 32);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'PNG';

    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'JPEG';

    // GIF: 47 49 46 38 ('GIF8')
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'GIF';

    // WebP: 'RIFF' .... 'WEBP'
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'WebP';

    // AVIF: .... ftypavif or ftypavis or ftypmif1
    const ftyp = String.fromCharCode(...bytes.slice(4, 16));
    if (ftyp.includes('ftypavif') || ftyp.includes('ftypavis')) return 'AVIF';

    // MP4 / MOV / QuickTime: .... ftyp
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      const brand = String.fromCharCode(...bytes.slice(8, 12)).trim();
      return brand ? `MP4 (${brand})` : 'MP4';
    }

    // WebM / MKV: 1A 45 DF A3
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) return 'WebM';

    // BMP: 42 4D ('BM')
    if (bytes[0] === 0x42 && bytes[1] === 0x4D) return 'BMP';

    // SVG: <?xml or <svg
    const textSample = new TextDecoder().decode(bytes.slice(0, 24)).toLowerCase();
    if (textSample.includes('<?xml') || textSample.includes('<svg')) return 'SVG';

    const ext = file.name.split('.').pop().toUpperCase();
    return ext || (file.type ? file.type.split('/')[1].toUpperCase() : 'BERKAS');
  } catch (err) {
    return file.name.split('.').pop().toUpperCase() || 'BERKAS';
  }
}

// Hitung rasio aspek (16:9, 4:3, 1:1, dst)
function getAspectRatio(w, h) {
  if (!w || !h) return '';
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const d = gcd(w, h);
  const rW = Math.round(w / d);
  const rH = Math.round(h / d);
  if ((rW === 16 && rH === 9) || (rW === 9 && rH === 16)) return `${rW}:${rH}`;
  if ((rW === 4 && rH === 3) || (rW === 3 && rH === 4)) return `${rW}:${rH}`;
  if (rW === 1 && rH === 1) return '1:1 Persegi';
  if (rW === 21 && rH === 9) return '21:9 Ultrawide';
  return `${w}×${h}`;
}

// Label resolusi video (4K, 1080p, 720p, dst)
function getVideoResolutionLabel(w, h) {
  if (!w || !h) return 'Video';
  const maxDim = Math.max(w, h);
  const minDim = Math.min(w, h);
  if (maxDim >= 3800 || minDim >= 2100) return '4K UHD';
  if (maxDim >= 2500 || minDim >= 1400) return '2K QHD';
  if (maxDim >= 1900 || minDim >= 1000) return '1080p FHD';
  if (maxDim >= 1200 || minDim >= 700) return '720p HD';
  if (maxDim >= 800 || minDim >= 450) return '480p SD';
  return `${w}×${h}`;
}

// Format durasi video (mm:ss)
function formatDuration(sec) {
  if (!sec || isNaN(sec) || !isFinite(sec) || sec <= 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Format bitrate
function formatBitrate(bps) {
  if (!bps || bps <= 0) return '';
  if (bps >= 1000000) return `~${(bps / 1000000).toFixed(1)} Mbps`;
  return `~${Math.round(bps / 1000)} kbps`;
}

// Inspeksi mendalam file gambar: resolusi, MP, rasio, thumbnail
async function inspectImageFile(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const w = bitmap.width;
    const h = bitmap.height;
    bitmap.close();

    const thumbUrl = URL.createObjectURL(file);
    const mp = ((w * h) / 1000000).toFixed(1);

    return {
      valid: true,
      width: w,
      height: h,
      mp: mp,
      thumb: thumbUrl,
      ratio: getAspectRatio(w, h)
    };
  } catch (err) {
    return { valid: false, error: 'Berkas gambar tidak dapat dibaca (kemungkinan rusak)' };
  }
}

// Inspeksi mendalam file video: resolusi, durasi, bitrate, thumbnail poster frame
async function inspectVideoFile(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    let resolved = false;
    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      URL.revokeObjectURL(url);
      resolve({ valid: true, width: 0, height: 0, duration: 0, bitrate: 0, thumb: '' });
    }, 4000);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };

    video.onseeked = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);

      let thumbUrl = '';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(160, video.videoWidth || 160);
        canvas.height = Math.round((canvas.width * (video.videoHeight || 90)) / (video.videoWidth || 160));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbUrl = canvas.toDataURL('image/jpeg', 0.65);
        canvas.width = 0;
        canvas.height = 0;
      } catch (e) {}

      const w = video.videoWidth;
      const h = video.videoHeight;
      const dur = video.duration || 0;
      const bitrate = dur > 0 ? Math.round((file.size * 8) / dur) : 0;

      URL.revokeObjectURL(url);
      video.src = '';

      resolve({
        valid: true,
        width: w,
        height: h,
        duration: dur,
        bitrate: bitrate,
        thumb: thumbUrl,
        qualityLabel: getVideoResolutionLabel(w, h),
        ratio: getAspectRatio(w, h)
      });
    };

    video.onerror = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: 'Berkas video tidak didukung atau rusak' });
    };
  });
}

// Menjalankan deteksi dan inspeksi file secara menyeluruh
async function inspectAndDetectFile(item) {
  try {
    const realFormat = await detectRealFileFormat(item.file);
    item.meta.format = realFormat;

    if (item.type === 'image') {
      const res = await inspectImageFile(item.file);
      if (res.valid) {
        item.meta.specs = `${res.width}×${res.height} (${res.mp} MP • ${res.ratio})`;
        item.meta.thumb = res.thumb;
      } else {
        item.meta.isCorrupt = true;
        item.errorMsg = res.error;
      }
    } else {
      const res = await inspectVideoFile(item.file);
      if (res.valid) {
        const durText = formatDuration(res.duration);
        const resText = res.qualityLabel || (res.width ? `${res.width}×${res.height}` : 'Video');
        const brText = res.bitrate > 0 ? ` • ${formatBitrate(res.bitrate)}` : '';
        item.meta.specs = `${resText} • ${durText}${brText}`;
        item.meta.thumb = res.thumb;
      } else {
        item.meta.isCorrupt = true;
        item.errorMsg = res.error;
      }
    }

    item.meta.detected = true;
  } catch (err) {
    item.meta.detected = true;
  }

  updateItemRow(item);
}

// Menangani file yang masuk (Gambar dan Video)
function handleFiles(fileListInput) {
  const incomingFiles = Array.from(fileListInput);

  if (incomingFiles.length === 0) return;

  let addedImageCount = 0;
  let addedVideoCount = 0;
  let rejectedCount = 0;
  let duplicateCount = 0;

  const existingSignatures = new Set(filesQueue.map(f => `${f.file.name}_${f.file.size}_${f.file.lastModified}`));

  incomingFiles.forEach(file => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|ogv)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif|bmp|svg|tiff?|heic|heif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      rejectedCount++;
      return;
    }

    if (isVideo) addedVideoCount++;
    if (isImage) addedImageCount++;

    const sig = `${file.name}_${file.size}_${file.lastModified}`;
    const isDuplicate = existingSignatures.has(sig);
    if (isDuplicate) duplicateCount++;
    existingSignatures.add(sig);

    const type = isVideo ? 'video' : 'image';
    const item = {
      id: crypto.randomUUID(),
      file,
      type,
      status: 'pending', // pending | processing | done | error
      resultBlob: null,
      progress: 0,
      errorMsg: '',
      meta: {
        detected: false,
        format: '',
        specs: '',
        thumb: '',
        isDuplicate: isDuplicate,
        isCorrupt: false
      }
    };
    item.newName = computeTargetFilename(item);
    filesQueue.push(item);

    // Jalankan deteksi metadata mendalam secara asinkron
    inspectAndDetectFile(item);
  });

  const totalAdded = addedImageCount + addedVideoCount;

  if (totalAdded > 0) {
    // Efek visual dropzone berhasil menerima file
    dropzone.classList.remove('border-slate-600');
    dropzone.classList.add('border-emerald-500', 'bg-emerald-500/10');
    setTimeout(() => {
      dropzone.classList.remove('border-emerald-500', 'bg-emerald-500/10');
      dropzone.classList.add('border-slate-600');
    }, 1200);

    const details = [];
    if (addedImageCount > 0) details.push(`<strong>${addedImageCount}</strong> gambar`);
    if (addedVideoCount > 0) details.push(`<strong>${addedVideoCount}</strong> video`);

    let messageHtml = `Berhasil mendeteksi <strong>${totalAdded} file</strong> (${details.join(', ')}). Format, resolusi, dan spesifikasi terdeteksi otomatis!`;
    if (duplicateCount > 0) {
      messageHtml += `<br><span class="text-amber-300">⚠️ Terdeteksi ${duplicateCount} file duplikat dalam antrean.</span>`;
    }
    if (rejectedCount > 0) {
      messageHtml += `<br><span class="text-rose-300">Catatan: ${rejectedCount} berkas diabaikan karena bukan gambar/video.</span>`;
    }

    showToast('File Berhasil Dideteksi!', messageHtml, 'success', 5000);
  } else {
    showToast(
      'Gagal Mengupload File',
      'Format file tidak didukung. Mohon pilih file gambar (JPG, PNG, WebP, AVIF, GIF) atau video (MP4, WebM, MOV, MKV). Fitur konversi hanya akan aktif setelah file berhasil diupload.',
      'error',
      5500
    );
  }

  renderFullList();
  updateGlobalStats();
}

// Format bytes ke KB / MB / GB
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Render seluruh daftar file ke DOM (hanya dipanggil saat file ditambah/dihapus massal)
function renderFullList() {
  fileList.innerHTML = '';

  if (filesQueue.length === 0) {
    summaryBar.classList.add('hidden');
    convertBtn.disabled = true;
    downloadAllBtn.classList.add('hidden');
    if (downloadDirectTopBtn) downloadDirectTopBtn.classList.add('hidden');
    if (downloadSection) downloadSection.classList.add('hidden');
    if (bottomDownloadBar) bottomDownloadBar.classList.add('hidden');
    globalProgressContainer.classList.add('hidden');
    globalPercentText.classList.add('hidden');
    return;
  }

  summaryBar.classList.remove('hidden');

  const fragment = document.createDocumentFragment();
  filesQueue.forEach((item, index) => {
    const row = createRowElement(item, index);
    fragment.appendChild(row);
  });
  fileList.appendChild(fragment);
}

// Buat elemen baris untuk satu file (dilengkapi thumbnail pratinjau, nomor urut, & spesifikasi deteksi)
function createRowElement(item, index = 0) {
  const row = document.createElement('div');
  row.id = `row-${item.id}`;
  row.className = 'bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-slate-600';

  const isVideo = item.type === 'video';
  const isLarge = item.file.size >= 1024 * 1024 * 1024; // >= 1GB
  const isMediumLarge = item.file.size >= 300 * 1024 * 1024; // >= 300MB

  const numberBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-indigo-400 border border-indigo-500/30 font-mono shrink-0" title="Nomor antrean">#${index + 1}</span>`;

  const typeBadge = isVideo
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">Video</span>`
    : `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Gambar</span>`;

  const sizeBadge = isLarge
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">File Raksasa (&gt;1 GB)</span>`
    : (isMediumLarge ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300">File Besar</span>` : '');

  const thumbHtml = item.meta && item.meta.thumb
    ? `<div class="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0 shadow-inner">
         <img src="${item.meta.thumb}" class="w-full h-full object-cover" alt="Preview">
         ${isVideo ? `<div class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <svg class="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
            </svg>
          </div>` : ''}
       </div>`
    : `<div class="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 shrink-0 flex items-center justify-center">
        ${isVideo ? `
          <svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ` : `
          <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        `}
      </div>`;

  let metaBadges = '';
  if (item.meta && item.meta.detected) {
    if (item.meta.isCorrupt) {
      metaBadges = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">❌ Berkas Rusak</span>`;
    } else {
      metaBadges = `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-indigo-300 border border-slate-700" title="Format Asli Terdeteksi">${item.meta.format || item.type.toUpperCase()}</span>`;
      if (item.meta.specs) {
        metaBadges += `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900/80 text-slate-300 border border-slate-700/80">${item.meta.specs}</span>`;
      }
    }
    if (item.meta.isDuplicate) {
      metaBadges += `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠️ Duplikat</span>`;
    }
  } else {
    metaBadges = `<span class="px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-900 animate-pulse font-mono">Mendeteksi...</span>`;
  }

  row.innerHTML = `
    <div class="min-w-0 flex-1 flex items-start gap-3">
      <div class="thumb-slot shrink-0 mt-0.5">
        ${thumbHtml}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          ${numberBadge}
          <p class="text-sm font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">${item.file.name}</p>
          ${typeBadge}
          ${sizeBadge}
          <span class="meta-slot inline-flex items-center gap-1.5 flex-wrap">${metaBadges}</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">
          Asli: <span class="text-slate-300">${formatBytes(item.file.size)}</span> &rarr; Target: <span class="target-name text-indigo-400 font-semibold">${item.newName}</span> <span class="target-note">${getFormatNote(item)}</span>
        </p>
        <p class="error-msg-box text-[11px] text-rose-400 mt-1 hidden"></p>
      </div>
    </div>
    <div class="row-actions flex items-center gap-2.5 shrink-0 self-end sm:self-center">
      <div class="status-badge-slot">
        <span class="text-xs px-2.5 py-1 rounded bg-slate-700/80 text-slate-300 font-medium">Menunggu</span>
      </div>
      <div class="action-btn-slot"></div>
      <button class="remove-btn p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition" title="Hapus dari daftar">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  // Listener tombol hapus satuan (render ulang agar penomoran urut selalu konsisten)
  row.querySelector('.remove-btn').addEventListener('click', () => {
    filesQueue = filesQueue.filter(f => f.id !== item.id);
    renderFullList();
    updateGlobalStats();
  });

  return row;
}

// Pembaruan baris O(1) cepat tanpa me-render ulang seluruh daftar
function updateItemRow(item) {
  const row = document.getElementById(`row-${item.id}`);
  if (!row) return;

  const statusSlot = row.querySelector('.status-badge-slot');
  const actionSlot = row.querySelector('.action-btn-slot');
  const errorBox = row.querySelector('.error-msg-box');

  // Update thumbnail & spesifikasi deteksi jika asinkron selesai
  const thumbSlot = row.querySelector('.thumb-slot');
  const metaSlot = row.querySelector('.meta-slot');

  if (thumbSlot && item.meta && item.meta.thumb && !thumbSlot.querySelector('img')) {
    thumbSlot.innerHTML = `
      <div class="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0 shadow-inner">
        <img src="${item.meta.thumb}" class="w-full h-full object-cover" alt="Preview">
        ${item.type === 'video' ? `
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <svg class="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
            </svg>
          </div>` : ''}
      </div>
    `;
  }

  if (metaSlot && item.meta && item.meta.detected) {
    let badges = '';
    if (item.meta.isCorrupt) {
      badges = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">❌ Berkas Rusak</span>`;
    } else {
      badges = `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-indigo-300 border border-slate-700" title="Format Asli Terdeteksi">${item.meta.format || item.type.toUpperCase()}</span>`;
      if (item.meta.specs) {
        badges += `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900/80 text-slate-300 border border-slate-700/80">${item.meta.specs}</span>`;
      }
    }
    if (item.meta.isDuplicate) {
      badges += `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠️ Duplikat</span>`;
    }
    metaSlot.innerHTML = badges;
  }

  if (item.status === 'pending') {
    statusSlot.innerHTML = `<span class="text-xs px-2.5 py-1 rounded bg-slate-700/80 text-slate-300 font-medium">Menunggu</span>`;
    actionSlot.innerHTML = '';
    errorBox.classList.add('hidden');
  } else if (item.status === 'processing') {
    const pctText = item.progress > 0 ? ` (${item.progress}%)` : '';
    statusSlot.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        <span class="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-medium animate-pulse">
          Mengonversi${pctText}...
        </span>
      </div>
    `;
    actionSlot.innerHTML = '';
    errorBox.classList.add('hidden');
  } else if (item.status === 'done') {
    const savedPercent = Math.round((1 - item.resultBlob.size / item.file.size) * 100);
    const isSmaller = savedPercent > 0;
    const isSame = savedPercent === 0;
    let badgeColor = 'text-emerald-400';
    let changeText = `-${savedPercent}%`;

    if (!isSmaller && !isSame) {
      badgeColor = 'text-amber-400';
      changeText = `+${Math.abs(savedPercent)}% (File Asli Sangat Padat)`;
    } else if (isSame) {
      badgeColor = 'text-slate-300';
      changeText = '0%';
    }

    const durText = item.durationSec ? ` • ⏱️ ${item.durationSec}s` : '';

    statusSlot.innerHTML = `
      <div class="text-left sm:text-right">
        <span class="text-xs font-semibold ${badgeColor}">
          ${formatBytes(item.resultBlob.size)} <span class="text-[11px] font-normal text-slate-400">(${changeText}${durText})</span>
        </span>
      </div>
    `;

    const downloadUrl = URL.createObjectURL(item.resultBlob);
    actionSlot.innerHTML = `
      <a href="${downloadUrl}" download="${item.newName}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition shadow-sm">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        Unduh
      </a>
    `;
    errorBox.classList.add('hidden');
  } else if (item.status === 'error') {
    statusSlot.innerHTML = `<span class="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium">Gagal</span>`;
    actionSlot.innerHTML = `
      <button class="retry-single-btn inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white rounded-lg transition shadow-sm" title="Ulangi konversi file ini tanpa upload ulang">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Coba Lagi</span>
      </button>
    `;
    const retryBtn = actionSlot.querySelector('.retry-single-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => convertSingleItem(item));
    }
    if (item.errorMsg) {
      errorBox.innerHTML = `<span class="inline-flex items-center gap-1 font-medium"><span>Penyebab:</span> <span class="text-rose-300 font-normal">${item.errorMsg}</span></span>`;
      errorBox.classList.remove('hidden');
    }
  }

  updateGlobalStats();
}

// Konversi single item (untuk retry tanpa upload ulang)
async function convertSingleItem(item) {
  if (isConverting) {
    showToast('Harap Tunggu', 'Proses konversi massal sedang berlangsung.', 'warning', 3000);
    return;
  }

  const quality = parseInt(qualityRange.value, 10);
  const imageFormat = imageFormatSelect.value;
  const imageMaxDim = imageMaxDimSelect ? imageMaxDimSelect.value : '1920';
  const videoMode = videoModeSelect.value;
  const videoFps = parseInt(videoFpsSelect.value, 10);
  const videoDuration = parseInt(videoDurationSelect.value, 10);
  const videoScale = parseFloat(videoScaleSelect.value);

  item.status = 'processing';
  item.progress = 0;
  item.errorMsg = '';
  updateItemRow(item);
  updateGlobalStats();

  const singleStartTime = Date.now();

  try {
    if (item.type === 'image') {
      if (imageFormat === 'webp') {
        item.resultBlob = await convertImageToWebP(item.file, quality, imageMaxDim);
      } else {
        item.resultBlob = await convertImageToAvif(item.file, quality, imageMaxDim);
      }
    } else {
      if (videoMode === 'animated_webp') {
        item.resultBlob = await convertVideoToAnimatedWebP(item.file, {
          quality,
          fps: videoFps,
          maxDuration: videoDuration,
          scale: videoScale,
          onProgress: (pct) => {
            item.progress = pct;
            updateItemRow(item);
          }
        });
      } else if (videoMode === 'poster_webp') {
        item.resultBlob = await convertVideoToPosterWebP(item.file, quality);
      } else if (videoMode === 'webm') {
        item.resultBlob = await convertVideoToWebM(item.file, quality, (pct) => {
          item.progress = pct;
          updateItemRow(item);
        });
      }
    }
    item.status = 'done';
    item.durationSec = ((Date.now() - singleStartTime) / 1000).toFixed(1);
    showToast('Berhasil Diulang', `File <strong>${item.file.name}</strong> berhasil dikonversi ulang dalam <strong>${item.durationSec} detik</strong>!`, 'success', 3500);
  } catch (err) {
    console.error('Error retry:', item.file.name, err);
    item.status = 'error';
    item.errorMsg = err.message || 'Gagal memproses file';
    showToast('Gagal Mengulang', `File <strong>${item.file.name}</strong> masih gagal: ${item.errorMsg}`, 'error', 4500);
  }

  updateItemRow(item);
  updateGlobalStats();
}

// Update statistik ringkasan dan progress bar global
function updateGlobalStats() {
  const total = filesQueue.length;
  if (total === 0) {
    summaryBar.classList.add('hidden');
    convertBtn.disabled = true;
    downloadAllBtn.classList.add('hidden');
    if (downloadDirectTopBtn) downloadDirectTopBtn.classList.add('hidden');
    if (downloadSection) downloadSection.classList.add('hidden');
    if (bottomDownloadBar) bottomDownloadBar.classList.add('hidden');
    globalProgressContainer.classList.add('hidden');
    globalPercentText.classList.add('hidden');
    if (videoSettingsBox) videoSettingsBox.classList.remove('ring-2', 'ring-sky-500/50', 'bg-slate-900/70', 'opacity-60');
    if (imageSettingsBox) imageSettingsBox.classList.remove('ring-2', 'ring-indigo-500/50', 'bg-slate-900/70', 'opacity-60');
    if (uploadRequirementHint) {
      uploadRequirementHint.className = 'text-xs text-amber-400/90 flex items-center gap-1.5 font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20';
      uploadRequirementHint.innerHTML = `
        <svg class="w-4 h-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Wajib upload file terlebih dahulu agar tombol konversi aktif</span>
      `;
    }
    return;
  }

  summaryBar.classList.remove('hidden');
  const completedItems = filesQueue.filter(item => item.status === 'done' && item.resultBlob);
  const countDone = completedItems.length;
  const countError = filesQueue.filter(item => item.status === 'error').length;
  const countProcessed = countDone + countError;

  const hasVideos = filesQueue.some(f => f.type === 'video');
  const hasImages = filesQueue.some(f => f.type === 'image');

  if (videoSettingsBox) {
    if (hasVideos) {
      videoSettingsBox.classList.add('ring-2', 'ring-sky-500/50', 'bg-slate-900/70');
      videoSettingsBox.classList.remove('opacity-60');
    } else {
      videoSettingsBox.classList.remove('ring-2', 'ring-sky-500/50', 'bg-slate-900/70');
      if (hasImages) videoSettingsBox.classList.add('opacity-60');
      else videoSettingsBox.classList.remove('opacity-60');
    }
  }

  if (imageSettingsBox) {
    if (hasImages) {
      imageSettingsBox.classList.add('ring-2', 'ring-indigo-500/50', 'bg-slate-900/70');
      imageSettingsBox.classList.remove('opacity-60');
    } else {
      imageSettingsBox.classList.remove('ring-2', 'ring-indigo-500/50', 'bg-slate-900/70');
      if (hasVideos) imageSettingsBox.classList.add('opacity-60');
      else imageSettingsBox.classList.remove('opacity-60');
    }
  }

  let html = `<span class="font-semibold text-slate-200">${total} file dipilih</span>`;
  if (countProcessed > 0) {
    html += ` <span class="text-slate-500 font-normal">&bull;</span> <span class="text-emerald-400 font-medium">✓ ${countDone} selesai</span>`;
    if (countError > 0) {
      html += ` <span class="text-rose-400 font-medium ml-1.5">✕ ${countError} gagal</span>`;
    }
  }
  fileCountText.innerHTML = html;

  // Indikator status syarat upload
  if (uploadRequirementHint) {
    uploadRequirementHint.className = 'text-xs text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20';
    uploadRequirementHint.innerHTML = `
      <svg class="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>File berhasil dimuat (${total} file). Fitur konversi aktif & siap digunakan!</span>
    `;
  }

  // Global progress bar
  if (isConverting || countProcessed > 0) {
    globalProgressContainer.classList.remove('hidden');
    globalPercentText.classList.remove('hidden');
    const percent = Math.round((countProcessed / total) * 100);
    globalProgressBar.style.width = `${percent}%`;
    globalPercentText.textContent = `${percent}%`;
  }

  // Tombol Unduh Semua (ZIP & File Langsung) HANYA muncul dan aktif jika SELURUH file antrean telah selesai diproses!
  const allCompleted = total > 0 && countProcessed === total && !isConverting && countDone > 0;
  downloadAllBtn.classList.toggle('hidden', !allCompleted);
  if (downloadDirectTopBtn) downloadDirectTopBtn.classList.toggle('hidden', !allCompleted);
  if (downloadSection) downloadSection.classList.toggle('hidden', !allCompleted);
  if (bottomDownloadBar) bottomDownloadBar.classList.toggle('hidden', !allCompleted);

  if (allCompleted) {
    const origBytes = completedItems.reduce((acc, it) => acc + it.file.size, 0);
    const resultBytes = completedItems.reduce((acc, it) => acc + it.resultBlob.size, 0);
    const savedPct = Math.round((1 - resultBytes / origBytes) * 100);
    const isSmaller = savedPct > 0;

    if (completedCountText) {
      const durLabel = lastBatchDurationText ? ` dalam <span class="text-white font-bold">${lastBatchDurationText}</span>` : '';
      completedCountText.innerHTML = `
        <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span><strong>Semua ${countDone} file</strong> telah selesai dikonversi${durLabel}!</span>
      `;
    }
    if (totalSavedText) {
      totalSavedText.textContent = `Total ukuran baru: ${formatBytes(resultBytes)} (${isSmaller ? 'Hemat ' + savedPct + '%' : 'Selesai'})`;
    }
  }

  // Status tombol konversi & aksi retry
  if (!isConverting) {
    if (countError > 0) {
      convertBtn.disabled = false;
      convertBtn.innerHTML = `
        <span class="inline-flex items-center gap-1.5">
          <svg class="w-4 h-4 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Ulangi yang Gagal (${countError})
        </span>
      `;
      convertBtn.className = 'px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-sm transition shadow-sm hover:shadow-amber-500/25 cursor-pointer';
    } else if (countDone === total && total > 0) {
      convertBtn.disabled = true;
      convertBtn.innerHTML = `Semua Berhasil Dikonversi`;
      convertBtn.className = 'px-5 py-2.5 bg-slate-700 text-slate-400 cursor-not-allowed font-medium rounded-lg text-sm transition';
    } else {
      convertBtn.disabled = total === 0;
      convertBtn.innerHTML = `Konversi Semua`;
      convertBtn.className = 'px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition shadow-sm hover:shadow-indigo-500/25';
    }
  }
}

// -------------------------------------------------------------
// KONVERSI GAMBAR (DENGAN PEMBERSIHAN MEMORI GPU/VRAM & RESIZE WEB)
// -------------------------------------------------------------
async function convertImageToWebP(file, quality, maxDim = '1920') {
  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;

  // Batas maksimal dimensi untuk web
  const limit = maxDim === 'original' ? 16384 : Math.min(parseInt(maxDim, 10) || 1920, 16384);
  if (w > limit || h > limit) {
    const ratio = Math.min(limit / w, limit / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        canvas.width = 0;
        canvas.height = 0;
        return reject(new Error('Gagal mengonversi gambar ke WebP'));
      }

      // Jika hasil kompresi ternyata lebih besar dari file asli (misal JPG/WebP asli sudah sangat terkompresi)
      // dan user menggunakan kualitas cukup tinggi (> 50), coba optimasi otomatis agar ukuran berkurang
      if (blob.size > file.size && quality > 50) {
        const retryBlob = await new Promise(r => canvas.toBlob(r, 'image/webp', Math.max(0.35, (quality - 25) / 100)));
        canvas.width = 0;
        canvas.height = 0;
        if (retryBlob && retryBlob.size < blob.size) {
          return resolve(retryBlob);
        }
      } else {
        canvas.width = 0;
        canvas.height = 0;
      }

      resolve(blob);
    }, 'image/webp', quality / 100);
  });
}

// Konversi Gambar ke AVIF (menggunakan WebAssembly @jsquash/avif)
async function convertImageToAvif(file, quality, maxDim = '1920') {
  if (!avifEncodeModule) {
    const mod = await import('https://esm.sh/@jsquash/avif@1.3.0/encode');
    avifEncodeModule = mod.default;
  }

  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;

  const limit = maxDim === 'original' ? 8192 : Math.min(parseInt(maxDim, 10) || 1920, 8192);
  if (w > limit || h > limit) {
    const ratio = Math.min(limit / w, limit / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, w, h);
  // Bebaskan memori canvas segera
  canvas.width = 0;
  canvas.height = 0;

  const avifBuffer = await avifEncodeModule(imageData, {
    quality: quality,
    speed: 6
  });

  return new Blob([avifBuffer], { type: 'image/avif' });
}

// -------------------------------------------------------------
// KONVERSI VIDEO: Ekstraksi Subchunk & Muxing WebP Animasi
// -------------------------------------------------------------
function extractFrameSubChunks(uint8) {
  const view = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);
  let offset = 12; // Lewati 'RIFF' (4), FileSize (4), 'WEBP' (4)
  const subChunks = [];
  let hasAlpha = false;

  while (offset + 8 <= uint8.length) {
    const fourCC = String.fromCharCode(
      uint8[offset],
      uint8[offset + 1],
      uint8[offset + 2],
      uint8[offset + 3]
    );
    const chunkSize = view.getUint32(offset + 4, true);
    const paddedSize = chunkSize + (chunkSize % 2);
    const totalLength = 8 + paddedSize;

    if (fourCC === 'VP8X') {
      const flags = uint8[offset + 8];
      if (flags & 0x10) hasAlpha = true;
    } else if (fourCC === 'ALPH' || fourCC === 'VP8 ' || fourCC === 'VP8L') {
      if (fourCC === 'ALPH') hasAlpha = true;
      subChunks.push(uint8.slice(offset, offset + totalLength));
    }

    offset += totalLength;
  }

  return { subChunks, hasAlpha };
}

function assembleAnimatedWebP(frames, width, height, loopCount = 0) {
  const anyAlpha = frames.some(f => f.hasAlpha);

  const preparedFrames = frames.map(f => {
    let subChunksLen = 0;
    for (const sc of f.subChunks) subChunksLen += sc.length;

    const payloadSize = 16 + subChunksLen;
    const padding = payloadSize % 2;
    const totalChunkLen = 8 + payloadSize + padding;

    return {
      frame: f,
      payloadSize,
      padding,
      totalChunkLen
    };
  });

  const anmfTotalBytes = preparedFrames.reduce((acc, pf) => acc + pf.totalChunkLen, 0);
  const totalFileSize = 12 + 18 + 14 + anmfTotalBytes;
  const buffer = new Uint8Array(totalFileSize);
  const view = new DataView(buffer.buffer);

  let offset = 0;

  // 1. RIFF Header
  buffer.set([0x52, 0x49, 0x46, 0x46], offset); // 'RIFF'
  view.setUint32(offset + 4, totalFileSize - 8, true);
  buffer.set([0x57, 0x45, 0x42, 0x50], offset + 8); // 'WEBP'
  offset += 12;

  // 2. VP8X Extended Header Chunk
  buffer.set([0x56, 0x50, 0x38, 0x58], offset); // 'VP8X'
  view.setUint32(offset + 4, 10, true);
  buffer[offset + 8] = 0x02 | (anyAlpha ? 0x10 : 0);
  buffer[offset + 9] = 0;
  buffer[offset + 10] = 0;
  buffer[offset + 11] = 0;
  const wm1 = width - 1;
  buffer[offset + 12] = wm1 & 0xFF;
  buffer[offset + 13] = (wm1 >> 8) & 0xFF;
  buffer[offset + 14] = (wm1 >> 16) & 0xFF;
  const hm1 = height - 1;
  buffer[offset + 15] = hm1 & 0xFF;
  buffer[offset + 16] = (hm1 >> 8) & 0xFF;
  buffer[offset + 17] = (hm1 >> 16) & 0xFF;
  offset += 18;

  // 3. ANIM Chunk
  buffer.set([0x41, 0x4E, 0x49, 0x4D], offset); // 'ANIM'
  view.setUint32(offset + 4, 6, true);
  buffer[offset + 8] = 0;
  buffer[offset + 9] = 0;
  buffer[offset + 10] = 0;
  buffer[offset + 11] = 0;
  view.setUint16(offset + 12, loopCount, true);
  offset += 14;

  // 4. ANMF Chunks
  for (const pf of preparedFrames) {
    buffer.set([0x41, 0x4E, 0x4D, 0x46], offset); // 'ANMF'
    view.setUint32(offset + 4, pf.payloadSize, true);

    buffer[offset + 8] = 0;
    buffer[offset + 9] = 0;
    buffer[offset + 10] = 0;
    buffer[offset + 11] = 0;
    buffer[offset + 12] = 0;
    buffer[offset + 13] = 0;
    buffer[offset + 14] = wm1 & 0xFF;
    buffer[offset + 15] = (wm1 >> 8) & 0xFF;
    buffer[offset + 16] = (wm1 >> 16) & 0xFF;
    buffer[offset + 17] = hm1 & 0xFF;
    buffer[offset + 18] = (hm1 >> 8) & 0xFF;
    buffer[offset + 19] = (hm1 >> 16) & 0xFF;
    const dur = pf.frame.duration || 100;
    buffer[offset + 20] = dur & 0xFF;
    buffer[offset + 21] = (dur >> 8) & 0xFF;
    buffer[offset + 22] = (dur >> 16) & 0xFF;
    buffer[offset + 23] = 0x01; // overwrite

    let subOffset = offset + 24;
    for (const sc of pf.frame.subChunks) {
      buffer.set(sc, subOffset);
      subOffset += sc.length;
    }

    if (pf.padding) {
      buffer[subOffset] = 0;
    }

    offset += pf.totalChunkLen;
  }

  return new Blob([buffer], { type: 'image/webp' });
}

// Konversi Video ke Animasi WebP (.webp)
async function convertVideoToAnimatedWebP(file, { quality = 80, fps = 12, maxDuration = 10, scale = 1, onProgress }) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;

    video.onloadedmetadata = async () => {
      try {
        const vidDuration = video.duration && !isNaN(video.duration) ? video.duration : maxDuration;
        const duration = Math.min(vidDuration, maxDuration);
        const frameInterval = 1 / fps;
        const totalFrames = Math.max(1, Math.floor(duration * fps));

        let w = Math.round(video.videoWidth * scale);
        let h = Math.round(video.videoHeight * scale);
        if (w % 2 !== 0) w--;
        if (h % 2 !== 0) h--;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const frameDelayMs = Math.round(1000 / fps);
        const frames = [];

        for (let i = 0; i < totalFrames; i++) {
          const targetTime = i * frameInterval;
          video.currentTime = targetTime;

          await new Promise((resSeek) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resSeek();
            };
            video.addEventListener('seeked', onSeeked);
          });

          ctx.drawImage(video, 0, 0, w, h);

          const frameBlob = await new Promise(r => canvas.toBlob(r, 'image/webp', quality / 100));
          const arrayBuffer = await frameBlob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);

          const extracted = extractFrameSubChunks(uint8);
          frames.push({
            subChunks: extracted.subChunks,
            hasAlpha: extracted.hasAlpha,
            duration: frameDelayMs
          });

          if (onProgress) {
            onProgress(Math.round(((i + 1) / totalFrames) * 100));
          }
        }

        // Bersihkan memori canvas & video
        canvas.width = 0;
        canvas.height = 0;
        URL.revokeObjectURL(videoUrl);
        video.src = '';

        const animatedWebpBlob = assembleAnimatedWebP(frames, w, h, 0);
        resolve(animatedWebpBlob);
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Format video tidak didukung atau video rusak.'));
    };
  });
}

// Konversi Video ke Poster Cover Gambar WebP (.webp)
async function convertVideoToPosterWebP(file, quality) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        URL.revokeObjectURL(videoUrl);

        canvas.toBlob((blob) => {
          canvas.width = 0;
          canvas.height = 0;
          if (blob) resolve(blob);
          else reject(new Error('Gagal mengekspor poster WebP'));
        }, 'image/webp', quality / 100);
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Gagal memuat file video'));
    };
  });
}

// Konversi Video ke WebM (Bitrate dinamis adaptif dihitung dari bitrate asli & slider kualitas)
async function convertVideoToWebM(file, quality = 80, onProgress) {
  if (file.type === 'video/webm' || file.name.endsWith('.webm')) {
    // Tetap diproses agar file WebM juga bisa dikompresi sesuai slider kualitas
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    video.onloadedmetadata = async () => {
      try {
        // Deteksi durasi video yang akurat (tangani bug Chrome di mana duration = Infinity)
        if (!video.duration || !isFinite(video.duration) || isNaN(video.duration) || video.duration <= 0) {
          video.currentTime = Number.MAX_SAFE_INTEGER || 1e10;
          await new Promise((resDur) => {
            let handled = false;
            const onTime = () => {
              if (handled) return;
              handled = true;
              video.removeEventListener('timeupdate', onTime);
              video.currentTime = 0;
              resDur();
            };
            video.addEventListener('timeupdate', onTime);
            setTimeout(() => {
              if (handled) return;
              handled = true;
              video.removeEventListener('timeupdate', onTime);
              video.currentTime = 0;
              resDur();
            }, 500);
          });
        }

        const duration = (video.duration && isFinite(video.duration) && video.duration > 0) ? video.duration : 10;
        // Hitung bitrate asli video (bit per detik)
        const originalBitrate = Math.round((file.size * 8) / duration);

        // FORMULA KOMPRESI CERDAS RELATIF TERHADAP BITRATE ASLI:
        // Menjamin ukuran video hasil konversi SELALU BERKURANG (tidak pernah membengkak!)
        // Slider 10% - 100%:
        // Quality 100% -> target ~78% dari bitrate asli (dijamin hemat minimal ~22%)
        // Quality 84%  -> target ~65% dari bitrate asli (hemat ~35%)
        // Quality 80%  -> target ~62% dari bitrate asli (hemat ~38%)
        // Quality 70%  -> target ~52% dari bitrate asli (hemat ~48%)
        // Quality 55%  -> target ~38% dari bitrate asli (hemat ~62%)
        // Quality 20%  -> target ~20% dari bitrate asli (hemat ~80%)
        const compressionRatio = 0.12 + Math.pow(quality / 100, 1.4) * 0.66;
        let targetVideoBitrate = Math.round(originalBitrate * compressionRatio);

        // Batas maksimal untuk web (maksimal ~1.8 Mbps agar video web tetap ringan)
        const maxWebBitrate = Math.round(350000 + Math.pow(quality / 100, 1.6) * 1450000);
        targetVideoBitrate = Math.min(targetVideoBitrate, maxWebBitrate);

        // Batas minimal 80 kbps agar tidak blur total
        targetVideoBitrate = Math.max(80000, targetVideoBitrate);

        // Proteksi mutlak: target bitrate TIDAK BOLEH melebihi 85% dari bitrate asli
        if (targetVideoBitrate >= originalBitrate * 0.90 && originalBitrate > 100000) {
          targetVideoBitrate = Math.round(originalBitrate * 0.80);
        }

        const stream = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
        if (!stream) {
          URL.revokeObjectURL(videoUrl);
          throw new Error('captureStream tidak didukung oleh browser Anda.');
        }

        let mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp9';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'video/webm;codecs=vp8';
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
              }
            }
          }
        }

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: targetVideoBitrate,
          audioBitsPerSecond: 64000 // Audio Opus 64 kbps (kualitas tinggi & hemat bandwidth)
        });
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const webmBlob = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(videoUrl);
          video.src = '';
          resolve(webmBlob);
        };

        video.ontimeupdate = () => {
          if (video.duration && isFinite(video.duration) && onProgress) {
            onProgress(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
          }
        };

        recorder.start();
        await video.play();

        video.onended = () => {
          if (onProgress) onProgress(100);
          recorder.stop();
        };
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Gagal membaca data video'));
    };
  });
}

// -------------------------------------------------------------
// PROSES KONVERSI MASSAL (SEKUENSIAL & AMAN MEMORI)
// -------------------------------------------------------------
// Helper format estimasi waktu
function formatEtaDuration(seconds) {
  if (seconds <= 2) return 'hampir selesai...';
  if (seconds < 60) return `~${Math.round(seconds)} detik`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `~${m} mnt ${s > 0 ? s + ' dtk' : ''}`;
}

// -------------------------------------------------------------
// PROSES KONVERSI MASSAL (SEKUENSIAL, AMAN MEMORI & ESTIMASI WAKTU)
// -------------------------------------------------------------
convertBtn.addEventListener('click', async () => {
  if (isConverting) return;
  isConverting = true;

  const quality = parseInt(qualityRange.value, 10);
  const imageFormat = imageFormatSelect.value;
  const imageMaxDim = imageMaxDimSelect ? imageMaxDimSelect.value : '1920';
  const videoMode = videoModeSelect.value;
  const videoFps = parseInt(videoFpsSelect.value, 10);
  const videoDuration = parseInt(videoDurationSelect.value, 10);
  const videoScale = parseFloat(videoScaleSelect.value);

  convertBtn.disabled = true;
  globalStatusDot.classList.add('animate-ping');
  convertBtn.innerHTML = `
    <span class="inline-flex items-center gap-2">
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Sedang Mengonversi...
    </span>
  `;

  const startTime = Date.now();
  let doneProcessed = 0;
  const etaBox = document.getElementById('etaBox');
  const etaText = document.getElementById('etaText');
  const speedRateText = document.getElementById('speedRateText');
  const etaIconSlot = document.getElementById('etaIconSlot');
  const etaStatusText = document.getElementById('etaStatusText');
  const elapsedLiveText = document.getElementById('elapsedLiveText');

  if (etaBox) {
    etaBox.classList.remove('hidden');
    etaBox.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-900/80 px-3.5 py-2.5 rounded-xl border border-sky-500/30 transition';
    if (etaIconSlot) {
      etaIconSlot.innerHTML = `
        <svg class="w-4 h-4 animate-spin text-sky-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      `;
    }
    if (etaStatusText) {
      etaStatusText.innerHTML = 'Estimasi sisa waktu: <strong id="etaText" class="text-white font-semibold">Menghitung...</strong>';
    }
    if (speedRateText) speedRateText.textContent = '';
    if (elapsedLiveText) elapsedLiveText.textContent = '00:00';
  }

  // Interval stopwatch real-time
  const liveTimer = setInterval(() => {
    if (!isConverting) {
      clearInterval(liveTimer);
      return;
    }
    const elapsedTotalSec = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsedTotalSec / 60);
    const s = elapsedTotalSec % 60;
    const timeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const el = document.getElementById('elapsedLiveText');
    if (el) el.textContent = timeFormatted;
  }, 1000);

  for (let item of filesQueue) {
    if (item.status === 'done') continue;
    const itemStartTime = Date.now();

    item.status = 'processing';
    item.progress = 0;
    item.errorMsg = '';
    updateItemRow(item);

    try {
      if (item.type === 'image') {
        if (imageFormat === 'webp') {
          item.resultBlob = await convertImageToWebP(item.file, quality, imageMaxDim);
        } else {
          item.resultBlob = await convertImageToAvif(item.file, quality, imageMaxDim);
        }
      } else {
        // Video
        if (videoMode === 'animated_webp') {
          item.resultBlob = await convertVideoToAnimatedWebP(item.file, {
            quality,
            fps: videoFps,
            maxDuration: videoDuration,
            scale: videoScale,
            onProgress: (pct) => {
              item.progress = pct;
              updateItemRow(item);
            }
          });
        } else if (videoMode === 'poster_webp') {
          item.resultBlob = await convertVideoToPosterWebP(item.file, quality);
        } else if (videoMode === 'webm') {
          item.resultBlob = await convertVideoToWebM(item.file, quality, (pct) => {
            item.progress = pct;
            updateItemRow(item);
          });
        }
      }

      item.status = 'done';
      item.durationSec = ((Date.now() - itemStartTime) / 1000).toFixed(1);
    } catch (err) {
      console.error('Error konversi:', item.file.name, err);
      item.status = 'error';
      item.errorMsg = err.message || 'Gagal memproses file';
      item.durationSec = ((Date.now() - itemStartTime) / 1000).toFixed(1);
    }

    doneProcessed++;
    const remaining = filesQueue.filter(f => f.status === 'pending' || f.status === 'processing').length;
    const elapsedSec = (Date.now() - startTime) / 1000;
    if (elapsedSec > 0 && doneProcessed > 0 && remaining > 0) {
      const avgSecPerFile = elapsedSec / doneProcessed;
      const etaSec = avgSecPerFile * remaining;
      const curEtaText = document.getElementById('etaText');
      const curSpeedText = document.getElementById('speedRateText');
      if (curEtaText) curEtaText.textContent = formatEtaDuration(etaSec);
      if (curSpeedText) curSpeedText.textContent = `(~${avgSecPerFile.toFixed(1)} dtk/file • sisa ${remaining} file)`;
    }

    updateItemRow(item);

    // Beri jeda 1 tick agar browser dapat membersihkan memori dan me-render animasi dengan mulus
    await new Promise(r => setTimeout(r, 10));
  }

  clearInterval(liveTimer);
  isConverting = false;

  const totalDurationSec = (Date.now() - startTime) / 1000;
  if (totalDurationSec < 60) {
    lastBatchDurationText = `${totalDurationSec.toFixed(1)} detik`;
  } else {
    const m = Math.floor(totalDurationSec / 60);
    const s = Math.round(totalDurationSec % 60);
    lastBatchDurationText = `${m} mnt ${s > 0 ? s + ' dtk' : ''}`;
  }

  const avgSecFinal = doneProcessed > 0 ? (totalDurationSec / doneProcessed).toFixed(1) : '0';

  if (etaBox) {
    etaBox.classList.remove('hidden');
    etaBox.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-emerald-500/10 px-3.5 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-300 transition';
    etaBox.innerHTML = `
      <div class="flex items-center gap-2 font-medium">
        <div class="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span>Konversi Selesai! Total durasi waktu: <strong class="text-white">${lastBatchDurationText}</strong></span>
      </div>
      <div class="flex items-center gap-2.5 text-[11px] text-emerald-300 self-end sm:self-auto font-mono">
        <span>Rata-rata: ~${avgSecFinal} dtk/file</span>
        <span class="text-emerald-500/50">|</span>
        <span>${doneProcessed} file selesai</span>
      </div>
    `;
  }

  globalStatusDot.classList.remove('animate-ping');
  updateGlobalStats();

  const totalDone = filesQueue.filter(i => i.status === 'done').length;
  const totalError = filesQueue.filter(i => i.status === 'error').length;
  if (totalDone > 0 && totalDone === filesQueue.length) {
    showToast(
      'Konversi Selesai!',
      `Seluruh <strong>${totalDone} file</strong> telah berhasil dikonversi dalam waktu <strong>${lastBatchDurationText}</strong>! Tombol <strong>Unduh Semua (ZIP)</strong> dan <strong>Unduh Semua (File Langsung)</strong> sekarang aktif & siap digunakan.`,
      'success',
      6000
    );
  } else if (totalDone > 0 && totalError > 0) {
    showToast(
      'Konversi Selesai Sebagian',
      `<strong>${totalDone} file</strong> berhasil diproses dalam <strong>${lastBatchDurationText}</strong>, namun <strong>${totalError} file</strong> gagal diproses. Anda dapat menekan tombol <strong>Coba Lagi</strong> pada berkas terkait tanpa perlu upload ulang.`,
      'warning',
      6500
    );
  } else if (totalDone === 0 && totalError > 0) {
    showToast(
      'Konversi Gagal',
      `Seluruh <strong>${totalError} file</strong> gagal diproses setelah ${lastBatchDurationText}. Silakan periksa rincian pesan error pada baris berkas terkait.`,
      'error',
      5500
    );
  }
});

// -------------------------------------------------------------
// PENGUNDUHAN MASSAL: ZIP & LANGSUNG KE DISK (TANPA KLIK SATU-SATU)
// -------------------------------------------------------------

// 1. Unduh Semua sebagai satu paket file ZIP
async function handleDownloadZip(triggerBtn) {
  if (isConverting) {
    showToast('Konversi Sedang Berjalan', 'Harap tunggu hingga semua file selesai dikonversi sebelum mengunduh ZIP.', 'warning', 3500);
    return;
  }

  const completedItems = filesQueue.filter(item => item.status === 'done' && item.resultBlob);
  if (completedItems.length === 0) {
    showToast('Belum Ada File Selesai', 'Belum ada file yang selesai dikonversi untuk diunduh.', 'warning', 3500);
    return;
  }

  if (completedItems.length < filesQueue.length) {
    const remaining = filesQueue.length - completedItems.length;
    showToast('Proses Belum Selesai', `Masih ada ${remaining} file yang belum selesai dikonversi. Harap selesaikan semua file terlebih dahulu.`, 'warning', 4000);
    return;
  }

  const totalSize = completedItems.reduce((acc, it) => acc + (it.resultBlob ? it.resultBlob.size : 0), 0);
  if (totalSize > 1.5 * 1024 * 1024 * 1024) { // > 1.5 GB
    const proceed = confirm(
      `Peringatan: Total ukuran file hasil konversi mencapai ${formatBytes(totalSize)}. ` +
      `Membuat file ZIP di atas 1.5 GB di dalam browser dapat membebani memori RAM dan berisiko gagal di beberapa perangkat. ` +
      `Apakah Anda tetap ingin mencoba membuat ZIP? (Atau pilih Batal untuk menggunakan tombol 'Unduh Semua (File Langsung)').`
    );
    if (!proceed) return;
  }

  const originalText = triggerBtn ? triggerBtn.textContent : '';
  if (triggerBtn) {
    triggerBtn.textContent = 'Menyiapkan ZIP (0%)...';
    triggerBtn.disabled = true;
  }

  try {
    const zip = new JSZip();

    completedItems.forEach(item => {
      zip.file(item.newName, item.resultBlob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      if (triggerBtn) {
        triggerBtn.textContent = `Menyiapkan ZIP (${Math.round(metadata.percent)}%)...`;
      }
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `conferti-export-${Date.now()}.zip`;
    link.click();
  } catch (err) {
    console.error('Gagal membuat ZIP:', err);
    alert('Terjadi kesalahan saat membuat file ZIP.');
  } finally {
    if (triggerBtn) {
      triggerBtn.textContent = originalText;
      triggerBtn.disabled = false;
    }
  }
}

// 2. Unduh Semua File Langsung ke Komputer (Satu-Per-Satu Otomatis, Tanpa ZIP)
async function handleDownloadDirect(triggerBtn) {
  if (isConverting) {
    showToast('Konversi Sedang Berjalan', 'Harap tunggu hingga semua file selesai dikonversi sebelum mengunduh.', 'warning', 3500);
    return;
  }

  const completedItems = filesQueue.filter(item => item.status === 'done' && item.resultBlob);
  if (completedItems.length === 0) {
    showToast('Belum Ada File Selesai', 'Belum ada file yang selesai dikonversi.', 'warning', 3500);
    return;
  }

  if (completedItems.length < filesQueue.length) {
    const remaining = filesQueue.length - completedItems.length;
    showToast('Proses Belum Selesai', `Masih ada ${remaining} file yang belum selesai dikonversi. Harap selesaikan semua file terlebih dahulu.`, 'warning', 4000);
    return;
  }

  const originalText = triggerBtn ? triggerBtn.textContent : '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
  }

  const dlStartTime = Date.now();

  for (let i = 0; i < completedItems.length; i++) {
    const item = completedItems[i];
    const dlElapsed = (Date.now() - dlStartTime) / 1000;
    const dlRemaining = completedItems.length - (i + 1);
    let dlEta = '';
    if (i > 0 && dlRemaining > 0) {
      const dlAvg = dlElapsed / (i + 1);
      dlEta = ` (sisa ${formatEtaDuration(dlAvg * dlRemaining)})`;
    }

    if (triggerBtn) {
      triggerBtn.textContent = `Mengunduh (${i + 1}/${completedItems.length})${dlEta}...`;
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(item.resultBlob);
    link.download = item.newName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Beri jeda 250ms agar browser mengizinkan unduhan beruntun
    await new Promise(r => setTimeout(r, 250));
  }

  if (triggerBtn) {
    triggerBtn.textContent = originalText;
    triggerBtn.disabled = false;
  }
}

// Pasang event listeners untuk semua tombol Unduh ZIP
[downloadAllBtn, downloadZipBtn, bottomDownloadZipBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', () => handleDownloadZip(btn));
});

// Pasang event listeners untuk semua tombol Unduh Langsung
[downloadDirectTopBtn, downloadDirectBtn, bottomDownloadDirectBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', () => handleDownloadDirect(btn));
});

// Inisialisasi awal tampilan pengaturan
updateVideoSettingsVisibility();

// -------------------------------------------------------------
// TAHUN DINAMIS DI FOOTER
// -------------------------------------------------------------
const currentYearEl = document.getElementById('currentYear');
if (currentYearEl) {
  currentYearEl.textContent = new Date().getFullYear();
}

// -------------------------------------------------------------
// KONTROLER MODAL TENTANG (ABOUT), FAQ, & LISENSI
// -------------------------------------------------------------
const aboutModal = document.getElementById('aboutModal');
const faqModal = document.getElementById('faqModal');
const licenseModal = document.getElementById('licenseModal');

const openAboutBtn = document.getElementById('openAboutBtn');
const openFaqBtn = document.getElementById('openFaqBtn');
const openLicenseBtn = document.getElementById('openLicenseBtn');

const footerAboutBtn = document.getElementById('footerAboutBtn');
const footerFaqBtn = document.getElementById('footerFaqBtn');

const closeAboutBtn = document.getElementById('closeAboutBtn');
const closeAboutModalBtn = document.getElementById('closeAboutModalBtn');
const closeFaqBtn = document.getElementById('closeFaqBtn');
const closeFaqModalBtn = document.getElementById('closeFaqModalBtn');
const closeLicenseBtn = document.getElementById('closeLicenseBtn');
const closeLicenseModalBtn = document.getElementById('closeLicenseModalBtn');

function showModal(modal) {
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.classList.add('overflow-hidden');
}

function hideModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
}

if (openAboutBtn) openAboutBtn.addEventListener('click', () => showModal(aboutModal));
if (footerAboutBtn) footerAboutBtn.addEventListener('click', () => showModal(aboutModal));
if (closeAboutBtn) closeAboutBtn.addEventListener('click', () => hideModal(aboutModal));
if (closeAboutModalBtn) closeAboutModalBtn.addEventListener('click', () => hideModal(aboutModal));

if (openFaqBtn) openFaqBtn.addEventListener('click', () => showModal(faqModal));
if (footerFaqBtn) footerFaqBtn.addEventListener('click', () => showModal(faqModal));
if (closeFaqBtn) closeFaqBtn.addEventListener('click', () => hideModal(faqModal));
if (closeFaqModalBtn) closeFaqModalBtn.addEventListener('click', () => hideModal(faqModal));

if (openLicenseBtn) openLicenseBtn.addEventListener('click', () => showModal(licenseModal));
if (closeLicenseBtn) closeLicenseBtn.addEventListener('click', () => hideModal(licenseModal));
if (closeLicenseModalBtn) closeLicenseModalBtn.addEventListener('click', () => hideModal(licenseModal));

// Tutup modal jika klik di luar kotak modal (backdrop)
[aboutModal, faqModal, licenseModal].forEach(modal => {
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal(modal);
    });
  }
});

// Tutup modal saat tombol Escape ditekan
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideModal(aboutModal);
    hideModal(faqModal);
    hideModal(licenseModal);
  }
});
