'use client'

export function ThemeToggle() {
  function toggleTheme() {
    const currentTheme =
      document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    try { window.localStorage.setItem('triplecode-theme', nextTheme) } catch {}
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Переключить цветовую тему"
      title="Переключить цветовую тему"
    >
      <svg className="theme-icon theme-icon-sun" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="3.25" />
        <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16" />
      </svg>
      <svg className="theme-icon theme-icon-moon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M16.8 12.4A7 7 0 0 1 7.6 3.2a7 7 0 1 0 9.2 9.2Z" />
      </svg>
    </button>
  )
}
