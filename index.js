import encode from 'https://esm.sh/@jsquash/avif@1.3.0/encode';

// Referensi Elemen DOM
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const convertBtn = document.getElementById('convertBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const clearBtn = document.getElementById('clearBtn');
const summaryBar = document.getElementById('summaryBar');
const fileCountText = document.getElementById('fileCountText');
const fileList = document.getElementById('fileList');

// State Aplikasi
let filesQueue = []; // Menyimpan objek { id, file, status, avifBlob, newName }

// Update label kualitas slider
qualityRange.addEventListener('input', (e) => {
  qualityValue.textContent = `${e.target.value}%`;
});

// Event Dropzone & Input File
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('border-indigo-500', 'bg-slate-800');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('border-indigo-500', 'bg-slate-800');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('border-indigo-500', 'bg-slate-800');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = ''; // Reset agar file yang sama bisa dipilih ulang jika dihapus
});

// Hapus semua daftar
clearBtn.addEventListener('click', () => {
  filesQueue = [];
  renderList();
});

// Menangani file yang masuk
function handleFiles(fileListInput) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const newFiles = Array.from(fileListInput).filter(file => validTypes.includes(file.type));

  newFiles.forEach(file => {
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    filesQueue.push({
      id: crypto.randomUUID(),
      file,
      newName: `${baseName}.avif`,
      status: 'pending', // pending | processing | done | error
      avifBlob: null
    });
  });

  renderList();
}

// Format ukuran bytes ke KB/MB
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Render daftar file ke UI
function renderList() {
  fileList.innerHTML = '';

  if (filesQueue.length === 0) {
    summaryBar.classList.add('hidden');
    convertBtn.disabled = true;
    downloadAllBtn.classList.add('hidden');
    return;
  }

  summaryBar.classList.remove('hidden');
  fileCountText.textContent = `${filesQueue.length} gambar siap / diproses`;
  convertBtn.disabled = false;

  const hasCompleted = filesQueue.some(item => item.status === 'done');
  downloadAllBtn.classList.toggle('hidden', !hasCompleted);

  filesQueue.forEach(item => {
    const row = document.createElement('div');
    row.className = 'bg-slate-800 border border-slate-700 rounded-lg p-3.5 flex items-center justify-between gap-4';

    let statusBadge = '';
    let actionHtml = '';

    if (item.status === 'pending') {
      statusBadge = `<span class="text-xs px-2.5 py-1 rounded bg-slate-700 text-slate-300">Menunggu</span>`;
    } else if (item.status === 'processing') {
      statusBadge = `<span class="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 animate-pulse">Mengonversi...</span>`;
    } else if (item.status === 'done') {
      const savedPercent = Math.round((1 - item.avifBlob.size / item.file.size) * 100);
      const badgeColor = savedPercent > 0 ? 'text-emerald-400' : 'text-slate-400';
      statusBadge = `
        <div class="text-right">
          <span class="text-xs font-semibold ${badgeColor}">${formatBytes(item.avifBlob.size)} (${savedPercent > 0 ? '-' + savedPercent + '%' : 'Selesai'})</span>
        </div>
      `;
      const downloadUrl = URL.createObjectURL(item.avifBlob);
      actionHtml = `
        <a href="${downloadUrl}" download="${item.newName}" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white rounded transition">
          Unduh
        </a>
      `;
    } else if (item.status === 'error') {
      statusBadge = `<span class="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-400">Gagal</span>`;
    }

    row.innerHTML = `
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-slate-200 truncate">${item.file.name}</p>
        <p class="text-xs text-slate-400">Asli: ${formatBytes(item.file.size)} &rarr; <span class="text-indigo-400">${item.newName}</span></p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        ${statusBadge}
        ${actionHtml}
      </div>
    `;

    fileList.appendChild(row);
  });
}

// Mengubah File gambar menjadi ImageData menggunakan Canvas
async function fileToImageData(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

// Proses Konversi Massal (Satu per satu agar memori browser tetap aman)
convertBtn.addEventListener('click', async () => {
  const quality = parseInt(qualityRange.value, 10);
  convertBtn.disabled = true;
  convertBtn.textContent = 'Sedang Memproses...';

  for (let item of filesQueue) {
    if (item.status === 'done') continue;

    item.status = 'processing';
    renderList();

    try {
      const imageData = await fileToImageData(item.file);
      // Encode ke AVIF menggunakan WebAssembly
      const avifBuffer = await encode(imageData, {
        quality: quality,
        speed: 6 // Skala 0 (paling lambat/kecil) - 10 (paling cepat). 6 adalah standar ideal.
      });

      item.avifBlob = new Blob([avifBuffer], { type: 'image/avif' });
      item.status = 'done';
    } catch (err) {
      console.error('Error konversi:', item.file.name, err);
      item.status = 'error';
    }

    renderList();
  }

  convertBtn.textContent = 'Konversi Semua';
  convertBtn.disabled = false;
});

// Mengunduh semua hasil konversi dalam satu file ZIP
downloadAllBtn.addEventListener('click', async () => {
  const zip = new JSZip();
  const completedItems = filesQueue.filter(item => item.status === 'done' && item.avifBlob);

  if (completedItems.length === 0) return;

  downloadAllBtn.textContent = 'Membuat ZIP...';
  downloadAllBtn.disabled = true;

  completedItems.forEach(item => {
    zip.file(item.newName, item.avifBlob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = `gambar-avif-${Date.now()}.zip`;
  link.click();

  downloadAllBtn.textContent = 'Unduh ZIP';
  downloadAllBtn.disabled = false;
});