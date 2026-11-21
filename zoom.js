// Text-size control for the headline digest (A− / A / A+).
// Shared source: the iPhone web app loads this file, and utils/html_export.py inlines it
// into the Mac page. The scale is remembered per device; if storage is blocked the page
// simply opens at 100%.
(function () {
  'use strict';
  var STEPS = [0.8, 1, 1.2, 1.4, 1.6];
  var KEY = 'hlTextScale';

  function load() {
    try {
      var v = parseFloat(localStorage.getItem(KEY));
      return STEPS.indexOf(v) >= 0 ? v : 1;
    } catch (_) { return 1; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, String(v)); } catch (_) {}
  }
  function apply(v) {
    document.documentElement.style.setProperty('--hl-scale', String(v));
    var pct = Math.round(v * 100) + '%';
    var labels = document.querySelectorAll('.hl-zoom-pct');
    for (var i = 0; i < labels.length; i++) labels[i].textContent = pct;
  }

  var current = load();
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-zoom]');
    if (!btn) return;
    var step = parseInt(btn.getAttribute('data-zoom'), 10);
    var i = STEPS.indexOf(current);
    current = step === 0 ? 1 : STEPS[Math.max(0, Math.min(STEPS.length - 1, i + step))];
    save(current);
    apply(current);
  });

  // Re-apply after content is swapped in (the web app renders the digest after load).
  window.hlApplyZoom = function () { apply(current); };
  apply(current);
})();
