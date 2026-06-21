const base = import.meta.env.BASE_URL;
const DB_NAME = 'travelRecapPhotos';
const DB_VERSION = 1;
const STORE = 'photos';
const RECAP_VERSION = 1;
const MAX_PHOTOS = 50;
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;

let dbPromise = null;

function storageKey(tripId) {
  return `travelRecap:${tripId}`;
}

function photoKey(tripId, photoId) {
  return `${tripId}:${photoId}`;
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
  return dbPromise;
}

export function parseYen(str) {
  if (!str) return null;
  const nums = [...String(str).matchAll(/[\d,]+/g)]
    .map((m) => parseInt(m[0].replace(/,/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  if (!nums.length) return null;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[nums.length - 1]) / 2);
}

export function formatYen(n) {
  if (n == null || Number.isNaN(n)) return '';
  return `¥${n.toLocaleString('en-US')}`;
}

export function seedExpensesFromBudget(budget) {
  if (!budget?.categories) return { items: [], totalActual: { amount: '', twd: '' }, notes: '' };
  const items = budget.categories.flatMap((cat) =>
    (cat.items || []).map((item) => ({
      categoryTitle: cat.title,
      label: item.label,
      planned: item.amount,
      actual: '',
    }))
  );
  return { items, totalActual: { amount: '', twd: '' }, notes: '' };
}

export function loadLocalRecap(tripId) {
  try {
    const raw = localStorage.getItem(storageKey(tripId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalRecap(tripId, recap) {
  const data = { ...recap, version: RECAP_VERSION, updatedAt: new Date().toISOString().slice(0, 10) };
  localStorage.setItem(storageKey(tripId), JSON.stringify(data));
  return data;
}

export function clearLocalRecap(tripId) {
  localStorage.removeItem(storageKey(tripId));
}

export async function fetchPublishedRecap(tripId) {
  const res = await fetch(`${base}trips/${encodeURIComponent(tripId)}/recap.json`);
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function publishedPhotoUrl(tripId, file) {
  return `${base}trips/${encodeURIComponent(tripId)}/${file.replace(/^\.\//, '')}`;
}

export async function savePhotoBlob(tripId, photoId, blob) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, photoKey(tripId, photoId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPhotoBlob(tripId, photoId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(photoKey(tripId, photoId));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePhotoBlob(tripId, photoId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(photoKey(tripId, photoId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllPhotoBlobs(tripId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (String(cursor.key).startsWith(`${tripId}:`)) store.delete(cursor.key);
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalPhotoTotalBytes(tripId, photoIds) {
  let total = 0;
  for (const id of photoIds) {
    const blob = await getPhotoBlob(tripId, id);
    if (blob) total += blob.size;
  }
  return total;
}

export function newPhotoId() {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ponytail: canvas resize; upgrade path = OffscreenCanvas worker if main thread jank
export function compressImage(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('compress failed'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

export async function validatePhotoLimits(tripId, recap, newBlobSize = 0) {
  const photos = recap?.photos || [];
  if (photos.length >= MAX_PHOTOS) {
    return { ok: false, message: `最多 ${MAX_PHOTOS} 張照片` };
  }
  const ids = photos.map((p) => p.id);
  const total = await getLocalPhotoTotalBytes(tripId, ids);
  if (total + newBlobSize > MAX_TOTAL_BYTES) {
    return { ok: false, message: '照片總量超過 30MB，請刪除部分後再試' };
  }
  return { ok: true };
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}

export async function exportPublishPackage(tripId, recap) {
  const photos = recap.photos || [];
  const exportPhotos = photos.map((p, i) => {
    const filename = `photos/${p.id}.jpg`;
    return { ...p, file: filename, _index: i };
  });

  const payload = {
    version: RECAP_VERSION,
    updatedAt: new Date().toISOString().slice(0, 10),
    photos: exportPhotos.map(({ _index, ...p }) => p),
    expenses: recap.expenses || { items: [], totalActual: { amount: '', twd: '' }, notes: '' },
  };

  downloadJson(payload, 'recap.json');

  for (const p of exportPhotos) {
    const blob = await getPhotoBlob(tripId, p.id);
    if (blob) downloadBlob(blob, `${p.id}.jpg`);
  }

  return exportPhotos.length;
}

export async function importPublishedToLocal(tripId, published) {
  if (!published) return null;

  const photos = [];
  for (const p of published.photos || []) {
    photos.push({ id: p.id, day: p.day, caption: p.caption || '', place: p.place || '' });
    if (p.file) {
      try {
        const url = publishedPhotoUrl(tripId, p.file);
        const res = await fetch(url);
        if (res.ok) {
          const blob = await res.blob();
          await savePhotoBlob(tripId, p.id, blob);
        }
      } catch {
        /* skip failed photo fetch */
      }
    }
  }

  const recap = {
    version: RECAP_VERSION,
    updatedAt: published.updatedAt || new Date().toISOString().slice(0, 10),
    photos,
    expenses: published.expenses || { items: [], totalActual: { amount: '', twd: '' }, notes: '' },
  };

  saveLocalRecap(tripId, recap);
  return recap;
}

export async function loadRecapForDisplay(tripId) {
  const published = await fetchPublishedRecap(tripId);
  const local = loadLocalRecap(tripId);
  const hasLocal = local && ((local.photos?.length > 0) || local.expenses?.items?.some((i) => i.actual));

  if (published) {
    return {
      source: 'published',
      recap: published,
      localDraft: hasLocal,
      photoResolver: (p) => (p.file ? publishedPhotoUrl(tripId, p.file) : null),
    };
  }

  if (local) {
    return {
      source: 'local',
      recap: local,
      localDraft: true,
      photoResolver: async (p) => {
        const blob = await getPhotoBlob(tripId, p.id);
        return blob ? URL.createObjectURL(blob) : null;
      },
    };
  }

  return null;
}

export async function clearLocalDraft(tripId) {
  clearLocalRecap(tripId);
  await clearAllPhotoBlobs(tripId);
}

export { MAX_PHOTOS, MAX_TOTAL_BYTES };
