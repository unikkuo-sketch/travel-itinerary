import { getTripId, loadTrip } from './load-trip.js';
import { mountNav } from './nav.js';
import {
  loadLocalRecap,
  saveLocalRecap,
  seedExpensesFromBudget,
  compressImage,
  validatePhotoLimits,
  newPhotoId,
  savePhotoBlob,
  getPhotoBlob,
  deletePhotoBlob,
  fetchPublishedRecap,
  importPublishedToLocal,
  exportPublishPackage,
  clearLocalDraft,
  parseYen,
  formatYen,
} from './recap-storage.js';

const tripId = getTripId();
let tripData = null;
let recap = null;
let saveTimer = null;

const photoDayEl = document.getElementById('photo-day');
const photoCaptionEl = document.getElementById('photo-caption');
const photoPlaceEl = document.getElementById('photo-place');
const photoInputEl = document.getElementById('photo-input');
const photoGridEl = document.getElementById('photo-grid');
const uploadStatusEl = document.getElementById('upload-status');
const expenseWrapEl = document.getElementById('expense-table-wrap');
const totalAmountEl = document.getElementById('total-amount');
const totalTwdEl = document.getElementById('total-twd');
const expenseNotesEl = document.getElementById('expense-notes');
const btnSave = document.getElementById('btn-save');
const btnImport = document.getElementById('btn-import');
const btnExport = document.getElementById('btn-export');
const btnClear = document.getElementById('btn-clear');
const titleEl = document.getElementById('recap-trip-title');

function showError(message) {
  document.body.innerHTML = `
    <main class="main-content" style="padding:4rem 1rem;text-align:center">
      <h1>找不到行程</h1>
      <p>${message}</p>
      <p><a href="${import.meta.env.BASE_URL}">返回行程總覽</a></p>
    </main>`;
}

function initRecapFromTrip() {
  recap = loadLocalRecap(tripId);
  if (!recap) {
    recap = {
      version: 1,
      updatedAt: '',
      photos: [],
      expenses: seedExpensesFromBudget(tripData.budget),
    };
    saveLocalRecap(tripId, recap);
  } else if (!recap.expenses?.items?.length) {
    recap.expenses = seedExpensesFromBudget(tripData.budget);
    scheduleSave();
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    recap.expenses.totalActual = {
      amount: totalAmountEl.value.trim(),
      twd: totalTwdEl.value.trim(),
    };
    recap.expenses.notes = expenseNotesEl.value.trim();
    saveLocalRecap(tripId, recap);
    btnSave.textContent = '已儲存';
  }, 400);
  btnSave.textContent = '儲存中…';
}

function populateDaySelect() {
  photoDayEl.innerHTML = (tripData.days || []).map((d) =>
    `<option value="${d.number}">Day ${d.number} · ${d.title}</option>`
  ).join('');
}

async function renderPhotoGrid() {
  photoGridEl.innerHTML = '';
  if (!recap.photos.length) {
    photoGridEl.innerHTML = '<p class="recap-empty-inline">尚無照片，選擇上方檔案上傳</p>';
    return;
  }

  for (const p of recap.photos) {
    const blob = await getPhotoBlob(tripId, p.id);
    if (!blob) continue;

    const url = URL.createObjectURL(blob);
    const card = document.createElement('article');
    card.className = 'recap-edit-photo-card';
    card.innerHTML = `
      <img src="${url}" alt="${p.caption || ''}" loading="lazy">
      <div class="recap-edit-photo-meta">
        <span class="day-badge">${p.day}</span>
        ${p.caption ? `<span>${p.caption}</span>` : ''}
      </div>
      <button type="button" class="recap-photo-delete" aria-label="刪除照片">&times;</button>`;

    card.querySelector('.recap-photo-delete').addEventListener('click', async () => {
      if (!confirm('確定刪除這張照片？')) return;
      recap.photos = recap.photos.filter((x) => x.id !== p.id);
      await deletePhotoBlob(tripId, p.id);
      URL.revokeObjectURL(url);
      scheduleSave();
      renderPhotoGrid();
    });

    photoGridEl.appendChild(card);
  }
}

