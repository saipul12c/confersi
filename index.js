// Conferti - Konverter Gambar & Video ke WebP & AVIF untuk Website
// Dioptimalkan untuk performa tinggi (ratusan file sekaligus, hemat RAM, pembaruan DOM O(1))

// Referensi Elemen DOM
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
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

// Update label kualitas slider
qualityRange.addEventListener('input', (e) => {
  qualityValue.textContent = `${e.target.value}%`;
});

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
  renderFullList();
  updateGlobalStats();
});

// Menangani file yang masuk (Gambar dan Video)
function handleFiles(fileListInput) {
  const incomingFiles = Array.from(fileListInput);

  if (incomingFiles.length === 0) return;

  let addedImageCount = 0;
  let addedVideoCount = 0;
  let rejectedCount = 0;

  incomingFiles.forEach(file => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|ogv)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif|bmp|svg|tiff?)$/i.test(file.name);

    if (!isVideo && !isImage) {
      rejectedCount++;
      return;
    }

    if (isVideo) addedVideoCount++;
    if (isImage) addedImageCount++;

    const type = isVideo ? 'video' : 'image';
    const item = {
      id: crypto.randomUUID(),
      file,
      type,
      status: 'pending', // pending | processing | done | error
      resultBlob: null,
      progress: 0,
      errorMsg: ''
    };
    item.newName = computeTargetFilename(item);
    filesQueue.push(item);
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

    let messageHtml = `Berhasil memuat <strong>${totalAdded} file</strong> (${details.join(', ')}) ke browser. Tombol dan fitur konversi sekarang <strong>aktif & siap digunakan!</strong>`;
    if (rejectedCount > 0) {
      messageHtml += `<br><span class="text-amber-300">Catatan: ${rejectedCount} file diabaikan karena bukan format gambar/video yang didukung.</span>`;
    }

    showToast('Upload Berhasil!', messageHtml, 'success', 5000);
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
  filesQueue.forEach(item => {
    const row = createRowElement(item);
    fragment.appendChild(row);
  });
  fileList.appendChild(fragment);
}

