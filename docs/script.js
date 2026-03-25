/* ══════════════════════════════════════════════════════════
   DevSecOps Dashboard — script.js
   Live GitHub Actions API + animations + chart rendering
══════════════════════════════════════════════════════════ */

'use strict';

// ── Config ──────────────────────────────────────────────
const REPO_OWNER = 'Meghana-Kalwal';
const REPO_NAME  = 'DVWA';
const METRICS_URL = 'data/sample-metrics.json';
const PIPELINE_URL = `data/pipeline-summary.json`;
const GH_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const REFRESH_INTERVAL = 30; // seconds

// Workflow file → card mapping
const WORKFLOW_MAP = [
  { file: 'semgrep.yml',          id: 'semgrep',     pill: 'pill-semgrep',     meta: 'meta-semgrep' },
  { file: 'sast-sonarcloud.yml', id: 'sonarcloud',  pill: 'pill-sonarcloud',  meta: 'meta-sonarcloud' },
  { file: 'dast-owasp-zap.yml', id: 'zap',         pill: 'pill-zap',         meta: 'meta-zap' },
  { file: 'dast-w3af.yml',       id: 'w3af',        pill: 'pill-w3af',        meta: 'meta-w3af' },
  { file: 'security-pipeline.yml', id: 'pipeline',  pill: 'pill-pipeline',    meta: 'meta-pipeline' },
];

// ── State ────────────────────────────────────────────────
let metricsData = null;
let refreshTimer = REFRESH_INTERVAL;
let countdownInterval = null;

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMatrix();
  initNavScroll();
  initScrollObserver();
  loadMetrics();
  fetchPipelineStatus();
  startRefreshCountdown();
});

// ════════════════════════════════════
// MATRIX CANVAS ANIMATION
// ════════════════════════════════════
function initMatrix() {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, drops;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    drops = Array(Math.floor(W / 16)).fill(1);
  }

  resize();
  window.addEventListener('resize', resize);

  const chars = '01アイウエオセキュリティVULNDVWASQLXSSCSRF';
  function draw() {
    ctx.fillStyle = 'rgba(8,12,30,0.05)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00ff88';
    ctx.font = '13px JetBrains Mono, monospace';
    drops.forEach((y, i) => {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * 16, y * 16);
      if (y * 16 > H && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }
  setInterval(draw, 50);
}

// ════════════════════════════════════
//  NAVBAR SCROLL EFFECT
// ════════════════════════════════════
function initNavScroll() {
  const nav = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    const scrollY = window.scrollY + 100;
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        links.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + sec.id);
        });
      }
    });
  });
}

// ════════════════════════════════════
// INTERSECTION OBSERVER (animations)
// ════════════════════════════════════
function initScrollObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Trigger bar animations inside
        entry.target.querySelectorAll('[data-width]').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
        entry.target.querySelectorAll('.tc-bar-fill[data-pct]').forEach(bar => {
          bar.style.width = bar.dataset.pct + '%';
        });
        entry.target.querySelectorAll('.f1-fill[data-width]').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
        entry.target.querySelectorAll('.ttd-bar-fill[data-width]').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.tool-card, .verdict-card, .ttd-row, .accuracy-table').forEach(el => {
    el.classList.add('fade-in-up');
    observer.observe(el);
  });
}

// ════════════════════════════════════
// LOAD METRICS JSON
// ════════════════════════════════════
async function loadMetrics() {
  try {
    // Try live pipeline-summary first, fallback to sample
    let res = await fetch(PIPELINE_URL + '?t=' + Date.now());
    if (!res.ok) res = await fetch(METRICS_URL + '?t=' + Date.now());
    metricsData = await res.json();
  } catch {
    try {
      const res = await fetch(METRICS_URL);
      metricsData = await res.json();
    } catch (e) {
      console.warn('Could not load metrics:', e);
      metricsData = getFallbackData();
    }
  }
  renderAll();
}

