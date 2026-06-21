import { getTripId, loadTrip } from './load-trip.js';
import { mountNav } from './nav.js';
import { icon } from './icons.js';

const listEl = document.getElementById('shoppingList');
const inputEl = document.getElementById('itemInput');
const addBtn = document.getElementById('addBtn');
const recRoot = document.getElementById('shopping-rec-root');
const heroTitle = document.getElementById('shopping-trip-title');
const mineZone = document.getElementById('shopping-zone-mine');

let items = [];
let storageKey = '';

function normalizeProduct(item) {
  if (typeof item === 'string') {
    return { name: item.trim(), price: '', priceNote: '', imageUrl: '' };
  }
  return {
    name: (item?.name || '').trim(),
    price: item?.price || '',
    priceNote: item?.priceNote || '',
    imageUrl: item?.imageUrl || '',
  };
}

function productInitials(name) {
  return name.replace(/\s+/g, '').slice(0, 2) || '?';
}

function createMedia(product) {
  const wrap = document.createElement('div');
  wrap.className = 'shopping-product-media';

  if (product.imageUrl) {
    const img = document.createElement('img');
    img.className = 'shopping-product-img';
    img.src = product.imageUrl;
    img.alt = product.name;
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      img.remove();
      wrap.classList.add('shopping-product-media--placeholder');
      wrap.textContent = productInitials(product.name);
    });
    wrap.appendChild(img);
  } else {
    wrap.classList.add('shopping-product-media--placeholder');
    wrap.textContent = productInitials(product.name);
  }

  return wrap;
}

function createThumb(imageUrl, name) {
  if (!imageUrl) return null;

  const img = document.createElement('img');
  img.className = 'shopping-item-thumb';
  img.src = imageUrl;
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => img.remove());
  return img;
}

function createProductCard(product, { onAdd }) {
  const card = document.createElement('article');
  card.className = 'shopping-product-card';

  card.appendChild(createMedia(product));

  const body = document.createElement('div');
  body.className = 'shopping-product-body';

  const title = document.createElement('h3');
  title.className = 'shopping-product-name';
  title.textContent = product.name;
  body.appendChild(title);

  if (product.price) {
    const price = document.createElement('p');
    price.className = 'shopping-product-price';
    price.textContent = product.price;
    body.appendChild(price);
  }

  if (product.priceNote) {
    const note = document.createElement('p');
    note.className = 'shopping-product-price-note';
    note.textContent = product.priceNote;
    body.appendChild(note);
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-add-card';
  btn.textContent = '加入待買';
  btn.setAttribute('aria-label', `將 ${product.name} 加入待買清單`);
  btn.addEventListener('click', () => onAdd(product));
  body.appendChild(btn);

  card.appendChild(body);
  return card;
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function flashMineZone() {
  if (!mineZone) return;
  mineZone.classList.add('shopping-zone--flash');
  mineZone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => mineZone.classList.remove('shopping-zone--flash'), 800);
}

function renderList() {
  listEl.innerHTML = '';
  if (items.length === 0) {
    listEl.innerHTML = '<div class="empty-state">還沒加入任何項目，可從下方伴手禮推薦點擊加入</div>';
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `shopping-item${item.completed ? ' completed' : ''}`;

    const thumb = createThumb(item.imageUrl, item.text);
    if (thumb) li.appendChild(thumb);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-checkbox';
    checkbox.checked = item.completed;
    checkbox.addEventListener('change', () => toggleItem(index));

    const info = document.createElement('div');
    info.className = 'shopping-item-info';

    const text = document.createElement('span');
    text.className = 'item-text';
    text.textContent = item.text;
    info.appendChild(text);

    if (item.price) {
      const priceEl = document.createElement('span');
      priceEl.className = 'shopping-item-price';
      priceEl.textContent = item.price;
      info.appendChild(priceEl);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.title = '刪除項目';
    delBtn.setAttribute('aria-label', '刪除項目');
    delBtn.innerHTML = icon('trash');
    delBtn.addEventListener('click', (e) => deleteItem(e, index));

    li.append(checkbox, info, delBtn);
    listEl.appendChild(li);
  });
  save();
}

function addItem(text, { fromRec = false, product } = {}) {
  const normalized = product || normalizeProduct(text);
  const value = (normalized.name || text || inputEl.value).trim();
  if (!value) return;

  const entry = { text: value, completed: false };
  if (fromRec || product) {
    if (normalized.imageUrl) entry.imageUrl = normalized.imageUrl;
    if (normalized.price) entry.price = normalized.price;
    if (normalized.priceNote) entry.priceNote = normalized.priceNote;
  }

  items.unshift(entry);
  inputEl.value = '';
  renderList();
  if (fromRec) flashMineZone();
}

function toggleItem(index) {
  items[index].completed = !items[index].completed;
  renderList();
}

function deleteItem(event, index) {
  event.stopPropagation();
  items.splice(index, 1);
  renderList();
}

function renderProductGrid(container, products) {
  if (!container) return;
  container.innerHTML = '';
  products.forEach((raw) => {
    const product = normalizeProduct(raw);
    if (!product.name) return;
    container.appendChild(createProductCard(product, {
      onAdd: (p) => addItem(p.name, { fromRec: true, product: p }),
    }));
  });
}

function renderRecommendations(recommendations) {
  if (!recRoot || !recommendations?.length) return;
  recRoot.innerHTML = '';

  recommendations.forEach((rec) => {
    const section = document.createElement('div');
    section.className = 'shopping-trip-group';

    const heading = document.createElement('h3');
    heading.className = 'shopping-trip-title';
    heading.textContent = rec.title;
    section.appendChild(heading);

    if (rec.desc) {
      const desc = document.createElement('p');
      desc.className = 'shopping-trip-desc';
      desc.textContent = rec.desc;
      section.appendChild(desc);
    }

    const grid = document.createElement('div');
    grid.className = 'shopping-product-grid';
    renderProductGrid(grid, rec.items || []);
    section.appendChild(grid);

    recRoot.appendChild(section);
  });
}

async function init() {
  const tripId = getTripId();
  if (!tripId) {
    window.location.replace(import.meta.env.BASE_URL);
    return;
  }

  storageKey = `travelShoppingList:${tripId}`;
  items = JSON.parse(localStorage.getItem(storageKey) || '[]');

  try {
    const data = await loadTrip(tripId);
    document.title = `購物清單 | ${data.meta?.title || tripId}`;
    if (heroTitle) heroTitle.textContent = data.meta?.title || '購物清單';
    mountNav('shopping', tripId, data.days);
    renderRecommendations(data.shopping?.recommendations);
  } catch {
    mountNav('shopping', tripId, []);
  }

  addBtn.addEventListener('click', () => addItem());
  inputEl.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') addItem();
  });

  renderList();
}

init();
