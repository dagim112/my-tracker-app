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
   DATE HELPERS
========================= */
function formatDate(d = new Date()) {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/* =========================
   LOCAL STORAGE HELPERS
========================= */
function getDayKey(day) {
    // Accept string 'mon' etc or Date
    if (typeof day === 'string') return `lt-${day}`;
    return `lt-${formatDate(day)}`;
}

function saveDayData(key, data) {
    localStorage.setItem(getDayKey(key), JSON.stringify(data));
}

function loadDayData(key) {
    const raw = localStorage.getItem(getDayKey(key));
    return raw ? JSON.parse(raw) : null;
}

/* =========================
   SAVE / LOAD TEMPLATE
========================= */
function saveTemplate(dayEl) {
    const morning = [...dayEl.querySelectorAll('.morning-checkbox')].map(cb => cb.checked);
    const tasks = [...dayEl.querySelectorAll('.task-checkbox')].map(cb => cb.checked);
    const note = dayEl.querySelector('.note-text')?.value || '';

    // Expense
    const expenseAmount = dayEl.querySelector('.expense-amount')?.value || 0;
    const expenseType = dayEl.querySelector('.expense-type')?.value || 'other';

    const total = morning.length + tasks.length;
    const done = morning.filter(Boolean).length + tasks.filter(Boolean).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    const data = {
        morning,
        tasks,
        note,
        percent,
        expense: {
            amount: Number(expenseAmount),
            type: expenseType
        }
    };

    saveDayData(dayEl.dataset.day || new Date(), data);
}

function loadTemplate(dayEl) {
    const data = loadDayData(dayEl.dataset.day || new Date());
    if (!data) return;

    dayEl.querySelectorAll('.morning-checkbox')
        .forEach((cb, i) => cb.checked = !!data.morning?.[i]);

    dayEl.querySelectorAll('.task-checkbox')
        .forEach((cb, i) => cb.checked = !!data.tasks?.[i]);

    if (dayEl.querySelector('.note-text')) dayEl.querySelector('.note-text').value = data.note || '';

    if (data.expense) {
        dayEl.querySelector('.expense-amount').value = data.expense.amount;
        dayEl.querySelector('.expense-type').value = data.expense.type;
    }
}

/* =========================
   DAILY PAGE LOADER
========================= */
function loadDailyPage() {
    const params = new URLSearchParams(window.location.search);
    const day = params.get('day') || 'mon';
    const daysData = ['mon','tue','wed','thu','fri','sat','sun'];
    const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const container = document.getElementById('day-content');
    container.innerHTML = '';

    const idx = daysData.indexOf(day);
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    dayDiv.dataset.day = day;

    dayDiv.innerHTML = `
        <h2>
          ${dayNames[idx]}<br>
          <small class="day-date">
            ${formatDate(new Date()).split('-').reverse().join(' / ')}
          </small>
        </h2>

        <div class="task morning">
            🌞 Morning Routine:
            <div class="morning-subtasks">
                <label><input type="checkbox" class="morning-checkbox"> Drink Water</label>
                <label><input type="checkbox" class="morning-checkbox"> Exercise</label>
                <label><input type="checkbox" class="morning-checkbox"> Meditation</label>
                <label><input type="checkbox" class="morning-checkbox"> Reading</label>
            </div>
            <canvas id="chart-${day}"></canvas>
        </div>

        <div class="task">💻 Work / Study <input type="checkbox" class="task-checkbox"></div>
        <div class="task">🇳🇱 Dutch Course <input type="checkbox" class="task-checkbox"></div>

        <textarea class="note-text" placeholder="Notes / Reason"></textarea>

        <!-- Expense Tracker -->
        <div class="expense-box">
            <label>💰 Expense Tracker:</label><br>
            <input type="number" class="expense-amount" placeholder="Amount">
            <select class="expense-type">
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
            </select>
        </div>
    `;

    container.appendChild(dayDiv);

    // Load from localStorage
    loadTemplate(dayDiv);

    // Morning Pie Chart
    const ctx = document.getElementById(`chart-${day}`).getContext('2d');
    const morningCheckboxes = [...dayDiv.querySelectorAll('.morning-checkbox')];
    function updateChart() {
        const done = morningCheckboxes.filter(cb => cb.checked).length;
        const remaining = morningCheckboxes.length - done;
        if (window.morningChart) window.morningChart.destroy();
        window.morningChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Done','Remaining'],
                datasets:[{
                    data:[done,remaining],
                    backgroundColor:['#0f4d0f','#555'],
                }]
            },
            options:{
                plugins:{
                    legend:{position:'bottom',labels:{color:'#000'}},
                    tooltip:{enabled:true}
                }
            }
        });
    }
    updateChart();

    // Event listeners
    morningCheckboxes.forEach(cb => cb.addEventListener('change', ()=>{
        saveTemplate(dayDiv);
        updateChart();
    }));

    dayDiv.querySelectorAll('.task-checkbox').forEach(cb=>{
        cb.addEventListener('change', ()=>{
            saveTemplate(dayDiv);
        });
    });

    dayDiv.querySelector('.note-text').addEventListener('input',()=>{
        saveTemplate(dayDiv);
    });

    const expenseInputs = dayDiv.querySelectorAll('.expense-amount, .expense-type');
    expenseInputs.forEach(input => {
        input.addEventListener('input', () => saveTemplate(dayDiv));
    });
}

/* =========================
   INITIALIZE
========================= */
document.addEventListener('DOMContentLoaded', ()=>{
    updateClock();
    loadDailyPage();
});







