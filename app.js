// AI News Digest PWA — fetches markdown digests from the same-origin ./digests/ folder
// and renders them. No backend; works offline via sw.js once cached.
'use strict';

const content = document.getElementById('content');
const tabs = document.querySelectorAll('.tab');

marked.setOptions({ breaks: false, gfm: true });

// Open links in a new tab and keep the app view intact.
const renderer = new marked.Renderer();
const origLink = renderer.link.bind(renderer);
renderer.link = (href, title, text) => {
  const html = origLink(href, title, text);
  return html.replace(/^<a /, '<a target="_blank" rel="noopener" ');
};

function mdToHtml(md) {
  return marked.parse(md, { renderer });
}

async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}
async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function setActiveTab(view) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.view === view));
}

async function showToday() {
  setActiveTab('today');
  content.innerHTML = '<div class="status">Loading today’s digest…</div>';
  try {
    const md = await fetchText('./digests/latest.md');
    localStorage.setItem('lastDigest', md);
    renderDigest(md);
  } catch (e) {
    const cached = localStorage.getItem('lastDigest');
    if (cached) {
      renderDigest(cached, true);
    } else {
      content.innerHTML = `<div class="status">Couldn’t load the digest and nothing is cached yet.<br><small>${e.message}</small></div>`;
    }
  }
}

function renderDigest(md, stale) {
  const when = new Date().toLocaleString();
  content.innerHTML =
    `<article class="digest">${mdToHtml(md)}</article>` +
    `<div class="refreshed">${stale ? 'Showing last saved copy (offline) · ' : ''}Updated ${when}</div>`;
  window.scrollTo(0, 0);
}

async function showHistory() {
  setActiveTab('history');
  content.innerHTML = '<div class="status">Loading history…</div>';
  try {
    const items = await fetchJSON('./digests/index.json');
    if (!Array.isArray(items) || !items.length) {
      content.innerHTML = '<div class="status">No past digests yet.</div>';
      return;
    }
    content.innerHTML = items.map(d => `
      <div class="history-item" data-date="${d.date}">
        <span class="date">${d.date}</span>
        <span class="count">${d.article_count ?? ''} articles ›</span>
      </div>`).join('');
    content.querySelectorAll('.history-item').forEach(el =>
      el.addEventListener('click', () => showDated(el.dataset.date)));
  } catch (e) {
    content.innerHTML = `<div class="status">Couldn’t load history.<br><small>${e.message}</small></div>`;
  }
}

async function showDated(date) {
  content.innerHTML = '<div class="status">Loading…</div>';
  try {
    const md = await fetchText(`./digests/${date}.md`);
    content.innerHTML =
      `<a class="backlink" id="back">‹ History</a>` +
      `<article class="digest">${mdToHtml(md)}</article>`;
    document.getElementById('back').addEventListener('click', showHistory);
    window.scrollTo(0, 0);
  } catch (e) {
    content.innerHTML = `<div class="status">Couldn’t load ${date}.<br><small>${e.message}</small></div>`;
  }
}

tabs.forEach(t => t.addEventListener('click', () =>
  t.dataset.view === 'today' ? showToday() : showHistory()));

// Pull-to-refresh is native in standalone PWAs; also refresh on focus/visibility.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && document.querySelector('.tab.active')?.dataset.view === 'today') showToday();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

showToday();
