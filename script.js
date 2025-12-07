// -----------------------------
// Variables
// -----------------------------
const checkboxes = document.querySelectorAll('.morning-checkbox, .task-checkbox');
const weeklyBar = document.getElementById('weekly-progress');
const morningCharts = {};

// Initialize morning doughnut charts
document.querySelectorAll('.day').forEach(day => {
  const canvas = day.querySelector('canvas');
  if(canvas){
    const ctx = canvas.getContext('2d');
    morningCharts[day.dataset.day] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [0, 7],
          backgroundColor: ['#4CAF50','#ddd'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'bottom' },
          datalabels: {
            formatter: (value, ctx) => {
              const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
              return ctx.dataIndex === 0 ? Math.round((value/total)*100)+'%' : '';
            },
            color:'#fff',
            font:{ weight:'bold', size:14 }
          },
          title: { display:true, text:'Morning Progress', font:{size:14} }
        }
      },
      plugins: [ChartDataLabels]
    });
  }
});

// -----------------------------
// Functions
// -----------------------------

// Save checkbox states
function saveState(){
  checkboxes.forEach(cb => {
    const id = cb.closest('.day').dataset.day + '-' + cb.parentElement.innerText.trim();
    localStorage.setItem(id, cb.checked);
  });
}

// Load checkbox states
function loadState(){
  checkboxes.forEach(cb => {
    const id = cb.closest('.day').dataset.day + '-' + cb.parentElement.innerText.trim();
    const saved = localStorage.getItem(id);
    if(saved === 'true') cb.checked = true;
  });
}

// Save/load notes
document.querySelectorAll('.note-text').forEach(note => {
  const day = note.closest('.day').dataset.day;
  // Load saved note
  const saved = localStorage.getItem('note-' + day);
  if(saved) note.value = saved;
  // Save on input
  note.addEventListener('input', () => {
    localStorage.setItem('note-' + day, note.value);
  });
});

// Update morning chart for a day and return fraction
function updateMorningChart(day){
  const chart = morningCharts[day.dataset.day];
  if(!chart) return 0;
  const checkboxes = day.querySelectorAll('.morning-checkbox');
  const completed = Array.from(checkboxes).filter(cb=>cb.checked).length;
  const total = checkboxes.length;
  chart.data.datasets[0].data = [completed, total-completed];
  chart.update();
  return completed/total;
}

// Update all progress
function updateProgress(){
  const days = document.querySelectorAll('.day');
  let totalTasks=0, totalCompleted=0;

  days.forEach(day => {
    const morningFraction = updateMorningChart(day);
    const morningWeight = 1; // weight of morning routine
    const morningCompleted = morningFraction * morningWeight;

    const otherTasks = day.querySelectorAll('.task-checkbox');
    const totalDayTasks = morningWeight + otherTasks.length;
    const completedDayTasks = morningCompleted + Array.from(otherTasks).filter(cb=>cb.checked).length;

    // Update day progress bar
    const dailyPercent = Math.round((completedDayTasks/totalDayTasks)*100);
    const dailyBar = day.querySelector('.day-progress-bar');
    dailyBar.style.width = dailyPercent + '%';
    dailyBar.innerText = `${dailyPercent}% (Goal: 80%)`;
    dailyBar.style.background = dailyPercent>=80 ? '#4CAF50' : '#2196F3';

    totalTasks += totalDayTasks;
    totalCompleted += completedDayTasks;
  });

  // Update weekly progress
  const weeklyPercent = Math.round((totalCompleted/totalTasks)*100);
  weeklyBar.style.width = weeklyPercent + '%';
  weeklyBar.innerText = `${weeklyPercent}% (Goal: 90%)`;
  weeklyBar.style.background = weeklyPercent>=90 ? '#4CAF50' : '#2196F3';
}

// Update clock with milliseconds
function updateClock(){
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  const ms = String(now.getMilliseconds()).padStart(3,'0');
  const clock = document.getElementById('digital-clock');
  if(clock) clock.innerText = `${h}:${m}:${s}:${ms}`;
}

// -----------------------------
// Event Listeners
// -----------------------------
document.addEventListener('change', e => {
  if(e.target.classList.contains('morning-checkbox') || e.target.classList.contains('task-checkbox')){
    saveState();
    updateProgress();
  }
});

// -----------------------------
// Initialize
// -----------------------------
loadState();
updateProgress();
setInterval(updateClock, 10);
updateClock();

// Hourly voice reminder
const audio=document.getElementById('my-sound');
const button=document.getElementById('start-sound');
let timer;
button.addEventListener('click',()=>{
  audio.play().catch(e=>console.log(e));
  timer=setInterval(()=>{audio.play().catch(e=>console.log(e));},3600000);
  alert('Hourly voice reminders started!');
});

// Register service worker
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}



