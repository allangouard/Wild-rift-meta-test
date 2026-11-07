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
    '.wrdi-native-mini [hidden]{display:none!important}',
    /* Floating picker: scale every child, not only its outer sheet. */
    '.wrdi-native-mini .wrdi-picker-overlay{inset:0!important;align-items:stretch!important;justify-content:stretch!important}',
    '.wrdi-native-mini .wrdi-picker-backdrop{background:rgba(6,18,25,.86)!important;backdrop-filter:none!important}',
    '.wrdi-native-mini .wrdi-picker-sheet{height:100%!important;max-height:100%!important;width:100%!important;max-width:none!important;border-radius:10px!important;animation:none!important;border:1px solid #365965!important}',
    '.wrdi-native-mini .wrdi-picker-sticky{padding:5px 8px 7px!important;flex:0 0 auto!important}',
    '.wrdi-native-mini .wrdi-picker-handle{display:none!important}',
    '.wrdi-native-mini .wrdi-picker-overline{display:none!important}',
    '.wrdi-native-mini .wrdi-picker-header h2{font-size:14px!important;line-height:1.2!important;margin:0!important}',
    '.wrdi-native-mini .wrdi-picker-header{gap:5px!important}',
    '.wrdi-native-mini .wrdi-picker-close{width:29px!important;height:29px!important;min-width:29px!important;min-height:29px!important;padding:0!important;font-size:15px!important;border-radius:7px!important}',
    '.wrdi-native-mini .wrdi-picker-search{height:34px!important;min-height:34px!important;font-size:12px!important;padding:5px 9px!important;margin-top:6px!important;border-radius:8px!important}',
    '.wrdi-native-mini .wrdi-picker-scroll{padding:5px 7px 10px!important;min-height:0!important;overflow-y:auto!important;flex:1 1 auto!important}',
    '.wrdi-native-mini .wrdi-picker-label{display:none!important}',
    '.wrdi-native-mini .wrdi-picker-scroll>.wrdi-picker-filters:nth-child(4){display:none!important}',
    '.wrdi-native-mini .wrdi-picker-filters{padding-bottom:3px!important;margin:0 0 3px!important;gap:4px!important}',
    '.wrdi-native-mini .wrdi-filter-chip{min-height:26px!important;padding:4px 7px!important;font-size:10px!important;white-space:nowrap!important}',
    '.wrdi-native-mini .wrdi-picker-count{font-size:9px!important;margin:0 0 5px!important}',
    '.wrdi-native-mini .wrdi-picker-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important}',
    '.wrdi-native-mini .wrdi-champion-card{min-width:0!important;padding:5px 2px 4px!important;gap:3px!important;border-radius:8px!important;box-shadow:none!important}',
    '.wrdi-native-mini .wrdi-champion-card .card-portrait{width:clamp(35px,11vw,45px)!important;height:clamp(35px,11vw,45px)!important;min-width:0!important;max-width:45px!important;aspect-ratio:1!important;border-radius:8px!important;margin:0!important}',
    '.wrdi-native-mini .wrdi-champion-name{font-size:9px!important;line-height:1.15!important;max-width:100%!important;overflow-wrap:anywhere!important}',
    '.wrdi-native-mini .wrdi-champion-sub,.wrdi-native-mini .wrdi-champion-tag{display:none!important}',
    '.wrdi-native-mini .wrdi-picker-empty{font-size:11px!important;padding:12px 8px!important}',
    '.wrdi-native-mini .wrdi-rune-keystone{gap:6px!important;padding:7px!important}',
    '.wrdi-native-mini .wrdi-rune-portrait{width:31px!important;height:31px!important}',
    '.wrdi-native-mini .wrdi-rune-tile{padding:4px!important;gap:5px!important}',
    '.wrdi-native-mini .wrdi-rune-keyname{font-size:12px!important}',
    '.wrdi-native-mini .ep-summary-section .wrdi-item-portrait{width:36px!important;height:36px!important}',
    '.wrdi-native-mini .ep-summary-section .wrdi-swap-item-name{font-size:10px!important}',
    '.wrdi-native-mini .ep-summary-section .ep-build-media{max-width:44px!important}',
    '.wrdi-native-mini .ep-result-hero{margin:0!important}',
    '.wrdi-native-mini .ep-full-report{display:none!important}',
    '.wrdi-native-mini .ep-why{display:none!important}',
    '.wrdi-native-mini .ep-summary-section .wrdi-swap-card:nth-of-type(n+3){display:none!important}',
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
