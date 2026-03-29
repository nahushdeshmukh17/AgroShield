// ── Auth guard ───────────────────────────────────────────────
const TOKEN = localStorage.getItem('agroshield_token');
if (!TOKEN) {
  window.location.replace('login.html');
  throw new Error('Not authenticated');
}
document.getElementById('user-name').textContent =
  '👤 ' + (document.cookie.match(/username=([^;]+)/)?.[1] || 'Farmer');

function logout() {
  fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
    window.location.href = '/home.html';
  });
}

const authHeaders = () => ({ 'Content-Type': 'application/json' });

let charts = {};
const TAB_META = {
  dashboard: ['Dashboard',        'AI-powered pest risk overview'],
  forecast:  ['Forecast',         '7-day day-by-day risk breakdown'],
  advisory:  ['Advisory',         'Recommended actions based on risk'],
  alerts:    ['Alerts',           'Risk notifications for your region'],
  weather:   ['Weather Details',  '7-day temperature, humidity & wind'],
  history:   ['History',          'Past analyses saved on this device'],
  settings:  ['Settings',         'Configure your preferences'],
};

function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-nav'));
  document.getElementById(`tab-${name}`).classList.remove('hidden');
  document.getElementById(`nav-${name}`).classList.add('active-nav');
  document.getElementById('page-title').textContent = TAB_META[name][0];
  document.getElementById('page-sub').textContent   = TAB_META[name][1];
  if (name === 'history') renderHistory();
}

