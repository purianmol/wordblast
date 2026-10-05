/* =====================================================
   common.js – Shared helpers: navbar, theme, footer year
   Runs on every page. Load after storage.js.
   ===================================================== */

// ---- Theme ----

/**
 * Applies the given theme ('dark' | 'light') to the <html> element
 * and updates the toggle button icon.
 * @param {string} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
}

/**
 * Toggles between dark and light theme, then saves the choice
 * to the 'wb_theme' cookie (365 days).
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  setCookie('wb_theme', next, 365);
}

// ---- Navbar ----

/**
 * Initialises the hamburger menu toggle.
 */
function initNav() {
  const hamburger = document.getElementById('hamburgerBtn');
  const navLinks  = document.getElementById('navLinks');

  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav when a link is clicked (mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---- Footer year ----

function initFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

// ---- Init on load ----

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  const savedTheme = getCookie('wb_theme') || 'dark';
  applyTheme(savedTheme);

  // Wire up theme toggle button
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Init hamburger
  initNav();

  // Footer year
  initFooterYear();
});