function getFallbackData() {
  return {
    tools: {
      semgrep:    { tool_label:'Semgrep', tool_type:'SAST', total_findings:26, critical:9, high:11, medium:4, low:2, ttd_seconds:167, f1_score:0.943, precision:0.923, recall:0.963, false_positives:2, false_negatives:1, verdict:'Best SAST Tool' },
      sonarcloud: { tool_label:'SonarCloud', tool_type:'SAST', total_findings:19, critical:4, high:7, medium:5, low:3, ttd_seconds:312, f1_score:0.809, precision:0.792, recall:0.826, false_positives:5, false_negatives:4 },
      owasp_zap:  { tool_label:'OWASP ZAP', tool_type:'DAST', total_findings:22, high:8, medium:9, low:5, ttd_seconds:1291, f1_score:0.898, precision:0.88, recall:0.917, false_positives:3, false_negatives:2, verdict:'Best DAST Tool' },
      w3af:       { tool_label:'w3af', tool_type:'DAST', total_findings:14, high:5, medium:6, low:3, ttd_seconds:2117, f1_score:0.737, precision:0.778, recall:0.70, false_positives:4, false_negatives:6 }
    },
    aggregated: { total_findings_all_tools:81, unique_confirmed_vulnerabilities:27, fastest_tool:'semgrep', best_sast:'semgrep', best_dast:'owasp_zap', pipeline_runs:1 }
  };
}

// ════════════════════════════════════
// RENDER ALL DASHBOARD SECTIONS
// ════════════════════════════════════
function renderAll() {
  if (!metricsData) return;
  const tools = metricsData.tools || {};
  const agg = metricsData.aggregated || {};

  animateHeroStats(agg);
  renderToolCards(tools);
  renderTTDChart(tools, agg);
  renderHeatmap();
  renderAccuracyTable(tools);
  renderVerdict(tools, agg);
}

// ── Hero counter animation ───────────────────────────────
function animateHeroStats(agg) {
  const runs = metricsData.pipeline_runs?.length || agg.pipeline_runs || metricsData.aggregated?.total_findings_all_tools ? 1 : 0;
  animateCounter(document.getElementById('statUnique'), agg.unique_confirmed_vulnerabilities || 27);
  animateCounter(document.getElementById('statTools'), 4);
  animateCounter(document.getElementById('statFindings'), agg.total_findings_all_tools || 81);
  const pipelEl = document.getElementById('statPipeline');
  if (pipelEl) pipelEl.textContent = runs || '—';
}

function animateCounter(el, target) {
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 50));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

// ── Tool Cards ───────────────────────────────────────────
const TOOL_ICONS = { semgrep:'⚡', sonarcloud:'☁️', owasp_zap:'🕷️', w3af:'🔓' };

function renderToolCards(tools) {
  const container = document.getElementById('toolCards');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(tools).forEach(([key, data]) => {
    const isSAST = data.tool_type === 'SAST';
    const maxFindings = Math.max(...Object.values(tools).map(t => t.total_findings || 0)) || 1;
    const critical = data.critical || 0;
    const high = data.high || 0;
    const medium = data.medium || 0;
    const low = data.low || 0;
    const total = data.total_findings || 0;
    const ttd = formatTTD(data.ttd_seconds);

    const card = document.createElement('div');
    card.className = `tool-card fade-in-up ${isSAST ? '' : 'dast-card'}`;
    card.dataset.type = data.tool_type;
    card.innerHTML = `
      <div class="tc-header">
        <span class="tc-icon">${TOOL_ICONS[key] || '🔍'}</span>
        <div>
          <div class="tc-name">${data.tool_label || key}</div>
          <span class="tc-type ${isSAST ? 'sast' : 'dast'}">${data.tool_type}</span>
        </div>
      </div>
      <div class="tc-stats">
        <div class="tc-stat"><span class="tc-stat-num critical">${critical}</span><span class="tc-stat-label">Critical</span></div>
        <div class="tc-stat"><span class="tc-stat-num high">${high}</span><span class="tc-stat-label">High</span></div>
        <div class="tc-stat"><span class="tc-stat-num total">${total}</span><span class="tc-stat-label">Total</span></div>
      </div>
      ${barRow('Critical', critical, maxFindings, 'critical')}
      ${barRow('High', high, maxFindings, 'high')}
      ${barRow('Medium', medium, maxFindings, 'medium')}
      ${barRow('Low', low, maxFindings, 'low')}
      <div class="tc-ttd">⏱ Time to Detect: <span>${ttd}</span></div>
    `;
    container.appendChild(card);

    // Animate bars after brief delay
    setTimeout(() => {
      card.querySelectorAll('.tc-bar-fill[data-pct]').forEach(b => { b.style.width = b.dataset.pct + '%'; });
    }, 200);
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.tool-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.type === filter) ? '' : 'none';
      });
    });
  });
}

