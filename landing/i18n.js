/* PurgeQ EN/FR toggle — every translatable node carries data-i18n="<key>" */
(function () {
  const STORAGE_KEY = 'purgeq.lang';
  const DEFAULT = 'en';

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT;
  }

  function applyLang(lang) {
    const dict = window.PURGEQ_STRINGS && window.PURGEQ_STRINGS[lang];
    if (!dict) return;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] != null) {
        if (el.hasAttribute('data-i18n-html')) el.innerHTML = dict[key];
        else el.textContent = dict[key];
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] != null) el.placeholder = dict[key];
    });
    document.querySelectorAll('.lang-switch [data-lang]').forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-lang') === lang);
    });
    localStorage.setItem(STORAGE_KEY, lang);
  }

  window.PurgeQI18n = { apply: applyLang, get: getLang };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-switch [data-lang]').forEach((b) => {
      b.addEventListener('click', () => applyLang(b.getAttribute('data-lang')));
    });
    applyLang(getLang());
  });
})();