// Buat elemen baris untuk satu file
function createRowElement(item) {
  const row = document.createElement('div');
  row.id = `row-${item.id}`;
  row.className = 'bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-slate-600';

  const isVideo = item.type === 'video';
  const isLarge = item.file.size >= 1024 * 1024 * 1024; // >= 1GB
  const isMediumLarge = item.file.size >= 300 * 1024 * 1024; // >= 300MB

  const typeBadge = isVideo
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">Video</span>`
    : `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Gambar</span>`;

  const sizeBadge = isLarge
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">File Raksasa (&gt;1 GB)</span>`
    : (isMediumLarge ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300">File Besar</span>` : '');

  row.innerHTML = `
    <div class="min-w-0 flex-1 flex items-start gap-3">
      <div class="p-2 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 shrink-0 mt-0.5">
        ${isVideo ? `
          <svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ` : `
          <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        `}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-sm font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">${item.file.name}</p>
          ${typeBadge}
          ${sizeBadge}
        </div>
        <p class="text-xs text-slate-400 mt-0.5">
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

  // Listener tombol hapus satuan
  row.querySelector('.remove-btn').addEventListener('click', () => {
    filesQueue = filesQueue.filter(f => f.id !== item.id);
    row.remove();
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
    const badgeColor = isSmaller ? 'text-emerald-400' : 'text-slate-300';
    const changeText = isSmaller ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`;

    statusSlot.innerHTML = `
      <div class="text-left sm:text-right">
        <span class="text-xs font-semibold ${badgeColor}">
          ${formatBytes(item.resultBlob.size)} <span class="text-[11px] font-normal text-slate-400">(${changeText})</span>
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
    statusSlot.innerHTML = `<span class="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">Gagal</span>`;
    actionSlot.innerHTML = '';
    if (item.errorMsg) {
      errorBox.textContent = item.errorMsg;
      errorBox.classList.remove('hidden');
    }
  }

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

  let text = `${total} file dipilih`;
  if (countProcessed > 0) {
    text += ` (${countDone} selesai${countError > 0 ? `, ${countError} gagal` : ''})`;
  }
  fileCountText.textContent = text;

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

  // Tampilkan tombol unduh semua jika minimal ada 1 file yang selesai
  const hasCompleted = countDone > 0;
  downloadAllBtn.classList.toggle('hidden', !hasCompleted);
  if (downloadDirectTopBtn) downloadDirectTopBtn.classList.toggle('hidden', !hasCompleted);
  if (downloadSection) downloadSection.classList.toggle('hidden', !hasCompleted);
  if (bottomDownloadBar) bottomDownloadBar.classList.toggle('hidden', !hasCompleted);

  if (hasCompleted) {
    const origBytes = completedItems.reduce((acc, it) => acc + it.file.size, 0);
    const resultBytes = completedItems.reduce((acc, it) => acc + it.resultBlob.size, 0);
    const savedPct = Math.round((1 - resultBytes / origBytes) * 100);
    const isSmaller = savedPct > 0;

    if (completedCountText) {
      completedCountText.innerHTML = `
        <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span><strong>${countDone} dari ${total} file</strong> selesai dikonversi!</span>
      `;
    }
    if (totalSavedText) {
      totalSavedText.textContent = `Total ukuran baru: ${formatBytes(resultBytes)} (${isSmaller ? 'Hemat ' + savedPct + '%' : 'Selesai'})`;
    }
  }

  // Status tombol konversi
  if (!isConverting) {
    convertBtn.disabled = countDone === total;
  }
}

// -------------------------------------------------------------
// KONVERSI GAMBAR (DENGAN PEMBERSIHAN MEMORI GPU/VRAM)
// -------------------------------------------------------------
async function convertImageToWebP(file, quality) {
  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;

  // Batas kanvas aman browser (maks 16.384px) agar tidak out-of-memory
  const MAX_DIM = 16384;
  if (w > MAX_DIM || h > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
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
    canvas.toBlob((blob) => {
      // Bebaskan memori backing store canvas segera
      canvas.width = 0;
      canvas.height = 0;

      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Gagal mengonversi gambar ke WebP'));
      }
    }, 'image/webp', quality / 100);
  });
}

// Konversi Gambar ke AVIF (menggunakan WebAssembly @jsquash/avif)
async function convertImageToAvif(file, quality) {
  if (!avifEncodeModule) {
    const mod = await import('https://esm.sh/@jsquash/avif@1.3.0/encode');
    avifEncodeModule = mod.default;
  }

  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;

  const MAX_DIM = 8192; // Batas aman encode AVIF
  if (w > MAX_DIM || h > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
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

// Konversi Video ke WebM (Bitrate mengikuti slider kualitas)
async function convertVideoToWebM(file, quality = 80, onProgress) {
  if (file.type === 'video/webm' || file.name.endsWith('.webm')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.muted = true;

    video.onloadedmetadata = async () => {
      try {
        const stream = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
        if (!stream) {
          URL.revokeObjectURL(videoUrl);
          throw new Error('captureStream tidak didukung oleh browser Anda.');
        }

        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
          }
        }

        // Bitrate adaptif berdasarkan slider kualitas kompresi
        const videoBits = Math.round(500000 + (quality / 100) * 3500000);
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: videoBits
        });
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const webmBlob = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(videoUrl);
          resolve(webmBlob);
        };

        video.ontimeupdate = () => {
          if (video.duration && onProgress) {
            onProgress(Math.round((video.currentTime / video.duration) * 100));
          }
        };

        recorder.start();
        await video.play();

        video.onended = () => {
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
convertBtn.addEventListener('click', async () => {
  if (isConverting) return;
  isConverting = true;

  const quality = parseInt(qualityRange.value, 10);
  const imageFormat = imageFormatSelect.value;
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

  for (let item of filesQueue) {
    if (item.status === 'done') continue;

    item.status = 'processing';
    item.progress = 0;
    item.errorMsg = '';
    updateItemRow(item);

    try {
      if (item.type === 'image') {
        if (imageFormat === 'webp') {
          item.resultBlob = await convertImageToWebP(item.file, quality);
        } else {
          item.resultBlob = await convertImageToAvif(item.file, quality);
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
    } catch (err) {
      console.error('Error konversi:', item.file.name, err);
      item.status = 'error';
      item.errorMsg = err.message || 'Gagal memproses file';
    }

    updateItemRow(item);

    // Beri jeda 1 tick agar browser dapat membersihkan memori dan me-render animasi dengan mulus
    await new Promise(r => setTimeout(r, 10));
  }

  isConverting = false;
  globalStatusDot.classList.remove('animate-ping');
  convertBtn.textContent = 'Konversi Semua';
  updateGlobalStats();
});

// -------------------------------------------------------------
// PENGUNDUHAN MASSAL: ZIP & LANGSUNG KE DISK (TANPA KLIK SATU-SATU)
// -------------------------------------------------------------

// 1. Unduh Semua sebagai satu paket file ZIP
async function handleDownloadZip(triggerBtn) {
  const completedItems = filesQueue.filter(item => item.status === 'done' && item.resultBlob);
  if (completedItems.length === 0) return;

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
  const completedItems = filesQueue.filter(item => item.status === 'done' && item.resultBlob);
  if (completedItems.length === 0) return;

  const originalText = triggerBtn ? triggerBtn.textContent : '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
  }

  for (let i = 0; i < completedItems.length; i++) {
    const item = completedItems[i];
    if (triggerBtn) {
      triggerBtn.textContent = `Mengunduh (${i + 1}/${completedItems.length})...`;
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