function barRow(label, val, max, cls) {
  const pct = max > 0 ? Math.round((val / max) * 100) : 0;
  return `<div class="tc-severity-bar">
    <div class="tc-severity-label"><span>${label}</span><span>${val}</span></div>
    <div class="tc-bar-bg"><div class="tc-bar-fill ${cls}" data-pct="${pct}" style="width:0%"></div></div>
  </div>`;
}

// ── TTD Chart ─────────────────────────────────────────────
function renderTTDChart(tools, agg) {
  const container = document.getElementById('ttdBars');
  if (!container) return;
  container.innerHTML = '';

  const maxTTD = Math.max(...Object.values(tools).map(t => t.ttd_seconds || 0)) || 1;
  const best = agg.fastest_tool || '';

  Object.entries(tools).forEach(([key, data]) => {
    const ttd = data.ttd_seconds || 0;
    const pct = Math.max(5, Math.round((ttd / maxTTD) * 100));
    const isSAST = data.tool_type === 'SAST';
    const isBest = key === best;
    const row = document.createElement('div');
    row.className = 'ttd-row fade-in-up';
    row.innerHTML = `
      <div class="ttd-label">${TOOL_ICONS[key] || ''} ${data.tool_label || key}</div>
      <div class="ttd-bar-bg">
        <div class="ttd-bar-fill ${isSAST ? 'sast' : 'dast'} ${isBest ? 'best' : ''}"
             data-width="${pct}" style="width:0%">${formatTTD(ttd)}</div>
      </div>
      <div class="ttd-value">${ttd}s</div>
    `;
    container.appendChild(row);
    setTimeout(() => {
      row.querySelectorAll('[data-width]').forEach(b => { b.style.width = b.dataset.width + '%'; });
    }, 300);
  });
}

// ── Heatmap ───────────────────────────────────────────────
const HEATMAP_DATA = [
  { vuln:'SQL Injection',          semgrep:'high', sonarcloud:'high', owasp_zap:'high', w3af:'high' },
  { vuln:'XSS (Reflected/Stored)', semgrep:'high', sonarcloud:'high', owasp_zap:'high', w3af:'high' },
  { vuln:'Command Injection',      semgrep:'high', sonarcloud:'med',  owasp_zap:'med',  w3af:'high' },
  { vuln:'File Inclusion (LFI/RFI)',semgrep:'high', sonarcloud:'low', owasp_zap:'med',  w3af:'high' },
  { vuln:'CSRF',                    semgrep:'high', sonarcloud:'med', owasp_zap:'high', w3af:'med'  },
  { vuln:'File Upload Bypass',      semgrep:'med',  sonarcloud:'low', owasp_zap:'med',  w3af:'high' },
  { vuln:'Hardcoded Secrets',       semgrep:'high', sonarcloud:'high',owasp_zap:'none', w3af:'none' },
  { vuln:'Security Headers',        semgrep:'low',  sonarcloud:'med', owasp_zap:'high', w3af:'med'  },
  { vuln:'XXE Injection',           semgrep:'med',  sonarcloud:'low', owasp_zap:'low',  w3af:'high' },
  { vuln:'Open Redirect',           semgrep:'med',  sonarcloud:'low', owasp_zap:'high', w3af:'low'  },
  { vuln:'Dependency Vulns',        semgrep:'none', sonarcloud:'high',owasp_zap:'none', w3af:'none' },
  { vuln:'Code Smells',             semgrep:'none', sonarcloud:'high',owasp_zap:'none', w3af:'none' },
];

