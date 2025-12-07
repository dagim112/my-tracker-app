const checkboxes = document.querySelectorAll('.task-checkbox');
const dailyPercentEl = document.getElementById('dailyPercent');
const weeklyPercentEl = document.getElementById('weeklyPercent');
const progressChartCtx = document.getElementById('progressChart').getContext('2d');

// Load saved data from localStorage
const savedData = JSON.parse(localStorage.getItem('trackerData')) || {};
checkboxes.forEach(chk => {
  const id = chk.parentElement.dataset.id;
  if(savedData[id]) chk.checked = true;
});

// Calculate and update progress
function updateProgress() {
  const total = checkboxes.length;
  let completed = 0;
  checkboxes.forEach(chk => { if(chk.checked) completed++; });

  const dailyPercent = Math.round((completed/total)*100);
  dailyPercentEl.textContent = `Daily Progress: ${dailyPercent}%`;

  // For weekly, you can implement your own logic or sum daily percentages
  const weeklyPercent = dailyPercent; // placeholder
  weeklyPercentEl.textContent = `Weekly Progress: ${weeklyPercent}%`;

  // Update chart
  progressChart.data.datasets[0].data = [completed, total-completed];
  progressChart.update();
}

// Save data to localStorage
function saveData() {
  const data = {};
  checkboxes.forEach(chk => {
    const id = chk.parentElement.dataset.id;
    data[id] = chk.checked;
  });
  localStorage.setItem('trackerData', JSON.stringify(data));
}

// Add event listeners
checkboxes.forEach(chk => {
  chk.addEventListener('change', () => {
    saveData();
    updateProgress();
  });
});

// Initialize Chart.js
const progressChart = new Chart(progressChartCtx, {
  type: 'doughnut',
  data: {
    labels: ['Completed', 'Remaining'],
    datasets: [{
      data: [0, checkboxes.length],
      backgroundColor: ['#FFAFBD', '#ffc3a0']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true }
    }
  }
});

// Initial update
updateProgress();
// Save note to localStorage
document.querySelectorAll('.note-text').forEach(note => {
  note.addEventListener('input', e => {
    const day = note.closest('.day').dataset.day;
    localStorage.setItem('note-' + day, note.value);
  });
});

// Load saved notes on page load
document.querySelectorAll('.note-text').forEach(note => {
  const day = note.closest('.day').dataset.day;
  const saved = localStorage.getItem('note-' + day);
  if(saved) note.value = saved;
});
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  const ms = String(now.getMilliseconds()).padStart(3,'0'); // 3-digit milliseconds
  document.getElementById('digital-clock').innerText = `${h}:${m}:${s}:${ms}`;
}
setInterval(updateClock, 10); // update every 10ms for smooth microsecond display
updateClock(); // initial call

