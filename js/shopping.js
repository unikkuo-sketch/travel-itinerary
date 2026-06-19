import { getTripId, loadTrip, tripUrl } from './load-trip.js';
import { mountNav } from './nav.js';

const listEl = document.getElementById('shoppingList');
const inputEl = document.getElementById('itemInput');
const addBtn = document.getElementById('addBtn');
const tagsContainer = document.getElementById('quickAddTags');
const recRoot = document.getElementById('shopping-rec-root');
const heroTitle = document.getElementById('shopping-trip-title');

let items = [];
let storageKey = '';

function save() {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function renderList() {
  listEl.innerHTML = '';
  if (items.length === 0) {
    listEl.innerHTML = '<div class="empty-state">購物車空空的，快去加點東西吧！🛒</div>';
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `shopping-item${item.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-checkbox';
    checkbox.checked = item.completed;
    checkbox.addEventListener('change', () => toggleItem(index));

    const text = document.createElement('span');
    text.className = 'item-text';
    text.textContent = item.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.title = '刪除項目';
    delBtn.setAttribute('aria-label', '刪除項目');
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', (e) => deleteItem(e, index));

    li.append(checkbox, text, delBtn);
    listEl.appendChild(li);
  });
  save();
}

function addItem(text) {
  const value = (text || inputEl.value).trim();
  if (!value) return;
  items.unshift({ text: value, completed: false });
  inputEl.value = '';
  renderList();
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

function renderRecommendations(recommendations) {
  if (!recRoot || !recommendations?.length) return;
  recRoot.innerHTML = recommendations.map((rec) => `
    <div class="event-card">
      <h3>${rec.title}</h3>
      <p>${rec.desc}</p>
      <div class="tag-row">
        ${rec.items.map((item) => `<button type="button" class="category-tag" data-add-item="${item}">+ ${item}</button>`).join('')}
      </div>
    </div>
  `).join('');

  recRoot.querySelectorAll('[data-add-item]').forEach((btn) => {
    btn.addEventListener('click', () => addItem(btn.dataset.addItem));
  });
}

function renderSuggestions(suggestions) {
  if (!tagsContainer) return;
  tagsContainer.innerHTML = '';
  (suggestions || []).forEach((item) => {
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = 'category-tag';
    tag.textContent = `+ ${item}`;
    tag.addEventListener('click', () => addItem(item));
    tagsContainer.appendChild(tag);
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
    document.title = `🛍️ 購物清單 | ${data.meta?.title || tripId}`;
    if (heroTitle) heroTitle.textContent = `🛍️ ${data.meta?.title || '購物清單'}`;
    mountNav('shopping', tripId, data.days);
    renderSuggestions(data.shopping?.suggestions);
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