const HM_ICONS = { high:'✅', med:'⚠️', low:'🔸', none:'—' };
const HM_CLASSES = { high:'hm-high', med:'hm-med', low:'hm-low', none:'hm-none' };

function renderHeatmap() {
  const tbody = document.getElementById('heatmapBody');
  if (!tbody) return;
  tbody.innerHTML = HEATMAP_DATA.map(row => `
    <tr>
      <td>${row.vuln}</td>
      ${['semgrep','sonarcloud','owasp_zap','w3af'].map(t =>
        `<td><span class="hm-cell ${HM_CLASSES[row[t]]}">${HM_ICONS[row[t]]}</span></td>`
      ).join('')}
    </tr>
  `).join('');
}

// ── Accuracy Table ────────────────────────────────────────
function renderAccuracyTable(tools) {
  const tbody = document.getElementById('accuracyBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  Object.entries(tools).forEach(([key, data]) => {
    const f1 = data.f1_score || 0;
    const pr = data.precision || 0;
    const re = data.recall || 0;
    const fp = data.false_positives || 0;
    const fn = data.false_negatives || 0;
    const total = data.total_findings || 0;
    const isSAST = data.tool_type === 'SAST';

    const rating = f1 >= 0.9 ? 'excellent' : f1 >= 0.8 ? 'good' : 'ok';
    const ratingLabels = { excellent: '⭐ Excellent', good: '✅ Good', ok: '⚠️ Fair' };

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="tool-name">${TOOL_ICONS[key] || ''} ${data.tool_label || key}</span></td>
      <td><span class="type-badge ${isSAST ? 'sast' : 'dast'}">${data.tool_type}</span></td>
      <td style="font-family:'JetBrains Mono',monospace">${total}</td>
      <td style="color:var(--red)">${fp}</td>
      <td style="color:var(--amber)">${fn}</td>
      <td style="font-family:'JetBrains Mono',monospace">${pr.toFixed(3)}</td>
      <td style="font-family:'JetBrains Mono',monospace">${re.toFixed(3)}</td>
      <td>
        <div class="f1-bar">
          <div class="f1-bg"><div class="f1-fill ${rating}" data-width="${Math.round(f1*100)}" style="width:0%"></div></div>
          <span style="font-family:'JetBrains Mono',monospace;font-size:0.82rem">${f1.toFixed(3)}</span>
        </div>
      </td>
      <td><span class="rating-badge ${rating}">${ratingLabels[rating]}</span></td>
    `;
    tbody.appendChild(row);
    setTimeout(() => {
      row.querySelectorAll('.f1-fill[data-width]').forEach(b => { b.style.width = b.dataset.width + '%'; });
    }, 400);
  });
}

// ── Verdict ───────────────────────────────────────────────
function renderVerdict(tools, agg) {
  // Already hardcoded in HTML — just ensure correct from data if available
  const bestSAST = agg.best_sast || 'semgrep';
  const bestDAST = agg.best_dast || 'owasp_zap';

  if (tools[bestSAST]) {
    const d = tools[bestSAST];
    const el = document.getElementById('bestSASTName');
    if (el) el.textContent = d.tool_label || bestSAST;
    const r = document.getElementById('bestSASTReason');
    if (r && d.verdict_reason) r.textContent = d.verdict_reason;
  }
  if (tools[bestDAST]) {
    const d = tools[bestDAST];
    const el = document.getElementById('bestDASTName');
    if (el) el.textContent = d.tool_label || bestDAST;
    const r = document.getElementById('bestDASTReason');
    if (r && d.verdict_reason) r.textContent = d.verdict_reason;
  }

  // Trigger verdict bar animations
  setTimeout(() => {
    document.querySelectorAll('.verdict-fill[data-width]').forEach(b => {
      b.style.width = b.dataset.width + '%';
    });
  }, 500);
}

// ════════════════════════════════════
// GITHUB ACTIONS API — LIVE STATUS
// ════════════════════════════════════
async function fetchPipelineStatus() {
  const dot = document.getElementById('pulseDot');
  const txt = document.getElementById('navStatusText');

  try {
    const res = await fetch(`${GH_API_BASE}/actions/runs?per_page=30`, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });

    if (!res.ok) {
      setNavStatus('error', dot, txt, 'API limit reached');
      setAllPillsManual();
      return;
    }

    const data = await res.json();
    const runs = data.workflow_runs || [];
    let anySuccess = false;

    // Match workflow file names to cards
    WORKFLOW_MAP.forEach(({ file, pill, meta }) => {
      const matching = runs.filter(r => r.path?.includes(file) || r.name?.toLowerCase().includes(file.replace('.yml','')));
      const latest = matching[0];
      const pillEl = document.getElementById(pill);
      const metaEl = document.getElementById(meta);

      if (!pillEl) return;
      pillEl.classList.remove('skeleton');

      if (!latest) {
        pillEl.textContent = '⏳ Pending';
        if (metaEl) metaEl.textContent = 'Not yet run';
        return;
      }

      const status = latest.conclusion || latest.status;
      pillEl.textContent = STATUS_LABELS[status] || status;
      pillEl.className = `wf-status-pill ${status === 'success' ? 'success' : status === 'failure' ? 'failure' : status === 'in_progress' ? 'in_progress' : ''}`;
      if (metaEl) metaEl.textContent = timeAgo(latest.created_at);
      if (status === 'success') anySuccess = true;
    });

    setNavStatus(anySuccess ? 'live' : 'partial', dot, txt,
      anySuccess ? 'Live · All workflows running' : 'Live · Some workflows pending');

  } catch (e) {
    console.warn('GitHub API error:', e);
    setNavStatus('error', dot, txt, 'Offline mode');
    setAllPillsManual();
  }
}

const STATUS_LABELS = {
  success: '✅ Success', failure: '❌ Failed',
  in_progress: '⏳ Running', queued: '⏳ Queued',
  cancelled: '🚫 Cancelled', skipped: '⏭ Skipped'
};

function setNavStatus(mode, dot, txt, label) {
  if (!dot || !txt) return;
  dot.className = 'pulse-dot' + (mode === 'error' ? ' error' : mode === 'partial' ? ' loading' : '');
  txt.textContent = label;
}

function setAllPillsManual() {
  WORKFLOW_MAP.forEach(({ pill }) => {
    const el = document.getElementById(pill);
    if (el) { el.textContent = '— Manual check'; el.classList.remove('skeleton'); }
  });
}

// ════════════════════════════════════
// COUNTDOWN & AUTO-REFRESH
// ════════════════════════════════════
function startRefreshCountdown() {
  refreshTimer = REFRESH_INTERVAL;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    refreshTimer--;
    const el = document.getElementById('refreshCountdown');
    if (el) el.textContent = refreshTimer;
    if (refreshTimer <= 0) {
      fetchPipelineStatus();
      refreshTimer = REFRESH_INTERVAL;
    }
  }, 1000);
}

// ════════════════════════════════════
// HELPERS
// ════════════════════════════════════
function formatTTD(seconds) {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
