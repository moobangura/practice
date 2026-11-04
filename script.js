const STORAGE_KEY = 'calorie-tracker-entries';
const GOAL_KEY = 'calorie-tracker-goal';

const goalInput = document.getElementById('dailyGoal');
const saveGoalBtn = document.getElementById('saveGoal');
const selectedDateInput = document.getElementById('selectedDate');
const entryDateInput = document.getElementById('entryDate');
const consumedTotalEl = document.getElementById('consumedTotal');
const remainingTotalEl = document.getElementById('remainingTotal');
const entryListEl = document.getElementById('entryList');
const entryForm = document.getElementById('entryForm');
const resetDataBtn = document.getElementById('resetData');

let entries = loadEntries();
let goal = loadGoal();
let selectedDate = getTodayString();

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadEntries() {
  try {
    const storedEntries = localStorage.getItem(STORAGE_KEY);
    return storedEntries ? JSON.parse(storedEntries) : [];
  } catch (error) {
    return [];
  }
}

function loadGoal() {
  const savedGoal = localStorage.getItem(GOAL_KEY);
  if (savedGoal === null || savedGoal === '') {
    return 2000;
  }

  const numericGoal = Number(savedGoal);
  return Number.isFinite(numericGoal) && numericGoal > 0 ? numericGoal : 2000;
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function saveGoal() {
  localStorage.setItem(GOAL_KEY, String(goal));
}

function getEntriesForSelectedDate() {
  return entries.filter((entry) => entry.date === selectedDate).sort((a, b) => b.createdAt - a.createdAt);
}

function calculateTotal(entriesList) {
  return entriesList.reduce((sum, entry) => sum + Number(entry.calories), 0);
}

function renderSummary() {
  const selectedEntries = getEntriesForSelectedDate();
  const total = calculateTotal(selectedEntries);
  const remaining = goal - total;

  consumedTotalEl.textContent = `${total}`;
  remainingTotalEl.textContent = `${remaining}`;

  const remainingBox = remainingTotalEl.closest('.summary-box');
  if (remaining < 0) {
    remainingBox.style.background = '#fef2f2';
    remainingBox.style.borderColor = '#fecaca';
  } else {
    remainingBox.style.background = '#ecfdf5';
    remainingBox.style.borderColor = '#bbf7d0';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function renderEntries() {
  const selectedEntries = getEntriesForSelectedDate();

  if (!selectedEntries.length) {
    entryListEl.innerHTML = '<li class="empty-state">No meals logged for this date yet.</li>';
    return;
  }

  entryListEl.innerHTML = selectedEntries
    .map(
      (entry) => `
        <li class="entry-item" data-id="${entry.id}">
          <div class="entry-main">
            <strong>${escapeHtml(entry.name)}</strong>
            <span class="entry-meta">${escapeHtml(entry.mealType)} • ${formatDate(entry.date)}</span>
          </div>
          <div class="entry-calories">${entry.calories} kcal</div>
          <button class="delete-btn" type="button" data-delete-id="${entry.id}">Delete</button>
        </li>
      `
    )
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function render() {
  goalInput.value = goal;
  selectedDateInput.value = selectedDate;
  entryDateInput.value = selectedDate;
  renderSummary();
  renderEntries();
}

saveGoalBtn.addEventListener('click', () => {
  const nextGoal = Number(goalInput.value);

  if (!Number.isFinite(nextGoal) || nextGoal < 0) {
    goalInput.focus();
    return;
  }

  goal = nextGoal;
  saveGoal();
  renderSummary();
});

selectedDateInput.addEventListener('change', (event) => {
  selectedDate = event.target.value || getTodayString();
  entryDateInput.value = selectedDate;
  render();
});

entryForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(entryForm);
  const name = String(formData.get('foodName') || '').trim();
  const calories = Number(formData.get('calories'));
  const mealType = String(formData.get('mealType') || 'Breakfast');
  const date = String(formData.get('entryDate') || selectedDate);

  if (!name || !Number.isFinite(calories) || calories <= 0) {
    return;
  }

  entries.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    name,
    calories,
    mealType,
    date,
    createdAt: Date.now()
  });

  saveEntries();
  selectedDate = date;
  render();
  entryForm.reset();
  entryDateInput.value = selectedDate;
  selectedDateInput.value = selectedDate;
});

entryListEl.addEventListener('click', (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const deleteId = target.getAttribute('data-delete-id');
  if (!deleteId) {
    return;
  }

  entries = entries.filter((entry) => entry.id !== deleteId);
  saveEntries();
  render();
});

resetDataBtn.addEventListener('click', () => {
  const confirmed = window.confirm('Delete all saved entries and reset your goal?');
  if (!confirmed) {
    return;
  }

  entries = [];
  goal = 2000;
  selectedDate = getTodayString();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(GOAL_KEY);
  render();
});

render();