// ── Chart helper ──────────────────────────────────────────────
function makeChart(id, labels, datasets, yLabel = '%') {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, 'rgba(74,222,128,0.25)');
  grad.addColorStop(1, 'rgba(74,222,128,0)');

  const defaultDataset = (d) => ({
    tension: 0.4,
    borderColor: d.color || '#4ade80',
    backgroundColor: d.fill ? grad : 'transparent',
    fill: !!d.fill,
    pointBackgroundColor: d.color || '#4ade80',
    pointRadius: 4,
    ...d,
  });

  charts[id] = new Chart(document.getElementById(id), {
    type: 'line',
    data: { labels, datasets: datasets.map(defaultDataset) },
    options: {
      plugins: { legend: { labels: { color: '#9ca3af', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#6b7280', callback: v => v + yLabel }, grid: { color: 'rgba(255,255,255,0.04)' }, min: 0 }
      }
    }
  });
}

// ── Risk helpers ──────────────────────────────────────────────
const riskColor = l => l === 'HIGH' ? 'text-red-400' : l === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400';
const riskBg    = l => l === 'HIGH' ? 'border-red-500/30 bg-red-500/10' : l === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-green-500/30 bg-green-500/10';
const riskIcon  = l => l === 'HIGH' ? '🚨' : l === 'MEDIUM' ? '⚠️' : '✅';
const pctToLevel = p => p >= 60 ? 'HIGH' : p >= 35 ? 'MEDIUM' : 'LOW';

// ── History (MongoDB) ─────────────────────────────────────────
async function renderHistory() {
  const el = document.getElementById('history-list');
  el.innerHTML = '<div class="text-center text-gray-600 py-8 text-sm">Loading...</div>';
  try {
    const res     = await fetch('/api/history', { headers: authHeaders() });
    const history = await res.json();
    if (!history.length) {
      el.innerHTML = '<div class="text-center text-gray-600 py-16 text-sm">No history yet. Run an analysis to start tracking.</div>';
      return;
    }
    el.innerHTML = history.map(h => `
      <div class="flex items-center justify-between bg-white/[0.03] border ${riskBg(h.risk_level)} rounded-2xl px-5 py-4">
        <div class="flex items-center gap-3">
          <span class="text-xl">${riskIcon(h.risk_level)}</span>
          <div>
            <p class="font-semibold">${h.city}</p>
            <p class="text-xs text-gray-500 mt-0.5">Peak: ${h.peak_day}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold ${riskColor(h.risk_level)}">${h.risk_level}</p>
          <p class="text-xs text-gray-600 mt-0.5">${new Date(h.createdAt).toLocaleString()}</p>
        </div>
      </div>`).join('');
  } catch {
    el.innerHTML = '<div class="text-center text-red-400 py-8 text-sm">Failed to load history.</div>';
  }
}

function clearHistory() { renderHistory(); }

// ── Main predict ──────────────────────────────────────────────
async function predict() {
  const city = document.getElementById('city').value.trim();
  const crop = document.getElementById('crop').value;
  const errEl = document.getElementById('api-error');
  errEl.classList.add('hidden');

  if (!city) {
    errEl.textContent = 'Please enter a city name.';
    errEl.classList.remove('hidden');
    return;
  }

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('analyze-btn').disabled = true;

  let data;
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}&crop=${crop}`, { headers: authHeaders() });
    data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
  } catch (e) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('analyze-btn').disabled = false;
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
    return;
  }
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('analyze-btn').disabled = false;

  const labels = data.forecast.map(d => d.date);
  const values = data.forecast.map(d => +(d.probability * 100).toFixed(1));

  // ── DASHBOARD ──
  const riskEl = document.getElementById('val-risk');
  riskEl.textContent = data.risk_level;
  riskEl.className = `text-3xl font-extrabold ${riskColor(data.risk_level)}`;
  document.getElementById('val-peak').textContent = data.peak_day;
  document.getElementById('val-city').textContent = `${city} / ${crop}`;
  document.getElementById('val-pest').textContent = data.likely_pest || '—';
  document.getElementById('val-pest').className = `text-lg font-bold ${riskColor(data.risk_level)}`;
  document.getElementById('empty-dashboard').classList.add('hidden');
  makeChart('chart-dashboard', labels, [{ label: 'Risk %', data: values, fill: true }]);

  // ── FORECAST ──
  document.getElementById('forecast-cards').innerHTML = data.forecast.map(d => {
    const pct = +(d.probability * 100).toFixed(1);
    const lvl = pctToLevel(pct);
    return `
      <div class="bg-white/[0.03] border ${riskBg(lvl)} rounded-2xl p-4 text-center">
        <p class="text-xs text-gray-500 mb-1">${d.date}</p>
        <p class="text-2xl font-extrabold ${riskColor(lvl)}">${pct}%</p>
        <p class="text-xs mt-1 ${riskColor(lvl)}">${lvl}</p>
      </div>`;
  }).join('');
  makeChart('chart-forecast', labels, [{ label: 'Risk %', data: values, fill: true }]);

  // ── ADVISORY ──
  const tips = {
    HIGH:   ['Apply recommended pesticides immediately', 'Increase field monitoring to twice daily', 'Alert neighboring farms', 'Avoid irrigation during peak hours'],
    MEDIUM: ['Schedule preventive pesticide application', 'Monitor fields daily for early signs', 'Prepare protective equipment'],
    LOW:    ['Continue routine monitoring', 'No immediate action required', 'Keep records for trend analysis'],
  };
  document.getElementById('advisory-content').innerHTML = `
    <div class="bg-white/[0.03] border ${riskBg(data.risk_level)} rounded-2xl p-6 mb-4">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-2xl">${riskIcon(data.risk_level)}</span>
        <div>
          <p class="font-bold text-lg ${riskColor(data.risk_level)}">${data.risk_level} RISK — ${city}</p>
          <p class="text-xs text-gray-400">Peak day: ${data.peak_day}</p>
        </div>
      </div>
      <p class="text-gray-300 text-sm">${data.advice}</p>
    </div>
    <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
      <p class="font-semibold mb-3 text-sm">Recommended Actions</p>
      <ul class="space-y-2">
        ${(tips[data.risk_level] || tips.LOW).map(t => `
          <li class="flex items-start gap-2 text-sm text-gray-300">
            <span class="text-green-400 mt-0.5">✓</span> ${t}
          </li>`).join('')}
      </ul>
    </div>`;

  // ── ALERTS ──
  const alertsList = document.getElementById('alerts-list');
  if (alertsList.querySelector('.text-gray-600')) alertsList.innerHTML = '';
  alertsList.insertAdjacentHTML('afterbegin', `
    <div class="flex items-start gap-4 bg-white/[0.03] border ${riskBg(data.risk_level)} rounded-2xl p-4">
      <span class="text-2xl">${riskIcon(data.risk_level)}</span>
      <div class="flex-1">
        <p class="font-semibold ${riskColor(data.risk_level)}">${data.risk_level} Risk — ${city}</p>
        <p class="text-sm text-gray-400 mt-0.5">Peak: ${data.peak_day} · ${new Date().toLocaleString()}</p>
      </div>
    </div>`);

  // ── WEATHER DETAILS ──
  if (data.weather) {
    const temps = data.weather.map(d => d.temp);
    const humids = data.weather.map(d => d.humidity);
    document.getElementById('weather-cards').innerHTML = `
      <div class="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        ${data.weather.map(d => `
          <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
            <p class="text-xs text-gray-500 mb-2">${d.date}</p>
            ${d.icon ? `<img src="https:${d.icon}" class="w-10 h-10 mx-auto mb-1"/>` : ''}
            <p class="text-xs text-gray-400 mb-2">${d.condition || ''}</p>
            <p class="text-lg font-bold text-orange-300">${d.temp}°C</p>
            <p class="text-xs text-blue-300 mt-1">💧 ${d.humidity}%</p>
            <p class="text-xs text-gray-400 mt-0.5">💨 ${d.wind ?? '—'} km/h</p>
            <p class="text-xs text-cyan-400 mt-0.5">🌧 ${d.rain} mm</p>
          </div>`).join('')}
      </div>
      <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
        <p class="text-sm font-semibold text-gray-300 mb-4">Temperature & Humidity Trend</p>
        <canvas id="chart-weather" height="100"></canvas>
      </div>`;
    makeChart('chart-weather', labels,
      [
        { label: 'Temp (°C)', data: temps, color: '#fb923c', fill: false },
        { label: 'Humidity (%)', data: humids, color: '#60a5fa', fill: false },
      ],
      ''
    );
  }

}
