/* =========================
   DIGITAL CLOCK
========================= */
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const el = document.getElementById('digital-clock');
    if (el) el.textContent = `${h}:${m}:${s}.${ms}`;
}
setInterval(updateClock, 50);
updateClock();

/* =========================
   CONSTANTS
========================= */
const daysData = ['mon','tue','wed','thu','fri','sat','sun'];
const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/* =========================
   DATE HELPERS
========================= */
function formatDate(d = new Date()) {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getDayKey(date = new Date()) {
    return `lt-${formatDate(date)}`;
}

/* =========================
   STORAGE HELPERS
========================= */
function saveDayData(date, data) {
    localStorage.setItem(getDayKey(date), JSON.stringify(data));
}

function loadDayData(date) {
    const raw = localStorage.getItem(getDayKey(date));
    return raw ? JSON.parse(raw) : null;
}

/* =========================
   SAVE / LOAD DAY TEMPLATE
========================= */
function saveTemplate(dayEl, date = new Date()) {
    const morning = [...dayEl.querySelectorAll('.morning-checkbox')].map(cb => cb.checked);
    const tasks = [...dayEl.querySelectorAll('.task-checkbox')].map(cb => cb.checked);
    const note = dayEl.querySelector('.note-text')?.value || '';

    const total = morning.length + tasks.length;
    const done = morning.filter(Boolean).length + tasks.filter(Boolean).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    saveDayData(date, {
        date: formatDate(date),
        morning,
        tasks,
        note,
        percent
    });
}

function loadTemplate(dayEl, date = new Date()) {
    const data = loadDayData(date);
    if (!data) return;

    dayEl.querySelectorAll('.morning-checkbox')
        .forEach((cb, i) => cb.checked = !!data.morning?.[i]);

    dayEl.querySelectorAll('.task-checkbox')
        .forEach((cb, i) => cb.checked = !!data.tasks?.[i]);

    if (dayEl.querySelector('.note-text')) {
        dayEl.querySelector('.note-text').value = data.note || '';
    }
}

/* =========================
   PROGRESS CALCULATION
========================= */
function setProgressBar(bar, percent) {
    bar.style.width = percent + '%';
    bar.textContent = percent + '%';

    bar.style.background =
        percent < 30 ? '#e74c3c' :
        percent < 70 ? '#f1c40f' :
        '#2ecc71';
}

function calcDailyProgress(dayEl, date) {
    const morning = [...dayEl.querySelectorAll('.morning-checkbox')];
    const tasks = [...dayEl.querySelectorAll('.task-checkbox')];

    const total = morning.length + tasks.length;
    const done = morning.filter(cb => cb.checked).length +
                 tasks.filter(cb => cb.checked).length;

    const percent = total ? Math.round((done / total) * 100) : 0;

    const bar = dayEl.querySelector('.day-progress-bar');
    if (bar) setProgressBar(bar, percent);

    saveTemplate(dayEl, date);
    return percent;
}

function updateWeeklyProgress() {
    let total = 0, done = 0;

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - date.getDay() + i + 1);

        const data = loadDayData(date);
        if (!data) continue;

        const units = data.morning.length + data.tasks.length;
        total += units;
        done += Math.round((data.percent / 100) * units);
    }

    const percent = total ? Math.round((done / total) * 100) : 0;
    const bar = document.getElementById('weekly-progress');
    if (bar) setProgressBar(bar, percent);
}

/* =========================
   STREAK SYSTEM
========================= */
function calculateStreak() {
    let streak = 0;
    let date = new Date();

    while (true) {
        const data = loadDayData(date);
        if (!data || data.percent < 50) break;
        streak++;
        date.setDate(date.getDate() - 1);
    }

    const el = document.getElementById('streak');
    if (el) el.textContent = `🔥 Streak: ${streak} days`;
}

/* =========================
   WEEKLY PAGE BUILDER
========================= */
function buildWeekly() {
    const container = document.querySelector('.days-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - date.getDay() + i + 1);

        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.innerHTML = `
            <h2>
  ${dayNames[i]}<br>
  <small class="day-date">
    ${formatDate(date).split('-').reverse().join(' / ')}
  </small>
</h2>
            <div class="day-progress-container">
                <div class="day-progress-bar">0%</div>
            </div>

            <div class="task">
                <strong class="morning-title">🌞 Morning Routine</strong>
                <div class="morning-container" style="display:none;">
                    <label><input type="checkbox" class="morning-checkbox"> Water</label>
                    <label><input type="checkbox" class="morning-checkbox"> Exercise</label>
                    <label><input type="checkbox" class="morning-checkbox"> Meditation</label>
                </div>
            </div>

            <div class="task">Work / Study <input type="checkbox" class="task-checkbox"></div>
            <div class="task">Break / Lunch <input type="checkbox" class="task-checkbox"></div>

            <textarea class="note-text" placeholder="Notes..."></textarea>
        `;

        container.appendChild(dayDiv);
        loadTemplate(dayDiv, date);

        dayDiv.addEventListener('change', () => {
            calcDailyProgress(dayDiv, date);
            updateWeeklyProgress();
            calculateStreak();
        });
    }

    document.addEventListener('click', e => {
        if (e.target.classList.contains('morning-title')) {
            const box = e.target.nextElementSibling;
            box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
        }
    });

    updateWeeklyProgress();
    calculateStreak();
}

/* =========================
   MONTHLY PAGE
========================= */
function loadMonthly() {
    const container = document.querySelector('.days-container');
    if (!container) return;

    let total = 0, done = 0;

    Object.keys(localStorage)
        .filter(k => k.startsWith('lt-'))
        .forEach(k => {
            const data = JSON.parse(localStorage.getItem(k));
            if (!data) return;

            const units = data.morning.length + data.tasks.length;
            total += units;
            done += Math.round((data.percent / 100) * units);
        });

    const percent = total ? Math.round((done / total) * 100) : 0;
    container.innerHTML = `<h2>📊 Monthly Completion: ${percent}%</h2>`;
}

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', () => {
    if (location.href.includes('weekly.html')) buildWeekly();
    if (location.href.includes('monthly.html')) loadMonthly();
});







