/* Presentation only; operates on the already-rendered V19.5 result. */
(function () {
  'use strict';
  if (window.__wrdiMiniUI) return;
  window.__wrdiMiniUI = true;
  const draft = document.querySelector('section[aria-label="Saisie de la draft"]');
  const result = document.getElementById('wrdi-result');
  if (!draft || !result) return;
  document.documentElement.classList.add('wrdi-native-mini');
  const styles = document.createElement('style');
  styles.id = 'wrdi-native-mini-ui';
  styles.textContent = [
    'html.wrdi-native-mini #wrdi-v15{padding:4px!important}',
    '.wrdi-native-mini .ep-result-hero{margin:0!important}',
    '.wrdi-native-mini .ep-full-report{display:none!important}',
    '.wrdi-native-mini .ep-why{display:none!important}',
    '.wrdi-native-mini .ep-item-detail{display:none!important}',
    '.wrdi-native-mini .ep-source-info{display:none!important}',
    '.wrdi-native-mini .ep-threats{display:none!important}',
    '.wrdi-native-mini .ep-footnote{display:none!important}',
    '.wrdi-native-mini .ep-summary-section .wrdi-swap-card:nth-of-type(n+3){display:none!important}',
    '.wrdi-native-mini .ep-summary-section{margin-bottom:3px!important}',
    '.wrdi-native-mini #wrdi-result .ep-mini-controls{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px;border-radius:10px;background:#1c4551;border:1px solid #54877c}',
    '.wrdi-native-mini .ep-mini-controls strong{font-size:12px;color:#d1f4eb}',
    '.wrdi-native-mini .ep-mini-back{border:1px solid #76dbc7;border-radius:8px;padding:9px 12px;background:#14313e;color:#a9eadd;font-size:12px;font-weight:bold}',
    '.wrdi-native-mini #wrdi-result .ep-summary-section h3{font-size:13px!important}',
    '.wrdi-native-mini .wrdi-swap-item-state{display:none!important}',
    '.wrdi-native-mini .ep-build-name{font-size:10px!important}',
    '.wrdi-native-mini .wrdi-rune-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}'
  ].join('\n');
  document.head.appendChild(styles);
  let showingResult = false;
  function showResults() {
    if (!result.querySelector('.ep-result-layout')) return;
    if (!result.querySelector('.ep-mini-controls')) {
      const bar = document.createElement('div');
      bar.className = 'ep-mini-controls';
      const name = document.createElement('strong');
      name.textContent = '✓ Build et runes';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'ep-mini-back';
      back.textContent = '← Draft';
      back.addEventListener('click', () => {
        showingResult = false;
        draft.hidden = false;
        result.hidden = true;
        window.scrollTo(0, 0);
      });
      bar.append(name, back);
      result.prepend(bar);
    }
    showingResult = true;
    draft.hidden = true;
    result.hidden = false;
    window.scrollTo(0, 0);
  }
  const observer = new MutationObserver(() => {
    // Only observe immediate child replacement; avoid feedback loops on updates.
    if (result.querySelector('.ep-result-layout') && !showingResult) showResults();
    if (!result.querySelector('.ep-result-layout') && showingResult) {
      showingResult = false;
      draft.hidden = false;
      result.hidden = false;
    }
  });
  observer.observe(result, { childList: true });
  showResults();
})();
