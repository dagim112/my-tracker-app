/* =========================
   Digital Clock
========================= */
function updateClock(){
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    const ms = String(now.getMilliseconds()).padStart(3,'0');
    const el = document.getElementById('digital-clock');
    if(el) el.textContent = `${h}:${m}:${s}.${ms}`;
}
setInterval(updateClock,50);
updateClock();

/* =========================
   Day Names
========================= */
const daysData = ['mon','tue','wed','thu','fri','sat','sun'];
const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/* =========================
   Utility Functions
========================= */
function formatDate(d=new Date()){
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const day = String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
}

/* Load saved checkboxes and notes from localStorage */
function loadTemplate(dayEl){
    const key = 'tmpl-'+dayEl.dataset.day;
    // Morning
    dayEl.querySelectorAll('.morning-checkbox').forEach((cb,i)=>{
        if(localStorage.getItem(`${key}-mor-${i}`) === 'true') cb.checked = true;
    });
    // Tasks
    dayEl.querySelectorAll('.task-checkbox').forEach((cb,i)=>{
        if(localStorage.getItem(`${key}-task-${i}`) === 'true') cb.checked = true;
    });
    // Notes
    const note = localStorage.getItem(`${key}-note`);
    if(note) dayEl.querySelector('.note-text').value = note;
}

/* Save template */
function saveTemplate(dayEl){
    const key = 'tmpl-'+dayEl.dataset.day;
    dayEl.querySelectorAll('.morning-checkbox').forEach((cb,i)=>{
        localStorage.setItem(`${key}-mor-${i}`,cb.checked);
    });
    dayEl.querySelectorAll('.task-checkbox').forEach((cb,i)=>{
        localStorage.setItem(`${key}-task-${i}`,cb.checked);
    });
    const note = dayEl.querySelector('.note-text').value || '';
    localStorage.setItem(`${key}-note`, note);
}

/* Calculate daily progress fraction */
function calcDailyProgress(dayEl){
    const morning = [...dayEl.querySelectorAll('.morning-checkbox')];
    const tasks = [...dayEl.querySelectorAll('.task-checkbox')];
    const morningDone = morning.filter(cb=>cb.checked).length;
    const morningTotal = morning.length;
    const taskDone = tasks.filter(cb=>cb.checked).length;
    const taskTotal = tasks.length;
    const total = morningTotal + taskTotal;
    const done = morningDone + taskDone;
    const percent = total ? Math.round(done/total*100) : 0;
    const bar = dayEl.querySelector('.day-progress-bar');
    if(bar) {
        bar.style.width = percent+'%';
        bar.textContent = percent+'%';
    }
    return percent;
}

/* Update all days + weekly percentage */
function updateAllProgress(){
    const dayEls = document.querySelectorAll('.day');
    let totalUnits=0, doneUnits=0;
    dayEls.forEach(d=>{
        const morning = d.querySelectorAll('.morning-checkbox').length;
        const tasks = d.querySelectorAll('.task-checkbox').length;
        const done = (calcDailyProgress(d)/100)*(morning+tasks);
        totalUnits += morning + tasks;
        doneUnits += done;
    });
    const weeklyBar = document.getElementById('weekly-progress');
    const percent = totalUnits ? Math.round(doneUnits/totalUnits*100) : 0;
    if(weeklyBar){
        weeklyBar.style.width = percent+'%';
        weeklyBar.textContent = percent+'%';
    }
}

/* =========================
   Build Weekly Days (weekly.html)
========================= */
function buildWeekly(){
    const container = document.querySelector('.days-container');
    if(!container) return;

    daysData.forEach((day,i)=>{
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.dataset.day = day;
        dayDiv.innerHTML = `
            <h2>${dayNames[i]}</h2>
            <div class="day-progress-container">
                <div class="day-progress-bar" id="progress-${day}">0%</div>
            </div>
            <div class="task morning">
                <span class="morning-title" style="font-weight:700;cursor:pointer">🌞 Morning Routine</span>
                <div class="morning-container" style="display:none;">
                    <label><input type="checkbox" class="morning-checkbox"> Drink Water</label>
                    <label><input type="checkbox" class="morning-checkbox"> Exercise</label>
                    <label><input type="checkbox" class="morning-checkbox"> Meditation</label>
                </div>
            </div>
            <div class="task">Work / Study <input type="checkbox" class="task-checkbox"></div>
            <div class="task">Break / Lunch <input type="checkbox" class="task-checkbox"></div>
            <div class="day-notes">
                <label>📝 Notes:</label>
                <textarea class="note-text"></textarea>
            </div>
        `;
        container.appendChild(dayDiv);
        loadTemplate(dayDiv);
    });

    /* Toggle morning routine */
    document.addEventListener('click',e=>{
        if(e.target.classList.contains('morning-title')){
            const box = e.target.nextElementSibling;
            box.style.display = box.style.display==='flex'?'none':'flex';
        }
    });

    /* Save on change */
    document.addEventListener('change',e=>{
        if(e.target.classList.contains('morning-checkbox') || e.target.classList.contains('task-checkbox')){
            const dayEl = e.target.closest('.day');
            saveTemplate(dayEl);
            updateAllProgress();
        }
    });

    document.addEventListener('input', e=>{
        if(e.target.classList.contains('note-text')){
            const dayEl = e.target.closest('.day');
            saveTemplate(dayEl);
        }
    });

    updateAllProgress();
}

/* =========================
   Daily Page Loader (daily.html)
========================= */
function loadDaily(){
    const params = new URLSearchParams(window.location.search);
    const day = params.get('day') || 'mon';
    const dayEl = document.querySelector(`[data-day="${day}"]`);
    if(!dayEl) return;
    const container = document.getElementById('day-content');
    if(!container) return;
    container.innerHTML = '';
    container.appendChild(dayEl.cloneNode(true));
    container.querySelectorAll('input').forEach(inp=>{
        inp.addEventListener('change', ()=>{
            saveTemplate(container.querySelector('.day'));
            updateAllProgress();
        });
    });
}

/* =========================
   Monthly Page (monthly.html)
========================= */
function loadMonthly(){
    // Collect all snapshots from localStorage
    let total = 0, done = 0;
    daysData.forEach(day=>{
        const key = 'tmpl-'+day;
        const morningDone = [...Array(document.querySelectorAll(`#${key} .morning-checkbox`).length)].filter(cb=>cb.checked).length;
        const taskDone = [...Array(document.querySelectorAll(`#${key} .task-checkbox`).length)].filter(cb=>cb.checked).length;
        total += morningDone + taskDone;
        done += morningDone + taskDone;
    });
    const percent = total?Math.round(done/total*100):0;
    const container = document.querySelector('.days-container');
    if(container) container.innerHTML = `<h2>Month Completion: ${percent}%</h2>`;
}

/* =========================
   Initialize Page
========================= */
document.addEventListener('DOMContentLoaded', ()=>{
    if(document.querySelector('.days-container') && window.location.href.includes('weekly.html')){
        buildWeekly();
    }
    if(document.getElementById('day-content') && window.location.href.includes('daily.html')){
        loadDaily();
    }
    if(document.querySelector('.days-container') && window.location.href.includes('monthly.html')){
        loadMonthly();
    }
});
/ ------- MENU TOGGLE -------
const menuBtn = document.getElementById("menu-btn");
const dropdown = document.getElementById("menu-dropdown");

menuBtn.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
});

// Hide dropdown when clicking outside
document.addEventListener("click", (e) => {
    if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
    }
});





