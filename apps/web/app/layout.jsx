import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: { template: '%s · TripleCode', default: 'TripleCode — AI-агент в вашей среде разработки' },
  description: 'Редактор, терминал и AI-агент в одном рабочем процессе.',
  icons: { icon: '/favicon.svg' },
};

const themeScript = `
  try {
    const saved = localStorage.getItem('triplecode-theme');
    document.documentElement.dataset.theme = saved === 'light' || saved === 'dark'
      ? saved
      : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Script id="triplecode-theme" strategy="beforeInteractive">{themeScript}</Script>
        <a className="skip-link" href="#main">К содержимому</a>
        {children}
      </body>
    </html>
  );
}