function renderExpenseEdit() {
  const items = recap.expenses.items || [];
  expenseWrapEl.innerHTML = `
    <table class="recap-expense-edit-table">
      <thead>
        <tr><th>類別</th><th>項目</th><th>規劃</th><th>實際</th><th>差異</th></tr>
      </thead>
      <tbody>
        ${items.map((item, i) => {
          const diff = diffDisplay(item.planned, item.actual);
          return `
            <tr>
              <td>${item.categoryTitle}</td>
              <td>${item.label}</td>
              <td>${item.planned}</td>
              <td><input type="text" class="recap-input recap-input--sm" data-expense-index="${i}" value="${item.actual || ''}" placeholder="¥0"></td>
              <td class="recap-diff ${diff.cls}">${diff.text}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  expenseWrapEl.querySelectorAll('[data-expense-index]').forEach((input) => {
    input.addEventListener('input', () => {
      const idx = Number(input.dataset.expenseIndex);
      recap.expenses.items[idx].actual = input.value.trim();
      const diff = diffDisplay(recap.expenses.items[idx].planned, input.value.trim());
      const row = input.closest('tr');
      const cell = row.querySelector('.recap-diff');
      cell.textContent = diff.text;
      cell.className = `recap-diff ${diff.cls}`;
      scheduleSave();
    });
  });

  totalAmountEl.value = recap.expenses.totalActual?.amount || '';
  totalTwdEl.value = recap.expenses.totalActual?.twd || '';
  expenseNotesEl.value = recap.expenses.notes || '';
}

function diffDisplay(planned, actual) {
  if (!actual) return { text: '—', cls: '' };
  const p = parseYen(planned);
  const a = parseYen(actual);
  if (p == null || a == null) return { text: '—', cls: '' };
  const d = a - p;
  if (d === 0) return { text: '±0', cls: 'recap-diff--even' };
  const sign = d > 0 ? '+' : '-';
  return {
    text: `${sign}${formatYen(Math.abs(d))}`,
    cls: d < 0 ? 'recap-diff--under' : 'recap-diff--over',
  };
}

async function handlePhotoUpload(files) {
  const day = Number(photoDayEl.value) || 1;
  const caption = photoCaptionEl.value.trim();
  const place = photoPlaceEl.value.trim();
  let added = 0;

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;

    let blob;
    try {
      blob = await compressImage(file);
    } catch {
      uploadStatusEl.textContent = '圖片處理失敗，請換一張試試';
      continue;
    }

    const check = await validatePhotoLimits(tripId, recap, blob.size);
    if (!check.ok) {
      uploadStatusEl.textContent = check.message;
      break;
    }

    const id = newPhotoId();
    await savePhotoBlob(tripId, id, blob);
    recap.photos.push({ id, day, caption, place });
    added += 1;
  }

  if (added) {
    photoCaptionEl.value = '';
    photoPlaceEl.value = '';
    scheduleSave();
    await renderPhotoGrid();
    uploadStatusEl.textContent = `已加入 ${added} 張`;
    setTimeout(() => { uploadStatusEl.textContent = ''; }, 3000);
  }
}

photoInputEl.addEventListener('change', () => {
  if (photoInputEl.files?.length) handlePhotoUpload([...photoInputEl.files]);
  photoInputEl.value = '';
});

totalAmountEl.addEventListener('input', scheduleSave);
totalTwdEl.addEventListener('input', scheduleSave);
expenseNotesEl.addEventListener('input', scheduleSave);

btnImport.addEventListener('click', async () => {
  const published = await fetchPublishedRecap(tripId);
  if (!published) {
    alert('此行程尚無已發佈的 recap.json');
    return;
  }
  if (!confirm('將以已發佈版覆蓋本機草稿，確定？')) return;
  recap = await importPublishedToLocal(tripId, published);
  renderExpenseEdit();
  await renderPhotoGrid();
  btnSave.textContent = '已儲存';
});

btnExport.addEventListener('click', async () => {
  scheduleSave();
  await new Promise((r) => setTimeout(r, 500));
  const count = await exportPublishPackage(tripId, recap);
  alert(`已下載 recap.json${count ? ` 與 ${count} 張照片` : ''}。請依頁面說明放入 trips 資料夾後 commit。`);
});

btnClear.addEventListener('click', async () => {
  if (!confirm('確定清除本機草稿？照片與花費紀錄將一併刪除。')) return;
  await clearLocalDraft(tripId);
  recap = {
    version: 1,
    photos: [],
    expenses: seedExpensesFromBudget(tripData.budget),
  };
  saveLocalRecap(tripId, recap);
  renderExpenseEdit();
  await renderPhotoGrid();
});

async function init() {
  if (!tripId) {
    window.location.replace(import.meta.env.BASE_URL);
    return;
  }

  try {
    tripData = await loadTrip(tripId);
    document.title = `旅後回顧 | ${tripData.meta.title}`;
    if (titleEl) titleEl.textContent = `${tripData.meta.title} · 旅後回顧`;

    mountNav('recap', tripId, tripData.days);
    initRecapFromTrip();
    populateDaySelect();
    renderExpenseEdit();
    await renderPhotoGrid();
  } catch (err) {
    showError(err.message);
  }
}

init();
