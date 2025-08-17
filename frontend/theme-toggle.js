(function(){
  const root = document.documentElement;
  const body = document.body;
  const key = 'psyzon_theme';
  const current = localStorage.getItem(key) || (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  if (current === 'dark') body.classList.add('theme-dark');

  window.toggleTheme = function(){
    if (body.classList.toggle('theme-dark')) {
      localStorage.setItem(key, 'dark');
    } else {
      localStorage.setItem(key, 'light');
    }
  };

  // auto-register any toggle buttons with data-theme-toggle
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-theme-toggle]');
    if (t) { e.preventDefault(); toggleTheme(); }
  });
})();


<button class="btn secondary" data-theme-toggle title="Alternar tema">🌗 Tema</button>